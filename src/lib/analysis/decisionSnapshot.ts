// The reading engine. Turns an `Analysis` into a `DecisionSnapshot` — bias,
// confidence (signal ALIGNMENT, not P(profit)), traceable evidence for/against,
// an invalidation level, horizon and warnings. Pure + framework-free so it is
// unit-testable and reusable across the app. Versioned via
// DECISION_SNAPSHOT_VERSION.
//
// Weights (documented): EMA200 ±1.5 (long-term trend dominates) > EMA20/EMA50
// ±1 and MACD ±1 (trend/momentum) > RSI ±0.5 (a modifier, not a driver).
import {
  DECISION_SNAPSHOT_VERSION,
  type Analysis,
  type Bias,
  type DecisionSnapshot,
  type Timeframe,
} from "@/types/analysis";
import { emaReading, macdReading, rsiReading, type SignalReading } from "@/lib/analysis/marketSignals";

const HORIZON: Record<Timeframe, string> = {
  daily: "Swing view (days to weeks)",
  weekly: "Position view (weeks to months)",
  monthly: "Long-term view (months+)",
};

const uniq = (xs: string[]) => Array.from(new Set(xs));

const CONFIDENCE_BASIS =
  "Confidence measures how aligned the available signals are — not a probability of profit.";

export interface SnapshotOptions {
  timeframe?: Timeframe;
  /** Injectable clock for deterministic tests. */
  now?: Date;
}

export function buildDecisionSnapshot(a: Analysis, opts: SnapshotOptions = {}): DecisionSnapshot {
  const ind = a.indicators;
  const emas = ind?.emas;

  // Collect readings in a stable order so evidence and score are deterministic.
  const readings: SignalReading[] = [
    emaReading(a.price, emas?.ema20, 20),
    emaReading(a.price, emas?.ema50, 50),
    emaReading(a.price, emas?.ema200, 200),
    macdReading(ind?.macd?.hist),
    rsiReading(ind?.rsi?.value),
  ].filter((r): r is SignalReading => r !== null);

  const score = readings.reduce((sum, r) => sum + r.weight, 0);
  const maxScore = readings.reduce((sum, r) => sum + Math.abs(r.weight), 0) || 1;
  const normalized = score / maxScore;

  const bias: Bias = normalized >= 0.25 ? "Bullish" : normalized <= -0.25 ? "Bearish" : "Neutral";
  const confidence = readings.length === 0 ? 0 : Math.round(55 + Math.min(Math.abs(normalized), 1) * 30);

  const evidenceFor = uniq(readings.filter((r) => r.tone === "positive").map((r) => r.text)).slice(0, 3);
  const evidenceAgainst = uniq(readings.filter((r) => r.tone === "negative").map((r) => r.text)).slice(0, 3);

  // Invalidation: prefer a stated support level, else the nearest key MA.
  const support = a.priceAction?.support;
  const fallbackLevel = emas?.ema50 ?? emas?.ema200 ?? null;
  const invalidation = support
    ? `Reassess if price loses ${support}.`
    : fallbackLevel != null && Number.isFinite(fallbackLevel)
      ? `Reassess on a sustained move below $${fallbackLevel.toFixed(2)}.`
      : "Reassess if the current trend and momentum signals reverse.";

  const summary =
    readings.length === 0
      ? "Not enough signal data to form a read yet."
      : bias === "Bullish"
        ? "Trend and momentum are currently aligned positively, but the setup still needs confirmation from price action."
        : bias === "Bearish"
          ? "Trend and momentum currently lean negative, with recovery dependent on reclaiming key moving averages."
          : "Signals are mixed. The asset lacks enough alignment for a strong directional read.";

  const warnings: string[] = [];
  if (readings.length === 0) warnings.push("Insufficient indicator data — no reliable read available.");
  else if (readings.length < 2) warnings.push("Only one signal available — treat this as low-conviction.");

  const variablesUsed = uniq([
    ...readings.map((r) => r.key.toUpperCase()),
    ...(support ? ["SUPPORT"] : []),
  ]);

  return {
    bias,
    confidence,
    confidenceBasis: CONFIDENCE_BASIS,
    summary,
    evidenceFor,
    evidenceAgainst,
    invalidation,
    horizon: HORIZON[opts.timeframe ?? "daily"],
    variablesUsed,
    warnings,
    methodologyVersion: DECISION_SNAPSHOT_VERSION,
    computedAt: (opts.now ?? new Date()).toISOString(),
  };
}
