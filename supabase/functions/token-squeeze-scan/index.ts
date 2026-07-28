// Token Squeeze Radar scanner. Assembles the crypto perp universe and scores it
// with the shared quant core using calibrated weights (falling back to priors).
// Server-side so the formula never ships.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { scoreCrossSection, signalFor } from "../_shared/quant.ts";
import { buildCryptoItems, withWeights, CRYPTO_FACTORS } from "../_shared/scan.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

let cache: { data: unknown; ts: number } | null = null;
const TTL_MS = 3 * 60 * 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (cache && Date.now() - cache.ts < TTL_MS) {
      return new Response(JSON.stringify({ tokens: cache.data, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const rows = await buildCryptoItems();
    if (!rows.length) {
      return new Response(JSON.stringify({ tokens: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const factors = await withWeights(supabase, "crypto", CRYPTO_FACTORS);
    const scored = scoreCrossSection(rows.map((r) => r.vals), factors);

    const tokens = rows
      .map((r, i) => ({
        symbol: r.symbol,
        price: r.price,
        change24h: r.change24h,
        funding: r.funding,
        volume24h: r.volume24h,
        score: scored[i].score,
        confidence: scored[i].confidence,
        signal: signalFor(scored[i].score),
        factors: scored[i].z,
      }))
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
