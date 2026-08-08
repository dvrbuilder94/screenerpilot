// "What changed" engine. Compares a compact snapshot of an asset's technical
// state against the last time the user viewed it (persisted device-local) and
// reports only REAL deltas — bias shifts, EMA crossings, RSI regime changes,
// MACD flips, 52-week range moves. No history → say so, don't invent changes.
import type { Analysis, Bias, DecisionSnapshot } from "@/types/analysis";

export type EmaRelation = "above" | "below" | null;
export type RsiRegime = "overbought" | "oversold" | "above50" | "below50" | null;
export type MacdSign = "positive" | "negative" | null;
export type ChangeTone = "positive" | "negative" | "neutral";

/** Comparable state persisted between views. Keep it small + stable. */
export interface AssetState {
  bias: Bias;
  ema20: EmaRelation;
  ema50: EmaRelation;
  ema200: EmaRelation;
  rsi: RsiRegime;
  macd: MacdSign;
  rangePosition: number | null; // 0–100 within 52w range
  at: string; // ISO
}

export interface AssetChange {
  label: string;
  tone: ChangeTone;
}

export interface ChangeResult {
  firstLook: boolean;
  since?: string;
  changes: AssetChange[];
}

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const emaRel = (price: number, ema: number | null | undefined): EmaRelation =>
  !isNum(ema) || !isNum(price) ? null : price >= ema ? "above" : "below";

function rsiRegime(v: number | null | undefined): RsiRegime {
  if (!isNum(v)) return null;
  if (v >= 70) return "overbought";
  if (v <= 30) return "oversold";
  return v >= 50 ? "above50" : "below50";
}

/** Build the comparable state from a fresh analysis + its snapshot. */
export function readAssetState(a: Analysis, snapshot: DecisionSnapshot): AssetState {
  const emas = a.indicators?.emas;
  const rangePos = a.indicators?.range52w?.position;
  return {
    bias: snapshot.bias,
    ema20: emaRel(a.price, emas?.ema20),
    ema50: emaRel(a.price, emas?.ema50),
    ema200: emaRel(a.price, emas?.ema200),
    rsi: rsiRegime(a.indicators?.rsi?.value),
    macd: isNum(a.indicators?.macd?.hist) ? ((a.indicators!.macd!.hist >= 0) ? "positive" : "negative") : null,
    rangePosition: isNum(rangePos) ? rangePos : null,
    at: snapshot.computedAt,
  };
}

const RSI_LABEL: Record<Exclude<RsiRegime, null>, { text: string; tone: ChangeTone }> = {
  overbought: { text: "RSI pushed into overbought (pullback risk)", tone: "negative" },
  oversold: { text: "RSI dropped into oversold (bounce setup)", tone: "positive" },
  above50: { text: "RSI reclaimed the neutral 50 line", tone: "positive" },
  below50: { text: "RSI lost the neutral 50 line", tone: "negative" },
};

const biasTone = (b: Bias): ChangeTone => (b === "Bullish" ? "positive" : b === "Bearish" ? "negative" : "neutral");

/** Diff two states → only real changes. Null prev = first look. */
export function diffAssetState(prev: AssetState | null, curr: AssetState): ChangeResult {
  if (!prev) return { firstLook: true, changes: [] };
  const changes: AssetChange[] = [];

  if (prev.bias !== curr.bias) {
    changes.push({ label: `Read shifted from ${prev.bias} to ${curr.bias}`, tone: biasTone(curr.bias) });
  }

  ([20, 50, 200] as const).forEach((span) => {
    const key = `ema${span}` as const;
    const p = prev[key];
    const c = curr[key];
    if (p && c && p !== c) {
      changes.push({
        label: `Price crossed ${c} the ${span}-day EMA`,
        tone: c === "above" ? "positive" : "negative",
      });
    }
  });

  if (prev.rsi && curr.rsi && prev.rsi !== curr.rsi) {
    changes.push({ label: RSI_LABEL[curr.rsi].text, tone: RSI_LABEL[curr.rsi].tone });
  }

  if (prev.macd && curr.macd && prev.macd !== curr.macd) {
    changes.push({ label: `MACD momentum turned ${curr.macd}`, tone: curr.macd === "positive" ? "positive" : "negative" });
  }

  if (isNum(prev.rangePosition) && isNum(curr.rangePosition)) {
    if (prev.rangePosition < 80 && curr.rangePosition >= 80) {
      changes.push({ label: "Pushed into the top of its 52-week range", tone: "positive" });
    } else if (prev.rangePosition > 20 && curr.rangePosition <= 20) {
      changes.push({ label: "Slipped to the bottom of its 52-week range", tone: "negative" });
    }
  }

  return { firstLook: false, since: prev.at, changes };
}
