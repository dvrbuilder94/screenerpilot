import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const CMC_KEY = Deno.env.get("COINMARKETCAP_API_KEY") ?? "";

interface CmcCoin {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  cmc_rank: number;
  quote: {
    USD: {
      price: number;
      volume_24h: number;
      market_cap: number;
      percent_change_1h: number;
      percent_change_24h: number;
      percent_change_7d: number;
      percent_change_30d: number;
      percent_change_60d: number;
      percent_change_90d: number;
    };
  };
}

type TrackedAsset = {
  id: string;
  symbol: string;
  name: string;
  group: "core" | "defi" | "high-beta";
};

const TRACKED: TrackedAsset[] = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", group: "core" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", group: "core" },
  { id: "uniswap", symbol: "UNI", name: "Uniswap", group: "defi" },
  { id: "morpho", symbol: "MORPHO", name: "Morpho", group: "defi" },
  { id: "curve-dao-token", symbol: "CRV", name: "Curve DAO", group: "defi" },
  { id: "lighter", symbol: "LIT", name: "Lighter", group: "high-beta" },
  { id: "cash-cat", symbol: "CASHCAT", name: "Cash Cat", group: "high-beta" },
];

let cache: { data: any; ts: number } | null = null;
const TTL_MS = 5 * 60 * 1000;

const average = (values: number[]) => values.reduce((a, b) => a + b, 0) / Math.max(values.length, 1);

function rsi(values: number[], period = 14): number | null {
  if (values.length <= period) return null;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const delta = values[i] - values[i - 1];
    if (delta >= 0) gains += delta;
    else losses -= delta;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < values.length; i++) {
    const delta = values[i] - values[i - 1];
    const gain = Math.max(delta, 0);
    const loss = Math.max(-delta, 0);
    avgGain = ((avgGain * (period - 1)) + gain) / period;
    avgLoss = ((avgLoss * (period - 1)) + loss) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function ema(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const k = 2 / (period + 1);
  let current = average(values.slice(0, period));
  for (let i = period; i < values.length; i++) current = values[i] * k + current * (1 - k);
  return current;
}

function pctChange(values: number[], days: number): number | null {
  if (values.length <= days) return null;
  const current = values[values.length - 1];
  const previous = values[values.length - 1 - days];
  if (!previous) return null;
  return ((current / previous) - 1) * 100;
}

function volatility(values: number[], days = 30): number | null {
  if (values.length < 3) return null;
  const slice = values.slice(-(days + 1));
  const returns: number[] = [];
  for (let i = 1; i < slice.length; i++) returns.push(Math.log(slice[i] / slice[i - 1]));
  if (!returns.length) return null;
  const mean = average(returns);
  const variance = average(returns.map((v) => (v - mean) ** 2));
  return Math.sqrt(variance) * Math.sqrt(365) * 100;
}

function regime(rsi14: number | null, ema20: number | null, ema50: number | null, chg7: number | null) {
  if (rsi14 == null) return "unknown";
  if (rsi14 >= 70) return "overbought";
  if (rsi14 <= 30) return "oversold";
  if (ema20 != null && ema50 != null && ema20 > ema50 && (chg7 ?? 0) > 0) return "bullish";
  if (ema20 != null && ema50 != null && ema20 < ema50 && (chg7 ?? 0) < 0) return "bearish";
  return "neutral";
}

function momentumScore(rsi14: number | null, chg7: number | null, chg30: number | null, ema20: number | null, ema50: number | null) {
  let score = 50;
  if (rsi14 != null) score += Math.max(-20, Math.min(20, (rsi14 - 50) * 0.5));
  if (chg7 != null) score += Math.max(-15, Math.min(15, chg7 * 0.5));
  if (chg30 != null) score += Math.max(-10, Math.min(10, chg30 * 0.15));
  if (ema20 != null && ema50 != null) score += ema20 >= ema50 ? 5 : -5;
  return Math.max(0, Math.min(100, Math.round(score)));
}

async function fetchTracked() {
  const ids = TRACKED.map((x) => x.id).join(",");
  const marketUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&price_change_percentage=1h,24h,7d,30d&sparkline=false`;
  const marketRes = await fetch(marketUrl, { headers: { Accept: "application/json" } });
  if (!marketRes.ok) throw new Error(`CoinGecko markets ${marketRes.status}`);
  const markets = await marketRes.json();
  const marketById = new Map(markets.map((m: any) => [m.id, m]));

  const results = await Promise.all(TRACKED.map(async (asset) => {
    try {
      const historyUrl = `https://api.coingecko.com/api/v3/coins/${asset.id}/market_chart?vs_currency=usd&days=90&interval=daily`;
      const historyRes = await fetch(historyUrl, { headers: { Accept: "application/json" } });
      if (!historyRes.ok) throw new Error(`history ${historyRes.status}`);
      const history = await historyRes.json();
      const closes: number[] = (history.prices ?? []).map((p: [number, number]) => Number(p[1])).filter((n: number) => Number.isFinite(n));
      const market: any = marketById.get(asset.id) ?? {};
      const rsi14 = rsi(closes, 14);
      const ema20 = ema(closes, 20);
      const ema50 = ema(closes, 50);
      const chg7 = pctChange(closes, 7) ?? market.price_change_percentage_7d_in_currency ?? null;
      const chg30 = pctChange(closes, 30) ?? market.price_change_percentage_30d_in_currency ?? null;
      const current = market.current_price ?? closes.at(-1) ?? null;
      return {
        ...asset,
        price: current,
        market_cap: market.market_cap ?? null,
        volume_24h: market.total_volume ?? null,
        change_1h: market.price_change_percentage_1h_in_currency ?? null,
        change_24h: market.price_change_percentage_24h_in_currency ?? null,
        change_7d: chg7,
        change_30d: chg30,
        rsi_14: rsi14,
        ema_20: ema20,
        ema_50: ema50,
        distance_ema20_pct: current && ema20 ? ((current / ema20) - 1) * 100 : null,
        volatility_30d_ann: volatility(closes, 30),
        momentum_score: momentumScore(rsi14, chg7, chg30, ema20, ema50),
        regime: regime(rsi14, ema20, ema50, chg7),
        data_points: closes.length,
        error: null,
      };
    } catch (e) {
      const market: any = marketById.get(asset.id) ?? {};
      return {
        ...asset,
        price: market.current_price ?? null,
        market_cap: market.market_cap ?? null,
        volume_24h: market.total_volume ?? null,
        change_1h: market.price_change_percentage_1h_in_currency ?? null,
        change_24h: market.price_change_percentage_24h_in_currency ?? null,
        change_7d: market.price_change_percentage_7d_in_currency ?? null,
        change_30d: market.price_change_percentage_30d_in_currency ?? null,
        rsi_14: null,
        ema_20: null,
        ema_50: null,
        distance_ema20_pct: null,
        volatility_30d_ann: null,
        momentum_score: null,
        regime: "unknown",
        data_points: 0,
        error: e instanceof Error ? e.message : "History unavailable",
      };
    }
  }));

  return results;
}

async function fetchCmcUniverse() {
  if (!CMC_KEY) return [];
  const url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=250&convert=USD";
  const res = await fetch(url, {
    headers: { "X-CMC_PRO_API_KEY": CMC_KEY, Accept: "application/json" },
  });
  if (!res.ok) return [];
  const json = await res.json();
  const coins: CmcCoin[] = json.data ?? [];
  return coins.map((c) => {
    const q = c.quote.USD;
    return {
      id: c.id,
      name: c.name,
      symbol: c.symbol,
      slug: c.slug,
      rank: c.cmc_rank,
      price: q.price,
      volume_24h: q.volume_24h,
      market_cap: q.market_cap,
      change_1h: q.percent_change_1h,
      change_24h: q.percent_change_24h,
      change_7d: q.percent_change_7d,
      change_30d: q.percent_change_30d,
      change_60d: q.percent_change_60d,
      change_90d: q.percent_change_90d,
    };
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (cache && Date.now() - cache.ts < TTL_MS) {
      return new Response(JSON.stringify({ ...cache.data, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [tracked, coins] = await Promise.all([fetchTracked(), fetchCmcUniverse()]);
    const payload = {
      tracked,
      coins,
      fetched_at: new Date().toISOString(),
      total: coins.length,
      tracked_total: tracked.length,
      cached: false,
    };
    cache = { data: payload, ts: Date.now() };

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("crypto-momentum error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
