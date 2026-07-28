// ── Quant core ───────────────────────────────────────────────────────────────
// The scoring engine behind the Squeeze Radar. Lives server-side so the formula
// is never shipped to the client — the browser only ever sees the final score.
//
// Design: each factor is normalized to a ROBUST cross-sectional z-score (median
// / MAD, so it's relative to the current regime and resistant to outliers), then
// blended through a logistic function into a 0–100 score plus a confidence.
// Weights start as priors and are meant to be re-calibrated on realized
// signal_outcomes (walk-forward) — that calibration is what can't be replicated.

export const median = (xs: number[]): number => {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// Median Absolute Deviation → robust stand-in for standard deviation.
export const mad = (xs: number[], med: number): number =>
  median(xs.map((x) => Math.abs(x - med)));

// Robust z-score. 1.4826 scales MAD to be consistent with σ for normal data.
export function robustZ(x: number, med: number, madv: number): number {
  const scale = madv * 1.4826;
  if (scale < 1e-9) return 0;
  return (x - med) / scale;
}

export const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));
export const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

export interface FactorSpec {
  key: string;
  weight: number; // prior weight (later replaced by calibrated weight)
  // Extract the raw value for an item; higher raw = more bullish/squeeze fuel.
  value: (item: Record<string, number>) => number;
}

export interface ScoredItem {
  score: number; // 0–100
  confidence: number; // 0–1
  z: Record<string, number>; // per-factor z-score (the breakdown the UI shows)
}

// Cross-sectional scoring: normalize each factor across the whole universe, then
// blend. `bias` shifts the logistic center; default 0 keeps 50 as neutral.
export function scoreCrossSection(
  items: Record<string, number>[],
  factors: FactorSpec[],
  bias = 0,
): ScoredItem[] {
  // Precompute median + MAD per factor across the universe.
  const stats = factors.map((f) => {
    const raw = items.map((it) => f.value(it));
    const med = median(raw);
    return { f, med, madv: mad(raw, med) };
  });

  return items.map((it) => {
    const z: Record<string, number> = {};
    let lin = bias;
    let agree = 0;
    let wsum = 0;
    for (const { f, med, madv } of stats) {
      const zi = clamp(robustZ(f.value(it), med, madv), -4, 4);
      z[f.key] = zi;
      lin += f.weight * zi;
      // agreement: how much each factor pulls in the composite's eventual direction
      agree += f.weight * Math.abs(zi);
      wsum += Math.abs(f.weight);
    }
    const score = Math.round(100 * sigmoid(lin));
    // Confidence: strength of factor agreement, squashed to 0–1.
    const confidence = clamp(sigmoid((agree / (wsum || 1)) - 0.4), 0, 1);
    return { score, confidence: Math.round(confidence * 100) / 100, z };
  });
}

export const signalFor = (s: number): "extreme" | "high" | "building" | "neutral" =>
  s >= 75 ? "extreme" : s >= 55 ? "high" : s >= 35 ? "building" : "neutral";
