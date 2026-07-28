// ── Token Squeeze Radar ──────────────────────────────────────────────────────
// A crypto short-squeeze read for liquid perp-listed tokens. In crypto there's
// no "short interest" like equities — the squeeze signal is built from perp
// data: negative funding (shorts paying to stay short) + price turning up +
// real volume = shorts getting squeezed. Data comes from the token-squeeze-scan
// edge function (Binance futures). This file holds the shared shape, formatting
// and a sample fallback so the UI renders before the function is deployed.

export type SqueezeSignal = "extreme" | "high" | "building" | "neutral";

export type SqueezeAsset = "crypto" | "stock";

export interface SqueezeToken {
  symbol: string; // "BTC" / "NVDA"
  price: number;
  change24h: number; // percent
  funding?: number; // crypto: last funding rate (fraction)
  volume24h?: number; // crypto: quote volume, USD
  setup?: string; // stock: "Coiled" / "Firing ↑"
  score: number; // 0–100 (computed server-side by the quant core)
  confidence: number; // 0–1 factor-agreement confidence
  signal: SqueezeSignal;
  factors?: Record<string, number>; // per-factor z-scores (breakdown)
}

export const FACTOR_LABELS: Record<string, string> = {
  funding: "Funding fuel",
  momentum: "Momentum",
  liquidity: "Liquidity",
  compression: "Coil (squeeze)",
  trend: "Trend",
  rvol: "Rel. volume",
};

export function signalFor(score: number): SqueezeSignal {
  if (score >= 75) return "extreme";
  if (score >= 55) return "high";
  if (score >= 35) return "building";
  return "neutral";
}

// Squeeze score from perp signals. Negative funding is the core fuel; a token
// basing/turning up while shorts pay funding is the classic setup. Volume adds
// conviction. Weights are intentionally simple and tunable.
export function scoreSqueeze(input: {
  funding: number; // fraction
  change24h: number; // percent
  volume24h: number; // USD
}): number {
  const { funding, change24h, volume24h } = input;
  // Negative funding → high fuel. -0.0006 (=-0.06%) maps to ~60 pts.
  const fundingScore = Math.max(0, Math.min(60, -funding * 100_000));
  // Reward a token turning up (not dumping), cap so blow-off tops don't win.
  const momentumScore = Math.max(0, Math.min(22, change24h));
  // Small liquidity boost for >$50M quote volume.
  const volumeScore = volume24h > 50_000_000 ? 12 : volume24h > 10_000_000 ? 6 : 0;
  return Math.round(Math.max(0, Math.min(100, fundingScore * 0.7 + momentumScore * 1.4 + volumeScore)));
}

export function fmtFunding(f: number): string {
  const pct = f * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(4)}%`;
}

export function fmtVolume(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

export const SIGNAL_META: Record<SqueezeSignal, { label: string; color: string }> = {
  extreme: { label: "Extreme", color: "#FF5252" },
  high: { label: "High", color: "#C9F73F" },
  building: { label: "Building", color: "#FFB020" },
  neutral: { label: "Neutral", color: "#9A9AA5" },
};

// Fallback so the radar renders instantly before the edge function is live.
export const SAMPLE_SQUEEZE: SqueezeToken[] = [
  { symbol: "HYPE", price: 38.42, change24h: 6.1, funding: -0.00071, volume24h: 210_000_000, score: 0, signal: "neutral" },
  { symbol: "PEPE", price: 0.0000182, change24h: 4.4, funding: -0.00052, volume24h: 480_000_000, score: 0, signal: "neutral" },
  { symbol: "WIF", price: 2.31, change24h: 3.2, funding: -0.00045, volume24h: 120_000_000, score: 0, signal: "neutral" },
  { symbol: "SOL", price: 214.8, change24h: 2.1, funding: -0.00021, volume24h: 1_800_000_000, score: 0, signal: "neutral" },
  { symbol: "SUI", price: 4.12, change24h: 5.0, funding: -0.00018, volume24h: 90_000_000, score: 0, signal: "neutral" },
  { symbol: "DOGE", price: 0.412, change24h: 1.2, funding: -0.00009, volume24h: 640_000_000, score: 0, signal: "neutral" },
].map((t) => {
  const score = scoreSqueeze(t);
  return { ...t, score, signal: signalFor(score), confidence: Math.min(0.95, 0.4 + score / 160) };
});

// Stock lane sample (TTM-squeeze style setups) — real data comes from
// stock-squeeze-scan once asset_candles is populated.
export const SAMPLE_SQUEEZE_STOCKS: SqueezeToken[] = [
  { symbol: "SMCI", price: 48.9, change24h: 7.2, setup: "Firing ↑", score: 82, confidence: 0.86, signal: "extreme", factors: { momentum: 2.1, compression: 1.4, trend: 1.2, rvol: 1.8 } },
  { symbol: "PLTR", price: 71.3, change24h: 3.1, setup: "Coiled", score: 68, confidence: 0.74, signal: "high", factors: { momentum: 1.1, compression: 1.9, trend: 0.8, rvol: 0.6 } },
  { symbol: "MARA", price: 22.4, change24h: 5.4, setup: "Firing ↑", score: 61, confidence: 0.7, signal: "high", factors: { momentum: 1.6, compression: 0.7, trend: 0.5, rvol: 1.1 } },
  { symbol: "COIN", price: 268.1, change24h: 2.0, setup: "Coiled", score: 54, confidence: 0.63, signal: "building", factors: { momentum: 0.6, compression: 1.7, trend: 0.4, rvol: 0.3 } },
  { symbol: "RBLX", price: 52.7, change24h: 1.4, setup: "Coiled", score: 41, confidence: 0.55, signal: "building", factors: { momentum: 0.3, compression: 1.2, trend: 0.1, rvol: 0.2 } },
  { symbol: "SOFI", price: 14.8, change24h: -0.6, setup: "—", score: 28, confidence: 0.48, signal: "neutral", factors: { momentum: -0.4, compression: 0.5, trend: -0.2, rvol: -0.1 } },
];
