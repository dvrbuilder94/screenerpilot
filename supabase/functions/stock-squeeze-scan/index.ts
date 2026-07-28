// Stock Squeeze Radar scanner. Reads the stock universe + daily candles from the
// DB, computes a TTM-Squeeze style setup (Bollinger coiled inside Keltner +
// momentum + trend + relative volume), and scores the cross-section with the
// shared quant core. Same model as crypto, different factors.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { scoreCrossSection, signalFor, type FactorSpec } from "../_shared/quant.ts";
import { stockFactors } from "../_shared/ta.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FACTORS: FactorSpec[] = [
  { key: "momentum", weight: 1.2, value: (t) => t.momentum },
  { key: "compression", weight: 0.8, value: (t) => t.compression },
  { key: "trend", weight: 0.6, value: (t) => t.trend },
  { key: "rvol", weight: 0.5, value: (t) => t.rvol },
];

let cache: { data: unknown; ts: number } | null = null;
const TTL_MS = 10 * 60 * 1000;
const UNIVERSE = 60;

async function candlesFor(supabase: ReturnType<typeof createClient>, symbol: string) {
  const { data } = await supabase
    .from("asset_candles")
    .select("open, high, low, close, volume, timestamp")
    .eq("symbol", symbol)
    .eq("interval", "1d")
    .order("timestamp", { ascending: false })
    .limit(60);
  return (data ?? []).reverse() as { open: number; high: number; low: number; close: number; volume: number }[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (cache && Date.now() - cache.ts < TTL_MS) {
      return new Response(JSON.stringify({ tokens: cache.data, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: uni } = await supabase
      .from("stock_universe")
      .select("symbol")
      .eq("is_active", true)
      .order("market_cap", { ascending: false })
      .limit(UNIVERSE);

    const symbols = (uni ?? []).map((u) => u.symbol as string);
    if (!symbols.length) {
      return new Response(JSON.stringify({ tokens: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch candles in parallel chunks.
    const items: Record<string, number>[] = [];
    const meta: Record<string, { price: number; change: number; setup: string }> = {};
    for (let i = 0; i < symbols.length; i += 12) {
      const chunk = symbols.slice(i, i + 12);
      const results = await Promise.all(chunk.map((s) => candlesFor(supabase, s)));
      results.forEach((c, j) => {
        if (c.length < 30) return;
        const f = stockFactors(
          c.map((x) => x.open), c.map((x) => x.high), c.map((x) => x.low),
          c.map((x) => x.close), c.map((x) => x.volume),
        );
        if (!f) return;
        const sym = chunk[j];
        items.push({ symbol: sym as unknown as number, momentum: f.momentum, compression: f.compression, trend: f.trend, rvol: f.rvol });
        meta[sym] = {
          price: f.price,
          change: f.changePct,
          setup: f.inSqueeze ? "Coiled" : f.momentum > 0 ? "Firing ↑" : "—",
        };
      });
    }

    if (!items.length) {
      return new Response(JSON.stringify({ tokens: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const scored = scoreCrossSection(items, FACTORS);
    const tokens = items
      .map((it, i) => {
        const sym = it.symbol as unknown as string;
        const m = meta[sym];
        return {
          symbol: sym,
          price: m.price,
          change24h: m.change,
          setup: m.setup,
          score: scored[i].score,
          confidence: scored[i].confidence,
          signal: signalFor(scored[i].score),
          factors: scored[i].z,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 40);

    cache = { data: tokens, ts: Date.now() };
    return new Response(JSON.stringify({ tokens }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e), tokens: [] }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
