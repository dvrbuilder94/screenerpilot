import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const MODEL = "google/gemini-2.5-flash";

async function fetchContext(supabase: ReturnType<typeof createClient>) {
  const [snapshots, macro, ratios] = await Promise.all([
    supabase
      .from("market_snapshots")
      .select("symbol,display_name,category,change_pct_1d,change_pct_1w,current_price")
      .order("fetched_at", { ascending: false })
      .limit(200),
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
  const movers = [...snaps]
    .filter((s) => s.change_pct_1d !== null)
    .sort((a, b) => Math.abs(b.change_pct_1d) - Math.abs(a.change_pct_1d))
    .slice(0, 15);

  return {
    movers,
    macro: macro.data ?? [],
    ratios: ratios.data ?? [],
    totalSnapshots: snaps.length,
  };
}

async function generateBriefing(ctx: Awaited<ReturnType<typeof fetchContext>>) {
  const systemPrompt = `You are BEN (Benjamin Graham), the chief market strategist behind ScreenerPilot's morning wire.
You write a Bloomberg-terminal style briefing: dense, decisive, institutional. Spanish output.
No emojis anywhere. No disclaimers. No "no soy asesor financiero". No hedging filler.

Tone: como un MLIV / GS Daily Update — frases cortas, datos primero, verbos en presente.

Output STRICT markdown, no preamble, exact structure:

**TL;DR —** una sola frase punchy (máx 22 palabras) con la tesis del día.

---

## TAPE

3 bullets densos. Cada bullet empieza con etiqueta en MAYÚSCULAS seguida de " — ":
- RISK — estado risk-on / risk-off con 1 evidencia numérica.
- RATES & USD — comportamiento de tasas y dólar con 1 dato.
- CROSS-ASSET — oro vs equities, crypto vs SPX o similar, con dato.

## MOVERS

Tabla markdown con 6-8 filas, ordenados por |%|. Columnas exactas:
| Ticker | Δ1D | Δ7D | Read |
Read = 4-7 palabras institucionales, sin emoji.

## RATIOS

2-3 bullets sobre ratios con z-score extremo (|z|>1) o percentil <10 / >90.
Formato: \`PAR\` z=X.XX (pctl Y) — implicación en 1 frase.

## ON THE RADAR

2-3 bullets de eventos macro / niveles técnicos a vigilar hoy o esta semana.

## BEN'S TAKE

Un solo párrafo de 45-65 palabras. Opinión clara sobre el régimen y dónde está la asimetría. Cita 1-2 datos del briefing. Sin recomendaciones de compra/venta explícitas pero con bias direccional claro.`;

  const userPrompt = `Datos en vivo:

TOP MOVERS:
${ctx.movers.map((m: any) => `- ${m.symbol} (${m.category}): ${m.change_pct_1d?.toFixed(2)}% 1d, ${m.change_pct_1w?.toFixed(2)}% 1w @ $${m.current_price}`).join("\n")}

MACRO INDICATORS:
${ctx.macro.slice(0, 20).map((m: any) => `- ${m.display_name} (${m.category}): ${m.current_value}${m.unit ?? ""} (Δ ${m.change_pct?.toFixed(2)}%)`).join("\n")}

RATIOS:
${ctx.ratios.map((r: any) => `- ${r.display_name}: ${r.current_value?.toFixed(3)} (z=${r.z_score?.toFixed(2)}, pctl=${r.percentile_5y?.toFixed(0)})`).join("\n")}

Fecha: ${new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}

Genera el briefing.`;

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

    // Check if already generated today (idempotent)
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
