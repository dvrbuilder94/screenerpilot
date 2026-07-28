// Token Squeeze Radar scanner. Pulls Binance USDT-perp funding rates + 24h
// tickers (both public, no key), joins them, and ranks tokens by a short-squeeze
// score: negative funding (shorts paying) + price turning up + real volume.
// Server-side fetch avoids browser CORS/geo limits.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface PremiumIndex {
  symbol: string;
  markPrice: string;
  lastFundingRate: string;
}
interface Ticker24h {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
}

function scoreSqueeze(funding: number, change24h: number, volume24h: number): number {
  const fundingScore = Math.max(0, Math.min(60, -funding * 100_000));
  const momentumScore = Math.max(0, Math.min(22, change24h));
  const volumeScore = volume24h > 50_000_000 ? 12 : volume24h > 10_000_000 ? 6 : 0;
  return Math.round(Math.max(0, Math.min(100, fundingScore * 0.7 + momentumScore * 1.4 + volumeScore)));
}
const signalFor = (s: number) => (s >= 75 ? "extreme" : s >= 55 ? "high" : s >= 35 ? "building" : "neutral");

let cache: { data: unknown; ts: number } | null = null;
const TTL_MS = 3 * 60 * 1000;
const MIN_VOLUME = 10_000_000; // ignore illiquid perps

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
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const premium = (await pRes.json()) as PremiumIndex[];
    const tickers = (await tRes.json()) as Ticker24h[];
    const funding = new Map(premium.map((p) => [p.symbol, p]));

    const tokens = tickers
      .filter((t) => t.symbol.endsWith("USDT") && funding.has(t.symbol))
      .map((t) => {
        const p = funding.get(t.symbol)!;
        const f = parseFloat(p.lastFundingRate);
        const change24h = parseFloat(t.priceChangePercent);
        const volume24h = parseFloat(t.quoteVolume);
        const score = scoreSqueeze(f, change24h, volume24h);
        return {
          symbol: t.symbol.replace(/USDT$/, ""),
          price: parseFloat(t.lastPrice),
          change24h,
          funding: f,
          volume24h,
          score,
          signal: signalFor(score),
        };
      })
      .filter((t) => t.volume24h >= MIN_VOLUME && t.funding < 0) // squeeze setups only
      .sort((a, b) => b.score - a.score)
      .slice(0, 40);

    cache = { data: tokens, ts: Date.now() };
    return new Response(JSON.stringify({ tokens }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e), tokens: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
