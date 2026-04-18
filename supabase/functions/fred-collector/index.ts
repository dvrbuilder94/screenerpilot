import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FRED_API_KEY = Deno.env.get("FRED_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface SeriesConfig {
  series_id: string;
  display_name: string;
  category: "fed" | "latam";
  country?: string;
  unit?: string;
  notes?: string;
  transform?: "none" | "yoy_pct"; // YoY % change for CPI/PCE levels
}

const FRED_SERIES: SeriesConfig[] = [
  // FED & US MACRO
  { series_id: "DFF", display_name: "Fed Funds Rate", category: "fed", unit: "%", notes: "Effective Fed Funds Rate (daily)" },
  { series_id: "CPIAUCSL", display_name: "CPI YoY", category: "fed", unit: "%", notes: "Headline CPI, YoY % change", transform: "yoy_pct" },
  { series_id: "CPILFESL", display_name: "Core CPI YoY", category: "fed", unit: "%", notes: "Core CPI ex Food & Energy, YoY", transform: "yoy_pct" },
  { series_id: "PCEPI", display_name: "PCE YoY", category: "fed", unit: "%", notes: "PCE Price Index YoY", transform: "yoy_pct" },
  { series_id: "PCEPILFE", display_name: "Core PCE YoY", category: "fed", unit: "%", notes: "Fed's preferred inflation gauge", transform: "yoy_pct" },
  { series_id: "PAYEMS", display_name: "Nonfarm Payrolls (Δ)", category: "fed", unit: "K jobs", notes: "Monthly change in nonfarm payrolls" },
  { series_id: "UNRATE", display_name: "Unemployment Rate", category: "fed", unit: "%", notes: "U-3 unemployment rate" },
  { series_id: "GDPC1", display_name: "Real GDP QoQ SAAR", category: "fed", unit: "%", notes: "Real GDP, QoQ annualized" },
  { series_id: "M2SL", display_name: "M2 Money Supply", category: "fed", unit: "$B", notes: "M2 broad money supply" },
  { series_id: "WALCL", display_name: "Fed Balance Sheet", category: "fed", unit: "$M", notes: "Fed total assets (QT/QE)" },
  { series_id: "RRPONTSYD", display_name: "Reverse Repo (RRP)", category: "fed", unit: "$B", notes: "ON RRP facility usage" },

  // LATAM - Mexico
  { series_id: "INTDSRMXM193N", display_name: "Banxico Policy Rate", category: "latam", country: "MX", unit: "%", notes: "Mexico central bank rate" },
  { series_id: "MEXCPIALLMINMEI", display_name: "Mexico CPI YoY", category: "latam", country: "MX", unit: "%", transform: "yoy_pct" },
  // LATAM - Brazil
  { series_id: "INTDSRBRM193N", display_name: "Selic Rate (BCB)", category: "latam", country: "BR", unit: "%", notes: "Brazil central bank rate" },
  { series_id: "BRACPIALLMINMEI", display_name: "Brazil CPI YoY", category: "latam", country: "BR", unit: "%", transform: "yoy_pct" },
  // LATAM - Chile
  { series_id: "IRSTCI01CLM156N", display_name: "BCCh Policy Rate", category: "latam", country: "CL", unit: "%", notes: "Chile central bank rate" },
  { series_id: "CHLCPIALLMINMEI", display_name: "Chile CPI YoY", category: "latam", country: "CL", unit: "%", transform: "yoy_pct" },
  // LATAM - Colombia
  { series_id: "IRSTCI01COM156N", display_name: "BanRep Policy Rate", category: "latam", country: "CO", unit: "%", notes: "Colombia central bank rate" },
  { series_id: "COLCPIALLMINMEI", display_name: "Colombia CPI YoY", category: "latam", country: "CO", unit: "%", transform: "yoy_pct" },
];

async function fetchFredSeries(series_id: string) {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${series_id}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=24`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FRED ${series_id}: ${res.status}`);
  const data = await res.json();
  return (data.observations ?? [])
    .filter((o: any) => o.value !== "." && o.value !== null)
    .map((o: any) => ({ date: o.date, value: parseFloat(o.value) }));
}

async function fetchSeriesMeta(series_id: string) {
  const url = `https://api.stlouisfed.org/fred/series?series_id=${series_id}&api_key=${FRED_API_KEY}&file_type=json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return data.seriess?.[0] ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const results: any[] = [];
  let success = 0;
  let failed = 0;

  for (const cfg of FRED_SERIES) {
    try {
      const obs = await fetchFredSeries(cfg.series_id);
      if (obs.length === 0) {
        failed++;
        results.push({ series_id: cfg.series_id, status: "no_data" });
        continue;
      }

      let history: { date: string; value: number }[];
      let current: number;
      let previous: number;
      let observation_date: string;

      if (cfg.transform === "yoy_pct") {
        // Need YoY: compare each obs to ~12 months ago
        const yoy: { date: string; value: number }[] = [];
        for (let i = 0; i < obs.length - 12; i++) {
          const cur = obs[i].value;
          const prev = obs[i + 12].value;
          if (prev && prev !== 0) {
            yoy.push({ date: obs[i].date, value: ((cur - prev) / prev) * 100 });
          }
        }
        if (yoy.length < 2) { failed++; continue; }
        history = yoy.slice(0, 12).reverse();
        current = yoy[0].value;
        previous = yoy[1].value;
        observation_date = yoy[0].date;
      } else if (cfg.series_id === "PAYEMS") {
        // NFP: monthly delta in thousands
        const deltas: { date: string; value: number }[] = [];
        for (let i = 0; i < obs.length - 1; i++) {
          deltas.push({ date: obs[i].date, value: obs[i].value - obs[i + 1].value });
        }
        if (deltas.length < 2) { failed++; continue; }
        history = deltas.slice(0, 12).reverse();
        current = deltas[0].value;
        previous = deltas[1].value;
        observation_date = deltas[0].date;
      } else {
        history = obs.slice(0, 12).reverse();
        current = obs[0].value;
        previous = obs[1]?.value ?? obs[0].value;
        observation_date = obs[0].date;
      }

      const meta = await fetchSeriesMeta(cfg.series_id);
      const change_value = current - previous;
      const change_pct = previous !== 0 ? (change_value / Math.abs(previous)) * 100 : 0;

      const { error } = await supabase
        .from("macro_indicators")
        .upsert({
          series_id: cfg.series_id,
          display_name: cfg.display_name,
          category: cfg.category,
          country: cfg.country ?? null,
          current_value: current,
          previous_value: previous,
          change_value,
          change_pct,
          observation_date,
          frequency: meta?.frequency_short ?? null,
          unit: cfg.unit ?? meta?.units_short ?? null,
          history,
          notes: cfg.notes ?? meta?.title ?? null,
          fetched_at: new Date().toISOString(),
        }, { onConflict: "series_id" });

      if (error) {
        failed++;
        results.push({ series_id: cfg.series_id, status: "db_error", error: error.message });
      } else {
        success++;
        results.push({ series_id: cfg.series_id, status: "ok", current });
      }

      await new Promise((r) => setTimeout(r, 100)); // rate limit gentle
    } catch (e) {
      failed++;
      results.push({ series_id: cfg.series_id, status: "error", error: String(e) });
    }
  }

  return new Response(
    JSON.stringify({ success, failed, total: FRED_SERIES.length, results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
