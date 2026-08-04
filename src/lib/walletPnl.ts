// Wallet PnL — multi-EVM portfolio + profit/loss for any address. Real data comes
// from the wallet-pnl edge function (Zerion API, single cross-chain call). This
// holds the shared shape + a sample so the UI renders before the key is set.

export interface WalletHolding { symbol: string; name: string; value: number; chain: string }
export interface WalletChain { chain: string; value: number }
export interface WalletPoint { t: number; v: number } // t = epoch ms, v = portfolio value USD

// Chart periods mirror Zerion's chart endpoint. Labels are what the UI shows.
export type WalletPeriod = "week" | "month" | "year" | "max";
export const WALLET_PERIODS: { id: WalletPeriod; label: string }[] = [
  { id: "week", label: "1W" },
  { id: "month", label: "1M" },
  { id: "year", label: "1Y" },
  { id: "max", label: "Max" },
];

export interface WalletPnL {
  totalValue: number; // current portfolio value, USD
  change1d: number; // percent, 24h
  netInvested: number; // net capital put in (received_external − sent_external)
  received: number; // total value received into the wallet
  sent: number; // total value sent out
  realized: number; // realized gain
  unrealized: number; // unrealized gain (on current holdings)
  fees: number; // total gas/fees paid
  byChain: WalletChain[];
  holdings: WalletHolding[];
  chart?: WalletPoint[]; // portfolio value over the requested period
  period?: WalletPeriod;
}

export type PositionState = "overbought" | "oversold" | "neutral" | "unknown";

export interface PositionAnalysis {
  symbol: string;
  name: string;
  chain: string;
  value: number; // USD exposure
  price: number;
  change1d: number; // %
  rsi: number | null;
  state: PositionState;
  trendUp: boolean;
  pctFromHigh: number; // <= 0, distance below the window high
  note: string; // plain-language evidence for the state
}

export interface WalletAnalysis {
  minValue: number;
  analyzed: number;
  positions: PositionAnalysis[];
}

// Badge label + semantic tone for a position's momentum state.
export const STATE_META: Record<PositionState, { label: string; tone: "neg" | "pos" | "muted" }> = {
  overbought: { label: "Overbought", tone: "neg" },
  oversold: { label: "Oversold", tone: "pos" },
  neutral: { label: "Neutral", tone: "muted" },
  unknown: { label: "No data", tone: "muted" },
};

export const isEvmAddress = (a: string) => /^0x[0-9a-fA-F]{40}$/.test(a.trim());

export function fmtUsd(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(2)}`;
}

// Deterministic sample portfolio-value series (90 days) so the chart renders
// before ZERION_API_KEY is set. Always shown under the "Sample data" banner —
// never presented as a real wallet.
function sampleSeries(): WalletPoint[] {
  const days = 90;
  const now = Date.now();
  const start = 34800;
  const end = 48210.42;
  let seed = 42;
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const pts: WalletPoint[] = [];
  for (let i = 0; i < days; i++) {
    const p = i / (days - 1);
    const base = start + (end - start) * p;
    const noise = (rand() - 0.5) * 2600;
    pts.push({ t: now - (days - 1 - i) * 86400000, v: Math.max(0, base + noise) });
  }
  pts[pts.length - 1].v = end; // land on the headline value
  return pts;
}

export const SAMPLE_WALLET: WalletPnL = {
  totalValue: 48210.42,
  change1d: 2.4,
  netInvested: 31500,
  received: 62800,
  sent: 31300,
  realized: 9450,
  unrealized: 7260,
  fees: 842,
  period: "month",
  chart: sampleSeries(),
  byChain: [
    { chain: "Ethereum", value: 22400 },
    { chain: "Base", value: 12800 },
    { chain: "Arbitrum", value: 8100 },
    { chain: "Optimism", value: 3010 },
    { chain: "Polygon", value: 1900 },
  ],
  holdings: [
    { symbol: "ETH", name: "Ethereum", value: 18400, chain: "Ethereum" },
    { symbol: "USDC", name: "USD Coin", value: 9200, chain: "Base" },
    { symbol: "WBTC", name: "Wrapped BTC", value: 7100, chain: "Arbitrum" },
    { symbol: "AERO", name: "Aerodrome", value: 4300, chain: "Base" },
    { symbol: "ARB", name: "Arbitrum", value: 3010, chain: "Arbitrum" },
    { symbol: "OP", name: "Optimism", value: 2600, chain: "Optimism" },
  ],
};

// Sample per-position analysis (mirrors SAMPLE_WALLET). Shown only under the
// "Sample data" banner — never presented as a real read.
export const SAMPLE_ANALYSIS: WalletAnalysis = {
  minValue: 10,
  analyzed: 6,
  positions: [
    { symbol: "ETH", name: "Ethereum", chain: "Ethereum", value: 18400, price: 3120, change1d: 1.8, rsi: 58, state: "neutral", trendUp: true, pctFromHigh: -4, note: "RSI 58 — neutral. Above its 30d average." },
    { symbol: "USDC", name: "USD Coin", chain: "Base", value: 9200, price: 1, change1d: 0.0, rsi: 50, state: "neutral", trendUp: true, pctFromHigh: 0, note: "RSI 50 — neutral. Stablecoin, no directional momentum." },
    { symbol: "WBTC", name: "Wrapped BTC", chain: "Arbitrum", value: 7100, price: 67200, change1d: 2.3, rsi: 73, state: "overbought", trendUp: true, pctFromHigh: -1, note: "RSI 73 — overbought (>70), near its 30d high. Momentum extended." },
    { symbol: "AERO", name: "Aerodrome", chain: "Base", value: 4300, price: 1.12, change1d: 5.1, rsi: 78, state: "overbought", trendUp: true, pctFromHigh: -2, note: "RSI 78 — overbought (>70), near its 30d high. Momentum extended." },
    { symbol: "ARB", name: "Arbitrum", chain: "Arbitrum", value: 3010, price: 0.62, change1d: -3.4, rsi: 28, state: "oversold", trendUp: false, pctFromHigh: -22, note: "RSI 28 — oversold (<30). Momentum washed out; watch for stabilization." },
    { symbol: "OP", name: "Optimism", chain: "Optimism", value: 2600, price: 1.45, change1d: -1.2, rsi: 44, state: "neutral", trendUp: false, pctFromHigh: -15, note: "RSI 44 — neutral. Below its 30d average." },
  ],
};
