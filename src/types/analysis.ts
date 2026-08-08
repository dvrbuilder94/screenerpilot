// Shared analysis contracts. Kept framework-free so the reading engine can be
// unit-tested and reused by AssetDetail, Watchlist and Home movers alike.

export type Bias = "Bullish" | "Neutral" | "Bearish";
export type Timeframe = "daily" | "weekly" | "monthly";

/** Shape returned by the `analyze-stock` edge function and consumed by the app. */
export interface Analysis {
  symbol: string;
  companyName: string;
  price: number;
  marketCap: string;
  dayChangePercent?: number;
  priceAction?: { trend: string; momentum: string; volatility: string; support: string };
  indicators?: {
    rsi?: { value: number; label: string };
    macd?: { hist: number; label: string };
    bollinger?: { width: number; label: string };
    emas?: { ema20: number | null; ema50: number | null; ema200: number | null };
    range52w?: { high: number; low: number; position: number };
  };
  chart?: { close: number[]; timestamps?: number[] };
}

/** Methodology id — bump when the scoring changes so reads stay traceable. */
export const DECISION_SNAPSHOT_VERSION = "decision_snapshot_v1";

export interface DecisionSnapshot {
  bias: Bias;
  /** 0–100 — measures how ALIGNED the available signals are, NOT a probability of profit. */
  confidence: number;
  confidenceBasis: string;
  summary: string;
  evidenceFor: string[];
  evidenceAgainst: string[];
  invalidation: string;
  /** Reading horizon implied by the timeframe (swing / position / long-term). */
  horizon: string;
  /** Which inputs actually fed the read (traceability). */
  variablesUsed: string[];
  /** Non-blocking caveats — e.g. too few signals to be confident. */
  warnings: string[];
  methodologyVersion: string;
  /** ISO timestamp of when the read was computed. */
  computedAt: string;
}
