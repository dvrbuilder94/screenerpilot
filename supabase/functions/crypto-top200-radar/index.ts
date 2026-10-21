// Crypto Top 200 radar. Market-cap universe from CoinGecko, derivatives from Bybit.
// Read-only. No simulated rows or AI-generated signals.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=120",
};

interface GeckoCoin {
  id: string; symbol: string; name: string; current_price: number | null;
  market_cap: number | null; market_cap_rank: number | null;
  total_volume: number | null;
  price_change_percentage_24h: number | null;
  price_change_percentage_1h_in_currency?: number | null;
  price_change_percentage_7d_in_currency?: number | null;
  price_change_percentage_30d_in_currency?: number | null;
  sparkline_in_7d?: { price?: number[] };
}
interface BybitTicker {
  symbol: string; fundingRate: string; openInterestValue: string;
  turnover24h: string;
}
interface RadarRow {
  id: string; symbol: string; name: string; rank: number;
  price: number | null; marketCap: number | null;
  volume24h: number | null; volumeToMarketCap: number | null;
  change1h: number | null; change24h: number | null;
  change7d: number | null; change30d: number | null;
  rsi7dSparkline: number | null;
  fundingPct: number | null; openInterestUsd: number | null;
  oiToMarketCap: number | null; derivativesTurnover24h: number | null;
  shortSqueezeScore: number | null; longSqueezeScore: number | null;
  momentumScore: number | null;
}
type RadarPayload = {
  rows: RadarRow[]; updatedAt: string; source: string;
  derivativesAvailable: boolean; derivativesMatched: number;
  stale?: boolean; warning?: string;
};

const num = (value: unknown): number | null => {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// Wilder RSI(14) over CoinGecko's 7d sampled sparkline.
// CoinGecko does not guarantee a perfect hourly cadence; label it as
// "RSI 7d sparkline", not daily RSI or a validated 1h RSI.
function sparkRsi(values?: number[]): number | null {
  const prices = (values ?? []).filter((v) => Number.isFinite(v) && v > 0);
  if (prices.length < 16) return null;
  let gain = 0, loss = 0;
  for (let i = 1; i <= 14; i++) {
    const delta = prices[i] - prices[i - 1];
    gain += Math.max(0, delta);
    loss += Math.max(0, -delta);
  }
  gain /= 14; loss /= 14;
  for (let i = 15; i < prices.length; i++) {
    const d = prices[i] - prices[i - 1];
    gain = (gain * 13 + Math.max(d, 0)) / 14;
    loss = (loss * 13 + Math.max(-d, 0)) / 14;
  }
  if (loss === 0) return gain === 0 ? 50 : 100;
  return clamp(100 - 100 / (1 + gain / loss), 0, 100);
}

let cache: { payload: RadarPayload; at: number } | null = null;
const TTL_MS = 4 * 60 * 1000;

async function getGecko(): Promise<GeckoCoin[]> {
  const url = new URL("https://api.coingecko.com/api/v3/coins/markets");
  url.searchParams.set("vs_currency", "usd");
  url.searchParams.set("order", "market_cap_desc");
  url.searchParams.set("per_page", "200");
  url.searchParams.set("page", "1");
  url.searchParams.set("sparkline", "true");
  url.searchParams.set("price_change_percentage", "1h,7d,30d");
  const headers: Record<string, string> = { Accept: "application/json" };
  const apiKey = Deno.env.get("COINGECKO_DEMO_API_KEY");
  if (apiKey) headers["x-cg-demo-api-key"] = apiKey;
  const resp = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
  if (!resp.ok) throw new Error("CoinGecko HTTP " + resp.status);
  const parsed: unknown = await resp.json();
  if (!Array.isArray(parsed) || !parsed.length) throw new Error("CoinGecko returned no market data");
  return (parsed as GeckoCoin[]).slice(0, 200);
}

async function getBybit(): Promise<Map<string, BybitTicker>> {
  const response = await fetch("https://api.bybit.com/v5/market/tickers?category=linear", {
    headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("Bybit HTTP " + response.status);
  const data = await response.json();
  if (data?.retCode !== 0 || !Array.isArray(data?.result?.list)) throw new Error("Invalid Bybit response");
  const lookup = new Map<string, BybitTicker>();
  for (const t of data.result.list as BybitTicker[]) {
    if (typeof t.symbol === "string" && /^[A-Z0-9]+USDT$/.test(t.symbol)) {
      lookup.set(t.symbol, t);
    }
  }
  return lookup;
}

function signalScore(
  fundingPct: number | null, oiRatio: number | null,
  daily: number | null, volumeRatio: number | null, isShort: boolean,
): number | null {
  if (fundingPct == null || oiRatio == null || daily == null || volumeRatio == null) return null;
  // OI is total open interest (longs + shorts). Funding is only a proxy for
  // directional crowding; neither tells us actual short/long liquidation levels.
  const crowding = isShort ? -fundingPct : fundingPct;
  const adverseMove = isShort ? daily : -daily;
  const a = clamp(crowding / 0.05, 0, 1) * 40;
  const b = clamp(oiRatio / 0.2, 0, 1) * 30;
  const c = clamp(adverseMove / 10, 0, 1) * 20;
  const d = clamp(volumeRatio / 0.35, 0, 1) * 10;
  return Math.round(a + b + c + d);
}

function momentumScore(d1h: number | null, d24h: number | null, d7d: number | null, rsi: number | null, vol: number | null): number | null {
  if (d24h == null || d7d == null || vol == null) return null;
  let result = 50 + clamp(d24h, -15, 15) * 1.2 + clamp(d7d, -30, 30) * 0.55;
  if (d1h != null) result += clamp(d1h, -10, 10) * 0.8;
  if (rsi != null) result += (rsi - 50) * 0.14;
  result += clamp(vol, 0, 0.25) * 28;
  return Math.round(clamp(result, 0, 100));
}

async function load(): Promise<RadarPayload> {
  const [gecko, bybit] = await Promise.allSettled([getGecko(), getBybit()]);
  if (gecko.status !== "fulfilled") throw gecko.reason;
  const futures = bybit.status === "fulfilled" ? bybit.value : new Map<string, BybitTicker>();
  const collisions = new Map<string, number>();
  for (const coin of gecko.value) {
    const sym = coin.symbol.toUpperCase();
    collisions.set(sym, (collisions.get(sym) ?? 0) + 1);
  }
  let matched = 0;
  const rows = gecko.value.map((coin, i): RadarRow => {
    const symbol = coin.symbol.toUpperCase();
    // Avoid unsafe ticker joins (multiple CoinGecko assets share the same symbol).
    const future = collisions.get(symbol) === 1 ? futures.get(symbol + "USDT") : undefined;
    if (future) matched++;
    const marketCap = num(coin.market_cap);
    const volume24h = num(coin.total_volume);
    const price = num(coin.current_price);
    const fundingRate = future ? num(future.fundingRate) : null;
    const fundingPct = fundingRate == null ? null : fundingRate * 100;
    const openInterestUsd = future ? num(future.openInterestValue) : null;
    const oiToMarketCap = openInterestUsd != null && marketCap != null && marketCap > 0
      ? openInterestUsd / marketCap : null;
    const volumeToMarketCap = volume24h != null && marketCap != null && marketCap > 0
      ? volume24h / marketCap : null;
    const change24h = num(coin.price_change_percentage_24h);
    const change7d = num(coin.price_change_percentage_7d_in_currency);
    const change1h = num(coin.price_change_percentage_1h_in_currency);
    const rsi = sparkRsi(coin.sparkline_in_7d?.price);
    return {
      id: coin.id, symbol, name: coin.name, rank: num(coin.market_cap_rank) ?? i + 1,
      price, marketCap, volume24h, volumeToMarketCap,
      change1h, change24h, change7d,
      change30d: num(coin.price_change_percentage_30d_in_currency),
      rsi7dSparkline: rsi, fundingPct, openInterestUsd,
      oiToMarketCap, derivativesTurnover24h: future ? num(future.turnover24h) : null,
      shortSqueezeScore: signalScore(fundingPct, oiToMarketCap, change24h, volumeToMarketCap, true),
      longSqueezeScore: signalScore(fundingPct, oiToMarketCap, change24h, volumeToMarketCap, false),
      momentumScore: momentumScore(change1h, change24h, change7d, rsi, volumeToMarketCap),
    };
  });
  return {
    rows, updatedAt: new Date().toISOString(),
    source: "CoinGecko markets + Bybit USDT perpetuals",
    derivativesAvailable: bybit.status === "fulfilled",
    derivativesMatched: matched,
    ...(bybit.status !== "fulfilled" ? { warning: "Derivatives unavailable; funding, OI and squeeze scores are not populated." } : {}),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: cors });
  }
  try {
    if (cache && Date.now() - cache.at < TTL_MS) {
      return new Response(JSON.stringify(cache.payload), { headers: cors });
    }
    const payload = await load();
    cache = { payload, at: Date.now() };
    return new Response(JSON.stringify(payload), { headers: cors });
  } catch (error) {
    if (cache) {
      return new Response(JSON.stringify({ ...cache.payload, stale: true, warning: "Data source temporarily unavailable; showing cached snapshot." }), { headers: cors });
    }
    return new Response(JSON.stringify({ error: "Radar unavailable: " + String(error) }), {
      status: 503, headers: cors,
    });
  }
});
