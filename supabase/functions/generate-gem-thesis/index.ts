// Generates a structured investment thesis for a ticker, BEN-style:
// { whatIs, bullCase, risks, setup } — grounded in the live data the client
// passes in. Educational framing, no buy/sell calls, no price targets.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const MODEL = "google/gemini-2.5-flash";

function extractJson(raw: string): any | null {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(s.slice(start, end + 1));
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const body = await req.json().catch(() => ({}));
  const symbol: string = (body.symbol || "").toUpperCase();
  if (!symbol) {
    return new Response(JSON.stringify({ error: "symbol required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const ctx = [
    body.companyName ? `Empresa: ${body.companyName}` : null,
    body.price != null ? `Precio: $${body.price}` : null,
    body.marketCap ? `Market cap: ${body.marketCap}` : null,
    body.sector ? `Sector: ${body.sector}` : null,
    body.rsi != null ? `RSI(14): ${body.rsi}` : null,
    body.trend ? `Tendencia: ${body.trend}` : null,
    body.verdict ? `Lectura técnica: ${body.verdict}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const systemPrompt = `You are BEN, the market analyst inside ScreenerPilot (read-only terminal, no execution).
You write a structured, sober investment THESIS in ENGLISH for a long-term investor.

HARD COMPLIANCE RULES:
- Never say buy/sell/long/short. Never give price targets. Never promise returns.
- Describe SETUPS and scenarios, not predictions. Educational, not advice.
- Hedge-fund-analyst tone: precise, no hype, no emojis.

Return ONLY a valid JSON object, no extra text, with exactly these 4 keys (each value 1-2 sentences, max ~240 chars):
{
  "whatIs": "what the company does, in one clear sentence",
  "bullCase": "the bull case: why it could work",
  "risks": "the risks / bear case",
  "setup": "the current technical read (trend, momentum), without giving signals"
}`;

  const userPrompt = `Ticker: ${symbol}
${ctx || "(no extra data — use your knowledge of the issuer)"}

Generate the thesis now as strict JSON.`;

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });
    if (!resp.ok) throw new Error(`AI gateway ${resp.status}`);
    const json = await resp.json();
    const raw: string = json.choices?.[0]?.message?.content ?? "";
    const parsed = extractJson(raw);
    if (!parsed) throw new Error("bad thesis format");

    return new Response(
      JSON.stringify({
        symbol,
        whatIs: parsed.whatIs ?? "",
        bullCase: parsed.bullCase ?? "",
        risks: parsed.risks ?? "",
        setup: parsed.setup ?? "",
        model: MODEL,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "thesis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
