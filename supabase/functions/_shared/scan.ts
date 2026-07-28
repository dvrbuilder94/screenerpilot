// Shared scan builders + weight loader. One source of truth for the factors and
// how each asset class's universe is assembled, so the live scanners, the daily
// recorder and the calibrator all agree on the model.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import type { FactorSpec } from "./quant.ts";
import { stockFactors } from "./ta.ts";

export const CRYPTO_FACTORS: FactorSpec[] = [
  { key: "funding", weight: 1.4, value: (t) => -t.funding },
  { key: "momentum", weight: 1.0, value: (t) => t.change24h },
  { key: "liquidity", weight: 0.5, value: (t) => Math.log10(Math.max(1, t.volume24h)) },
];

export const STOCK_FACTORS: FactorSpec[] = [
  { key: "momentum", weight: 1.2, value: (t) => t.momentum },
  { key: "compression", weight: 0.8, value: (t) => t.compression },
  { key: "trend", weight: 0.6, value: (t) => t.trend },
  { key: "rvol", weight: 0.5, value: (t) => t.rvol },
];

export interface ScanRow {
  symbol: string;
  vals: Record<string, number>; // raw factor inputs
  price: number;
  change24h: number;
  funding?: number;
  volume24h?: number;
  setup?: string;
}

// Override prior weights with calibrated ones (if present) for this asset class.
export async function withWeights(
  sb: SupabaseClient,
  assetType: string,
  base: FactorSpec[],
  horizon = "1w",
): Promise<FactorSpec[]> {
  try {
    const { data } = await sb
      .from("model_weights")
      .select("weights")
      .eq("asset_type", assetType)
      .eq("horizon", horizon)
      .maybeSingle();
    const w = (data?.weights ?? null) as Record<string, number> | null;
    if (!w) return base;
    return base.map((f) => ({ ...f, weight: typeof w[f.key] === "number" ? w[f.key] : f.weight }));
  } catch {
    return base;
  }
}

interface PremiumIndex { symbol: string; lastFundingRate: string }
interface Ticker24h { symbol: string; lastPrice: string; priceChangePercent: string; quoteVolume: string }

export async function buildCryptoItems(minVolume = 10_000_000): Promise<ScanRow[]> {
  const [pRes, tRes] = await Promise.all([
    fetch("https://fapi.binance.com/fapi/v1/premiumIndex"),
    fetch("https://fapi.binance.com/fapi/v1/ticker/24hr"),
  ]);
  if (!pRes.ok || !tRes.ok) return [];
  const premium = (await pRes.json()) as PremiumIndex[];
  const tickers = (await tRes.json()) as Ticker24h[];
  const funding = new Map(premium.map((p) => [p.symbol, p]));

  return tickers
    .filter((t) => t.symbol.endsWith("USDT") && funding.has(t.symbol))
    .map((t) => {
      const f = parseFloat(funding.get(t.symbol)!.lastFundingRate);
      const change24h = parseFloat(t.priceChangePercent);
      const volume24h = parseFloat(t.quoteVolume);
      return {
        symbol: t.symbol.replace(/USDT$/, ""),
        vals: { funding: f, change24h, volume24h },
        price: parseFloat(t.lastPrice),
        change24h,
        funding: f,
        volume24h,
      };
    })
    .filter((r) => (r.volume24h ?? 0) >= minVolume && (r.funding ?? 0) < 0);
}

async function candlesFor(sb: SupabaseClient, symbol: string) {
  const { data } = await sb
    .from("asset_candles")
    .select("open, high, low, close, volume, timestamp")
    .eq("symbol", symbol)
    .eq("interval", "1d")
    .order("timestamp", { ascending: false })
    .limit(60);
  return ((data ?? []) as { open: number; high: number; low: number; close: number; volume: number }[]).reverse();
}

export async function buildStockItems(sb: SupabaseClient, universe = 60): Promise<ScanRow[]> {
  const { data: uni } = await sb
    .from("stock_universe")
    .select("symbol")
    .eq("is_active", true)
    .order("market_cap", { ascending: false })
    .limit(universe);
  const symbols = ((uni ?? []) as { symbol: string }[]).map((u) => u.symbol);
  const out: ScanRow[] = [];

  for (let i = 0; i < symbols.length; i += 12) {
    const chunk = symbols.slice(i, i + 12);
    const results = await Promise.all(chunk.map((s) => candlesFor(sb, s)));
    results.forEach((c, j) => {
      if (c.length < 30) return;
      const f = stockFactors(
        c.map((x) => x.open), c.map((x) => x.high), c.map((x) => x.low),
        c.map((x) => x.close), c.map((x) => x.volume),
      );
      if (!f) return;
      out.push({
        symbol: chunk[j],
        vals: { momentum: f.momentum, compression: f.compression, trend: f.trend, rvol: f.rvol },
        price: f.price,
        change24h: f.changePct,
        setup: f.inSqueeze ? "Coiled" : f.momentum > 0 ? "Firing ↑" : "—",
      });
    });
  }
  return out;
}
