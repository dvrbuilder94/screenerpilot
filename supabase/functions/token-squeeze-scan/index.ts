// Token Squeeze Radar scanner. Pulls Binance USDT-perp funding rates + 24h
// tickers (public, no key), then scores every token with the shared quant core:
// factors are normalized cross-sectionally (vs the rest of the universe right
// now) and blended logistically. Server-side so the formula never ships.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { scoreCrossSection, signalFor, type FactorSpec } from "../_shared/quant.ts";

interface PremiumIndex { symbol: string; markPrice: string; lastFundingRate: string }
interface Ticker24h { symbol: string; lastPrice: string; priceChangePercent: string; quoteVolume: string }

// Squeeze factors. Each returns "higher = more squeeze fuel".
const FACTORS: FactorSpec[] = [
  // Negative funding = shorts paying to stay short = fuel. Invert sign.
  { key: "funding", weight: 1.4, value: (t) => -t.funding },
  // Price turning up while shorts are trapped.
  { key: "momentum", weight: 1.0, value: (t) => t.change24h },
  // Liquidity/conviction — log so whales don't dominate linearly.
  { key: "liquidity", weight: 0.5, value: (t) => Math.log10(Math.max(1, t.volume24h)) },
];

let cache: { data: unknown; ts: number } | null = null;
const TTL_MS = 3 * 60 * 1000;
const MIN_VOLUME = 10_000_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (cache && Date.now() - cache.ts < TTL_MS) {
      return new Response(JSON.stringify({ tokens: cache.data, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [pRes, tRes] = await Promise.all([
      fetch("https://fapi.binance.com/fapi/v1/premiumIndex"),
      fetch("https://fapi.binance.com/fapi/v1/ticker/24hr"),
    ]);
    if (!pRes.ok || !tRes.ok) {
      return new Response(JSON.stringify({ error: "Upstream error", tokens: [] }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const premium = (await pRes.json()) as PremiumIndex[];
    const tickers = (await tRes.json()) as Ticker24h[];
    const funding = new Map(premium.map((p) => [p.symbol, p]));

    // Build the universe (only setups: negative funding + liquid).
    const universe = tickers
      .filter((t) => t.symbol.endsWith("USDT") && funding.has(t.symbol))
      .map((t) => {
        const p = funding.get(t.symbol)!;
        return {
          symbol: t.symbol.replace(/USDT$/, ""),
          price: parseFloat(t.lastPrice),
          change24h: parseFloat(t.priceChangePercent),
          funding: parseFloat(p.lastFundingRate),
          volume24h: parseFloat(t.quoteVolume),
        };
      })
      .filter((t) => t.volume24h >= MIN_VOLUME && t.funding < 0);

    // Score the whole cross-section, then attach.
    const scored = scoreCrossSection(universe as unknown as Record<string, number>[], FACTORS);
    const tokens = universe
      .map((t, i) => ({
        ...t,
        score: scored[i].score,
        confidence: scored[i].confidence,
        signal: signalFor(scored[i].score),
        factors: scored[i].z, // { funding, momentum, liquidity } z-scores
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 40);

    cache = { data: tokens, ts: Date.now() };
    return new Response(JSON.stringify({ tokens }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e), tokens: [] }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
