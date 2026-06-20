import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const MODEL = "google/gemini-2.5-flash";
const POOL_SIZE = 8;
const PICK_COUNT = 3;

interface Candidate {
  symbol: string;
  companyName: string;
  price: number;
  marketCapLabel: string;
  squeezeScore: number;
  volumeRatio: number;
  change5d: number;
  rsi: number;
}

interface Pick {
  symbol: string;
  conviction: "HIGH" | "MEDIUM";
  thesis: string;
}

function extractJsonArray(raw: string): unknown {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  return JSON.parse(cleaned);
}

async function pickTopSetups(pool: Candidate[]): Promise<Pick[]> {
  const systemPrompt = `You are BEN, ScreenerPilot's Market Intelligence Copilot, picking today's highest-conviction technical setups for the Pro tier "Top Picks" module.

TONE: confident, decisive, hedge-fund-desk energy. Punchy and direct, but every claim must be grounded in the technical data given.

HARD RULES
- NEVER say "buy", "sell", "long", "short", or give a price target.
- NEVER claim certainty of an outcome. Describe the SETUP, not a prediction.
- Base conviction only on the technical data provided (volume, RSI, momentum, squeeze score).
- Exactly ${PICK_COUNT} picks, ranked best first.

OUTPUT: Return ONLY a raw JSON array (no markdown, no code fences, no commentary) of exactly ${PICK_COUNT} objects:
[{"symbol": "TICKER", "conviction": "HIGH" | "MEDIUM", "thesis": "one punchy sentence, max 160 characters, about the technical setup"}]`;

  const userPrompt = `Candidate pool (today's actual squeeze radar scan):\n${pool
    .map(
      (c) =>
        `${c.symbol} (${c.companyName}) — Squeeze Score ${c.squeezeScore}/100, price $${c.price.toFixed(2)}, vol ${c.volumeRatio.toFixed(1)}x avg, RSI ${c.rsi}, 5d change ${c.change5d.toFixed(1)}%, ${c.marketCapLabel}`,
    )
    .join("\n")}\n\nPick the ${PICK_COUNT} strongest setups now, following the exact output format.`;

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
  const raw: string = json.choices?.[0]?.message?.content ?? "[]";
  const parsed = extractJsonArray(raw);
  if (!Array.isArray(parsed)) throw new Error("AI did not return a JSON array");
  return parsed as Pick[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const today = new Date().toISOString().split("T")[0];

    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "1";

    if (!force) {
      const { data: existing } = await supabase
        .from("ben_top_picks")
        .select("id")
        .eq("pick_date", today)
        .limit(1)
        .maybeSingle();
      if (existing) {
        return new Response(JSON.stringify({ status: "ok", pick_date: today, skipped: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { data: scan, error: scanError } = await supabase.functions.invoke("squeeze-radar", { body: {} });
    if (scanError) throw new Error(scanError.message || "Failed to run squeeze-radar scan");
    const candidates: Candidate[] = scan?.candidates ?? [];
    if (candidates.length === 0) throw new Error("No candidates available from squeeze-radar");

    const pool = candidates.slice(0, POOL_SIZE);
    const picks = await pickTopSetups(pool);

    const rows = picks.slice(0, PICK_COUNT).map((p, i) => {
      const match = pool.find((c) => c.symbol.toUpperCase() === p.symbol.toUpperCase());
      if (!match) return null;
      return {
        pick_date: today,
        rank: i + 1,
        symbol: match.symbol,
        company_name: match.companyName,
        price: match.price,
        squeeze_score: match.squeezeScore,
        change_5d: match.change5d,
        volume_ratio: match.volumeRatio,
        conviction: p.conviction === "HIGH" ? "HIGH" : "MEDIUM",
        thesis: p.thesis,
        model: MODEL,
      };
    }).filter((r): r is NonNullable<typeof r> => r !== null);

    if (rows.length === 0) throw new Error("AI picks did not match any candidate in the pool");

    const { error } = await supabase
      .from("ben_top_picks")
      .upsert(rows, { onConflict: "pick_date,rank" });
    if (error) throw error;

    return new Response(JSON.stringify({ status: "ok", pick_date: today, picks: rows.map((r) => r.symbol) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-ben-top-picks error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
