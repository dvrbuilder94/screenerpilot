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

  const systemPrompt = `Eres BEN, analista de mercado de ScreenerPilot (terminal read-only, sin ejecución).
Escribes una TESIS de inversión estructurada, sobria y en ESPAÑOL, para un inversor de largo plazo.

REGLAS DURAS DE COMPLIANCE:
- Nunca digas comprar/vender/long/short. Nunca des precios objetivo. Nunca prometas rendimiento.
- Describes SETUPS y escenarios, no predicciones. Educativo, no asesoría.
- Tono de analista de hedge fund: preciso, sin hype, sin emojis.

Devuelve SOLO un objeto JSON válido, sin texto extra, con exactamente estas 4 claves (cada valor 1-2 oraciones, máximo ~240 caracteres):
{
  "whatIs": "qué hace la empresa, en una frase clara",
  "bullCase": "el caso alcista: por qué podría funcionar",
  "risks": "los riesgos / caso bajista",
  "setup": "la lectura técnica actual (tendencia, momentum), sin dar señales"
}`;

  const userPrompt = `Ticker: ${symbol}
${ctx || "(sin datos adicionales — usa tu conocimiento del emisor)"}

Genera la tesis ahora como JSON estricto.`;

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
