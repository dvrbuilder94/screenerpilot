import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const MODEL = "google/gemini-2.5-flash";

// Region/category grouping based on symbol patterns
function classifyRegion(s: any): string {
  const sym = (s.symbol || "").toUpperCase();
  const cat = (s.category || "").toLowerCase();
  const reg = (s.region || "").toLowerCase();

  if (cat.includes("crypto") || /BTC|ETH|SOL|BNB|XRP|DOGE/.test(sym)) return "crypto";
  if (cat.includes("commodit") || /GC=|CL=|SI=|HG=|NG=|GOLD|OIL|COPPER|SILVER/.test(sym)) return "commodities";
  if (cat.includes("rate") || cat.includes("bond") || cat.includes("fx") || /\^TNX|\^TYX|\^IRX|DXY|=X|EURUSD|USDJPY/.test(sym)) return "rates_fx";
  if (reg.includes("eu") || /\^STOXX|\^GDAXI|\^FTSE|\^FCHI|\^IBEX|DAX|CAC/.test(sym)) return "europe";
  if (reg.includes("as") || /\^N225|\^HSI|\^KS11|\^TWII|\^BSESN|NIKKEI|HSI|SHCOMP/.test(sym)) return "asia";
  if (reg.includes("latam") || /\^BVSP|\^MXX|\^MERV|BOVESPA|BVSP|MERVAL/.test(sym)) return "americas_ex_us";
  if (reg.includes("us") || /\^GSPC|\^DJI|\^IXIC|\^RUT|SPX|SPY|QQQ|DIA|IWM/.test(sym)) return "united_states";
  return "other";
}

async function fetchContext(supabase: ReturnType<typeof createClient>) {
  const [snapshots, macro, ratios] = await Promise.all([
    supabase
      .from("market_snapshots")
      .select("symbol,display_name,category,region,change_pct_1d,change_pct_1w,current_price")
      .order("fetched_at", { ascending: false })
      .limit(300),
    supabase
      .from("macro_indicators")
      .select("display_name,category,current_value,previous_value,change_pct,unit")
      .order("updated_at", { ascending: false })
      .limit(40),
    supabase
      .from("ratio_snapshots")
      .select("display_name,current_value,change_pct_1d,change_pct_1w,z_score,percentile_5y")
      .order("updated_at", { ascending: false })
      .limit(20),
  ]);

  const snaps = snapshots.data ?? [];

  const groups: Record<string, any[]> = {
    united_states: [],
    europe: [],
    asia: [],
    americas_ex_us: [],
    rates_fx: [],
    commodities: [],
    crypto: [],
    other: [],
  };
  for (const s of snaps) {
    const g = classifyRegion(s);
    (groups[g] ||= []).push(s);
  }
  // Sort each group by |1D| desc and keep top 6
  for (const k of Object.keys(groups)) {
    groups[k] = groups[k]
      .filter((s) => s.change_pct_1d !== null && s.change_pct_1d !== undefined)
      .sort((a, b) => Math.abs(b.change_pct_1d) - Math.abs(a.change_pct_1d))
      .slice(0, 6);
  }

  const movers = [...snaps]
    .filter((s) => s.change_pct_1d !== null)
    .sort((a, b) => Math.abs(b.change_pct_1d) - Math.abs(a.change_pct_1d))
    .slice(0, 12);

  return {
    groups,
    movers,
    macro: macro.data ?? [],
    ratios: ratios.data ?? [],
    totalSnapshots: snaps.length,
  };
}

async function generateBriefing(ctx: Awaited<ReturnType<typeof fetchContext>>) {
  const systemPrompt = `You are BEN, chief market strategist at ScreenerPilot.
You write a Bloomberg-style morning flash. ENGLISH ONLY.

HARD LIMIT: 90 to 120 words total. Shorter is better. If you exceed 120 words you have failed.

TONE
- Calm, refined, institutional. Crisp sentences. Active voice, present tense.
- No filler, no hedges, no disclaimers, no emojis.
- Never use these symbols: =, |, Δ, z=, pctl, ~, →, •. No tables. No bullet lists. No headings.
- Bold key tickers and figures with **bold** (max 3 total).

OUTPUT (exact, two short paragraphs, nothing else):

**TL;DR —** one elegant sentence, max 18 words, the day's core thesis.

One paragraph, 3-4 short sentences, max 90 words: the dominant cross-asset story. Which region leads, which lags, what rates or the dollar are doing, and the one commodity or crypto move that matters. Cite 2-3 specific numbers. End with a one-line directional read on the regime (no buy/sell calls).

Nothing else. No section headers. No "BEN's take". Stay under 120 words.`;

  const fmtBlock = (label: string, rows: any[]) => {
    if (!rows.length) return "";
    const lines = rows
      .map((m: any) => {
        const d1 = m.change_pct_1d != null ? `${m.change_pct_1d.toFixed(2)}% 1d` : "";
        const d7 = m.change_pct_1w != null ? `${m.change_pct_1w.toFixed(2)}% 7d` : "";
        const px = m.current_price != null ? `last ${m.current_price}` : "";
        return `- ${m.display_name || m.symbol} (${m.symbol}): ${[d1, d7, px].filter(Boolean).join(", ")}`;
      })
      .join("\n");
    return `\n${label}:\n${lines}`;
  };

  const userPrompt = `Live market data, grouped by region/asset class. Use these to write the brief.
${fmtBlock("UNITED STATES", ctx.groups.united_states)}
${fmtBlock("EUROPE", ctx.groups.europe)}
${fmtBlock("ASIA", ctx.groups.asia)}
${fmtBlock("AMERICAS EX-US", ctx.groups.americas_ex_us)}
${fmtBlock("RATES AND FX", ctx.groups.rates_fx)}
${fmtBlock("COMMODITIES", ctx.groups.commodities)}
${fmtBlock("CRYPTO", ctx.groups.crypto)}

MACRO INDICATORS:
${ctx.macro.slice(0, 20).map((m: any) => `- ${m.display_name} (${m.category}): current ${m.current_value}${m.unit ?? ""}, previous ${m.previous_value ?? "n/a"}, change ${m.change_pct?.toFixed(2) ?? "n/a"} percent`).join("\n")}

RATIOS (for cross-asset signals — translate any z-scores or percentiles into plain English):
${ctx.ratios.map((r: any) => `- ${r.display_name}: value ${r.current_value?.toFixed(3)}, 5y percentile ${r.percentile_5y?.toFixed(0)}, 1w change ${r.change_pct_1w?.toFixed(2)} percent`).join("\n")}

Date: ${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}

Write the brief now. Follow the structure exactly. Remember: no =, no |, no Δ, no z=, no pctl, no emoji.`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`AI gateway ${resp.status}: ${txt}`);
  }

  const json = await resp.json();
  const content = json.choices?.[0]?.message?.content ?? "";
  return content;
}

function extractHeadline(md: string): string {
  const tldr = md.match(/\*\*TL;DR\s*[—:-]\*\*\s*(.+?)(?:\n|$)/i);
  if (tldr) return tldr[1].trim();
  const h1 = md.match(/^#\s+(.+)$/m);
  return h1 ? h1[1].trim() : "Morning Wire";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const today = new Date().toISOString().split("T")[0];

    const { data: existing } = await supabase
      .from("daily_briefings")
      .select("id")
      .eq("briefing_date", today)
      .maybeSingle();

    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "1";

    if (existing && !force) {
      return new Response(
        JSON.stringify({ status: "exists", briefing_date: today }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const ctx = await fetchContext(supabase);
    const contentMd = await generateBriefing(ctx);
    const headline = extractHeadline(contentMd);

    const payload = {
      briefing_date: today,
      headline,
      content_md: contentMd,
      top_movers: ctx.movers.slice(0, 10),
      regimes: null,
      key_events: null,
      model: MODEL,
    };

    const { error } = await supabase
      .from("daily_briefings")
      .upsert(payload, { onConflict: "briefing_date" });

    if (error) throw error;

    return new Response(
      JSON.stringify({ status: "generated", briefing_date: today, headline }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-daily-briefing error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
