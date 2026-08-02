// Reusable, pure signal classifiers. Each returns a traceable reading (tone,
// weight, human text) or null when the input is missing — so callers degrade
// gracefully instead of inventing evidence. Shared by the decision engine and
// (later) the Watchlist change-center.

export type Tone = "positive" | "negative" | "neutral";

export interface SignalReading {
  key: string;
  tone: Tone;
  weight: number;
  text: string;
}

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Price vs an EMA. span 200 carries more weight (long-term trend). */
export function emaReading(price: number, ema: number | null | undefined, span: 20 | 50 | 200): SignalReading | null {
  if (!isNum(ema) || !isNum(price)) return null;
  const above = price >= ema;
  if (span === 200) {
    return {
      key: "ema200",
      tone: above ? "positive" : "negative",
      weight: above ? 1.5 : -1.5,
      text: `Long-term trend is ${above ? "constructive" : "under pressure"} versus the 200-day EMA.`,
    };
  }
  return {
    key: `ema${span}`,
    tone: above ? "positive" : "negative",
    weight: above ? 1 : -1,
    text: `Price is ${above ? "above" : "below"} the ${span}-day EMA.`,
  };
}

/** MACD histogram sign = momentum direction. */
export function macdReading(hist: number | null | undefined): SignalReading | null {
  if (!isNum(hist)) return null;
  const positive = hist >= 0;
  return {
    key: "macd",
    tone: positive ? "positive" : "negative",
    weight: positive ? 1 : -1,
    text: `MACD momentum is ${positive ? "positive" : "negative"}.`,
  };
}

/** RSI regime — overbought risk, oversold bounce, or which side of 50. */
export function rsiReading(rsi: number | null | undefined): SignalReading | null {
  if (!isNum(rsi)) return null;
  if (rsi >= 70) return { key: "rsi", tone: "negative", weight: -0.5, text: "RSI is extended and raises pullback risk." };
  if (rsi <= 30) return { key: "rsi", tone: "positive", weight: 0.5, text: "RSI is deeply oversold and may support a rebound." };
  if (rsi >= 50) return { key: "rsi", tone: "positive", weight: 0.5, text: "RSI remains above the neutral 50 level." };
  return { key: "rsi", tone: "negative", weight: -0.5, text: "RSI remains below the neutral 50 level." };
}
