import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface RatioConfig {
  ratio_id: string;
  display_name: string;
  category: "commodity" | "equity" | "crypto" | "latam_fx";
  numerator: string;       // Yahoo symbol or "BTC"/"ETH" for crypto
  denominator: string;
  invert?: boolean;        // if true, compute denom/num
  notes?: string;
}

const RATIOS: RatioConfig[] = [
  // COMMODITY RATIOS
  { ratio_id: "GOLD_SILVER", display_name: "Gold / Silver", category: "commodity", numerator: "GC=F", denominator: "SI=F", notes: "Classic monetary stress gauge. >85 = silver cheap" },
  { ratio_id: "COPPER_GOLD", display_name: "Copper / Gold", category: "commodity", numerator: "HG=F", denominator: "GC=F", notes: "Growth vs safety. Rising = risk-on" },
  { ratio_id: "OIL_GOLD", display_name: "Oil / Gold (WTI)", category: "commodity", numerator: "CL=F", denominator: "GC=F", notes: "Inflation cycle indicator" },
  { ratio_id: "GAS_OIL", display_name: "NatGas / Oil", category: "commodity", numerator: "NG=F", denominator: "CL=F", notes: "Energy mix shift" },
  { ratio_id: "PLAT_GOLD", display_name: "Platinum / Gold", category: "commodity", numerator: "PL=F", denominator: "GC=F", notes: "Industrial vs monetary metal" },

  // EQUITY RATIOS
  { ratio_id: "SPY_GLD", display_name: "SPY / GLD", category: "equity", numerator: "SPY", denominator: "GLD", notes: "Stocks vs gold. Rising = risk-on" },
  { ratio_id: "IWM_SPY", display_name: "IWM / SPY", category: "equity", numerator: "IWM", denominator: "SPY", notes: "Small caps vs large. Rising = risk-on" },
  { ratio_id: "QQQ_SPY", display_name: "QQQ / SPY", category: "equity", numerator: "QQQ", denominator: "SPY", notes: "Tech leadership" },
  { ratio_id: "HYG_LQD", display_name: "HYG / LQD", category: "equity", numerator: "HYG", denominator: "LQD", notes: "Junk vs investment-grade credit. Rising = risk-on" },
  { ratio_id: "XLK_XLU", display_name: "XLK / XLU", category: "equity", numerator: "XLK", denominator: "XLU", notes: "Tech vs utilities. Rising = risk-on" },
  { ratio_id: "XLY_XLP", display_name: "XLY / XLP", category: "equity", numerator: "XLY", denominator: "XLP", notes: "Discretionary vs staples. Rising = risk-on" },
  { ratio_id: "TLT_SPY", display_name: "TLT / SPY", category: "equity", numerator: "TLT", denominator: "SPY", notes: "Long bonds vs stocks. Rising = risk-off" },
  { ratio_id: "EEM_SPY", display_name: "EEM / SPY", category: "equity", numerator: "EEM", denominator: "SPY", notes: "EM vs US stocks" },

  // CRYPTO RATIOS
  { ratio_id: "BTC_GOLD", display_name: "BTC / Gold (oz)", category: "crypto", numerator: "BTC-USD", denominator: "GC=F", notes: "Digital vs physical store of value" },
  { ratio_id: "ETH_BTC", display_name: "ETH / BTC", category: "crypto", numerator: "ETH-USD", denominator: "BTC-USD", notes: "Alt season indicator. Rising = alts lead" },
  { ratio_id: "BTC_SPY", display_name: "BTC / SPY", category: "crypto", numerator: "BTC-USD", denominator: "SPY", notes: "Crypto vs equities risk appetite" },
  { ratio_id: "BTC_QQQ", display_name: "BTC / QQQ", category: "crypto", numerator: "BTC-USD", denominator: "QQQ", notes: "Crypto vs tech beta" },

  // LATAM FX RATIOS (using Yahoo FX pairs - USD strength = denominator higher = ratio invert behavior)
  { ratio_id: "MXN_DXY", display_name: "MXN vs DXY", category: "latam_fx", numerator: "DX-Y.NYB", denominator: "MXN=X", notes: "DXY strength relative to peso" },
  { ratio_id: "BRL_DXY", display_name: "BRL vs DXY", category: "latam_fx", numerator: "DX-Y.NYB", denominator: "BRL=X", notes: "DXY strength relative to real" },
  { ratio_id: "CLP_COPPER", display_name: "CLP vs Copper", category: "latam_fx", numerator: "CLP=X", denominator: "HG=F", notes: "Chilean peso vs copper (historical correlation ~-0.85)" },
  { ratio_id: "BRL_OIL", display_name: "BRL vs Oil", category: "latam_fx", numerator: "BRL=X", denominator: "CL=F", notes: "Brazil as petro-economy" },
  { ratio_id: "MXN_OIL", display_name: "MXN vs Oil", category: "latam_fx", numerator: "MXN=X", denominator: "CL=F", notes: "Mexico as petro-economy" },
  { ratio_id: "EM_DXY", display_name: "EEM vs DXY", category: "latam_fx", numerator: "EEM", denominator: "DX-Y.NYB", notes: "EM equities vs USD strength" },
];

// Yahoo Finance v8 chart API - 5Y daily closes
async function fetchCloses(symbol: string): Promise<{ ts: number; close: number }[]> {
  const period2 = Math.floor(Date.now() / 1000);
  const period1 = period2 - 5 * 365 * 24 * 60 * 60; // 5 years
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${period1}&period2=${period2}&interval=1d`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
  });
  if (!res.ok) throw new Error(`Yahoo ${symbol}: ${res.status}`);
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error(`Yahoo ${symbol}: no result`);
  const ts: number[] = result.timestamp ?? [];
  const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];
  return ts
    .map((t, i) => ({ ts: t, close: closes[i] as number }))
    .filter((p) => p.close !== null && p.close !== undefined && Number.isFinite(p.close));
}

function computeStats(values: number[]) {
  const n = values.length;
  if (n < 30) return null;
  const mean = values.reduce((s, v) => s + v, 0) / n;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const current = values[values.length - 1];
  const idx = sorted.findIndex((v) => v >= current);
  const percentile = idx === -1 ? 100 : (idx / n) * 100;
  const z = std === 0 ? 0 : (current - mean) / std;
  return { mean, std, min, max, percentile, z, current };
}

function pctChange(series: number[], lookback: number): number | null {
  if (series.length <= lookback) return null;
  const cur = series[series.length - 1];
  const past = series[series.length - 1 - lookback];
  if (!past) return null;
  return ((cur - past) / past) * 100;
}

async function processRatio(cfg: RatioConfig) {
  const [numCloses, denCloses] = await Promise.all([
    fetchCloses(cfg.numerator),
    fetchCloses(cfg.denominator),
  ]);

  // Align by DATE string (YYYY-MM-DD) — different markets have different session timestamps
  const toDate = (ts: number) => new Date(ts * 1000).toISOString().slice(0, 10);
  const denMap = new Map(denCloses.map((p) => [toDate(p.ts), p.close]));
  const aligned: { ts: number; ratio: number }[] = [];
  for (const p of numCloses) {
    const d = denMap.get(toDate(p.ts));
    if (d && d !== 0) aligned.push({ ts: p.ts, ratio: p.close / d });
  }
  if (aligned.length < 30) throw new Error(`${cfg.ratio_id}: only ${aligned.length} aligned points`);

  const ratios = aligned.map((p) => p.ratio);
  const stats = computeStats(ratios);
  if (!stats) throw new Error(`${cfg.ratio_id}: stats failed`);

  const last90 = aligned.slice(-90).map((p) => ({
    date: new Date(p.ts * 1000).toISOString().slice(0, 10),
    value: p.ratio,
  }));

  return {
    ratio_id: cfg.ratio_id,
    display_name: cfg.display_name,
    category: cfg.category,
    numerator_symbol: cfg.numerator,
    denominator_symbol: cfg.denominator,
    current_value: stats.current,
    mean_5y: stats.mean,
    std_5y: stats.std,
    min_5y: stats.min,
    max_5y: stats.max,
    percentile_5y: stats.percentile,
    z_score: stats.z,
    change_pct_1d: pctChange(ratios, 1),
    change_pct_1w: pctChange(ratios, 5),
    change_pct_1m: pctChange(ratios, 21),
    change_pct_3m: pctChange(ratios, 63),
    history_90d: last90,
    notes: cfg.notes ?? null,
    fetched_at: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const results: any[] = [];
  let success = 0;
  let failed = 0;

  // Process in small batches to avoid Yahoo rate limiting
  const batchSize = 4;
  for (let i = 0; i < RATIOS.length; i += batchSize) {
    const batch = RATIOS.slice(i, i + batchSize);
    const settled = await Promise.allSettled(batch.map(processRatio));
    for (let j = 0; j < settled.length; j++) {
      const cfg = batch[j];
      const r = settled[j];
      if (r.status === "fulfilled") {
        const { error } = await supabase
          .from("ratio_snapshots")
          .upsert(r.value, { onConflict: "ratio_id" });
        if (error) {
          failed++;
          results.push({ ratio_id: cfg.ratio_id, status: "db_error", error: error.message });
        } else {
          success++;
          results.push({ ratio_id: cfg.ratio_id, status: "ok", z: r.value.z_score?.toFixed(2) });
        }
      } else {
        failed++;
        results.push({ ratio_id: cfg.ratio_id, status: "fetch_error", error: String(r.reason) });
      }
    }
    if (i + batchSize < RATIOS.length) await new Promise((r) => setTimeout(r, 600));
  }

  return new Response(
    JSON.stringify({ success, failed, total: RATIOS.length, results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
