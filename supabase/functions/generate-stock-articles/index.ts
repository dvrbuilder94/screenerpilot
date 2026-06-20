import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const MODEL = "google/gemini-2.5-flash";
const DEFAULT_LIMIT = 10;

interface Candidate {
  symbol: string;
  companyName: string;
  price: number;
  marketCapLabel: string;
  squeezeScore: number;
  volumeRatio: number;
  drawdownFrom52w: number;
  change5d: number;
  rsi: number;
  bbWidth: number;
  components: {
    volume: number;
    compression: number;
    rsiRecovery: number;
    drawdown: number;
    sizeBias: number;
    momentum: number;
  };
}

async function writeArticle(c: Candidate): Promise<{ headline: string; body: string }> {
  const systemPrompt = `You are a financial content writer for ScreenerPilot, a read-only market intelligence terminal.
You write short, sober technical write-ups about individual stocks for retail traders. ENGLISH ONLY.

HARD LIMIT: 130 to 170 words total for the body. Shorter is fine, never longer.

TONE
- Calm, analytical, no hype, no emojis, no buy/sell calls, no price targets.
- Plain prose, 2 short paragraphs. No headings, no bullet lists.
- Bold the ticker and the Squeeze Score once each, nothing else.

OUTPUT FORMAT (exact):
Line 1: a single plain-text headline sentence, no markdown, under 110 characters.
Line 2: empty.
Then the body: 2 short paragraphs in markdown. First paragraph: what the technical setup shows (volume, compression, RSI, drawdown, momentum). Second paragraph: the key risk/caveat, ending with one sentence noting this is a technical heuristic, not real short-interest data, and not investment advice.`;

  const userPrompt = `Ticker: ${c.symbol} (${c.companyName})
Price: $${c.price.toFixed(2)}
Squeeze Score: ${c.squeezeScore}/100
Volume ratio vs avg: ${c.volumeRatio.toFixed(1)}x
Drawdown from 52w high: ${c.drawdownFrom52w.toFixed(1)}%
5-day change: ${c.change5d.toFixed(1)}%
RSI: ${c.rsi}
Bollinger band width: ${c.bbWidth}
Market cap: ${c.marketCapLabel}
Score components (0-100 each): volume ${c.components.volume}, compression/breakout ${c.components.compression}, RSI recovery ${c.components.rsiRecovery}, drawdown setup ${c.components.drawdown}, size bias ${c.components.sizeBias}, momentum ${c.components.momentum}.

Write the write-up now, following the exact output format.`;

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
  const raw: string = json.choices?.[0]?.message?.content ?? "";
  const lines = raw.trim().split("\n");
  const headline = (lines[0] || `${c.symbol} squeeze setup`).trim();
  const body = lines.slice(1).join("\n").trim();
  return { headline, body };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const today = new Date().toISOString().split("T")[0];

    const url = new URL(req.url);
    let body: { symbol?: string; limit?: number } = {};
    try {
      body = await req.json();
    } catch {
      // no body provided, use query params / defaults
    }
    const requestedSymbol = (body.symbol || url.searchParams.get("symbol") || "").toUpperCase() || undefined;
    const force = url.searchParams.get("force") === "1";

    const { data: scan, error: scanError } = await supabase.functions.invoke("squeeze-radar", { body: {} });
    if (scanError) throw new Error(scanError.message || "Failed to run squeeze-radar scan");
    const candidates: Candidate[] = scan?.candidates ?? [];

    let targets: Candidate[];
    if (requestedSymbol) {
      const match = candidates.find((c) => c.symbol.toUpperCase() === requestedSymbol);
      if (!match) {
        return new Response(
          JSON.stringify({ error: `${requestedSymbol} is not in today's squeeze radar candidates` }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      targets = [match];
    } else {
      const limit = Math.min(Number(body.limit) || DEFAULT_LIMIT, DEFAULT_LIMIT);
      targets = candidates.slice(0, limit);
    }

    const generated: string[] = [];
    const skipped: string[] = [];

    for (const c of targets) {
      if (!force) {
        const { data: existing } = await supabase
          .from("stock_articles")
          .select("id")
          .eq("symbol", c.symbol)
          .eq("article_date", today)
          .maybeSingle();
        if (existing) {
          skipped.push(c.symbol);
          continue;
        }
      }

      const { headline, body: articleBody } = await writeArticle(c);

      const { error } = await supabase.from("stock_articles").upsert(
        {
          symbol: c.symbol,
          article_date: today,
          company_name: c.companyName,
          headline,
          content_md: articleBody,
          squeeze_score: c.squeezeScore,
          price: c.price,
          change_5d: c.change5d,
          volume_ratio: c.volumeRatio,
          market_cap_label: c.marketCapLabel,
          model: MODEL,
        },
        { onConflict: "symbol,article_date" },
      );
      if (error) throw error;
      generated.push(c.symbol);
    }

    return new Response(
      JSON.stringify({ status: "ok", article_date: today, generated, skipped }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-stock-articles error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
