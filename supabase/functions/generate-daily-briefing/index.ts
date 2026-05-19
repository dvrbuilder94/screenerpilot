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
  const systemPrompt = `You are BEN (Benjamin Graham), chief market strategist at ScreenerPilot.
You write an elegant, globally-structured morning market brief in the voice of a Bloomberg senior analyst — Goldman Sachs Daily Update / JPM Eye on the Market register. ENGLISH ONLY.

TONE
- Calm, refined, institutional. Short prose sentences. Active voice, present tense.
- Read like a human analyst, not a data dump. Connect dots between regions and asset classes.
- No emojis. No disclaimers. No hedging filler. No "this is not financial advice".

HARD FORMATTING RULES
- Write data in plain prose: "S&P 500 +0.4%, breadth firm with 62% advancers".
- Never use these symbols anywhere: =, |, Δ, z=, pctl, ~, →, •.
- No tables. No bullet-symbol clutter.
- Each section starts with a bold markdown H2 heading (## Heading). Sentence case, short.
- Generous whitespace between sections. Body is flowing prose, not lists, unless explicitly noted.
- Bold key tickers and figures inline using **bold** sparingly (1-2 per paragraph max) so the eye can scan.

OUTPUT STRUCTURE (exact order, omit any section that lacks data — never write "n/a"):

**TL;DR —** one elegant sentence, max 22 words, capturing the day's core thesis.

## Global overview
One short paragraph (2-3 sentences) on the overall risk tone across regions and the dominant cross-asset narrative.

## United States
2-3 sentences. Equities, breadth, leading sector or factor. Mention one or two specific indices or names.

## Europe
2-3 sentences. Stoxx 600, DAX, FTSE, plus one macro or policy note.

## Asia
2-3 sentences. Nikkei, Hang Seng, China, plus one macro note.

## Americas ex-US
2 sentences if data warrants. Brazil, Mexico, regional FX. Skip entirely if no material data.

## Rates and FX
2-3 sentences. US 2y and 10y yields, dollar index, key crosses.

## Commodities
2 sentences. Oil, gold, copper, with the dominant narrative.

## Crypto
2 sentences. BTC, ETH, dominance or flows.

## Cross-asset signals
One short paragraph weaving together the day's most stretched ratios in plain English. Example: "Gold-to-silver sits at the 92nd percentile of its five-year range, historically a marker of risk-off rotations." No "z=" or "pctl" notation.

## On the radar
One short paragraph (no bullets) listing the events, data releases, or technical levels worth watching today and this week.

## BEN's take
One single, well-written paragraph of 48 to 65 words. Clear view on the regime and where the asymmetry sits. Cite one or two data points already in the brief. Directional bias allowed; no explicit buy/sell calls.`;

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
