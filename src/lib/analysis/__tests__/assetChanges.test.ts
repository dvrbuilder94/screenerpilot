import { describe, it, expect } from "vitest";
import { readAssetState, diffAssetState, type AssetState } from "@/lib/analysis/assetChanges";
import type { Analysis, DecisionSnapshot } from "@/types/analysis";

const snapshot = (over: Partial<DecisionSnapshot> = {}): DecisionSnapshot => ({
  bias: "Neutral", confidence: 55, confidenceBasis: "", summary: "", evidenceFor: [], evidenceAgainst: [],
  invalidation: "", horizon: "", variablesUsed: [], warnings: [], methodologyVersion: "v", computedAt: "2026-01-02T00:00:00.000Z",
  ...over,
});

const analysis = (over: Partial<Analysis> = {}): Analysis => ({
  symbol: "T", companyName: "T", price: 100, marketCap: "N/A", ...over,
});

const state = (over: Partial<AssetState> = {}): AssetState => ({
  bias: "Neutral", ema20: null, ema50: null, ema200: null, rsi: null, macd: null, rangePosition: null,
  at: "2026-01-01T00:00:00.000Z", ...over,
});

describe("readAssetState", () => {
  it("maps analysis + snapshot into a comparable state", () => {
    const s = readAssetState(
      analysis({ price: 100, indicators: { emas: { ema20: 90, ema50: 105, ema200: null }, rsi: { value: 72, label: "" }, macd: { hist: -0.3, label: "" }, range52w: { high: 1, low: 0, position: 85 } } }),
      snapshot({ bias: "Bullish" }),
    );
    expect(s).toMatchObject({ bias: "Bullish", ema20: "above", ema50: "below", ema200: null, rsi: "overbought", macd: "negative", rangePosition: 85 });
  });
});

describe("diffAssetState", () => {
  it("is a first look when there is no prior state", () => {
    const r = diffAssetState(null, state());
    expect(r.firstLook).toBe(true);
    expect(r.changes).toHaveLength(0);
  });

  it("reports no changes when nothing moved", () => {
    const s = state({ bias: "Bullish", ema50: "above", rsi: "above50" });
    const r = diffAssetState(s, { ...s, at: "2026-01-02T00:00:00.000Z" });
    expect(r.firstLook).toBe(false);
    expect(r.changes).toHaveLength(0);
    expect(r.since).toBe(s.at);
  });

  it("detects a bias shift", () => {
    const r = diffAssetState(state({ bias: "Bullish" }), state({ bias: "Bearish" }));
    expect(r.changes[0]).toMatchObject({ tone: "negative" });
    expect(r.changes[0].label).toMatch(/Bullish to Bearish/);
  });

  it("detects an EMA crossing", () => {
    const r = diffAssetState(state({ ema50: "below" }), state({ ema50: "above" }));
    expect(r.changes).toEqual([{ label: "Price crossed above the 50-day EMA", tone: "positive", importance: 2 }]);
  });

  it("detects an RSI regime change and MACD flip", () => {
    const r = diffAssetState(state({ rsi: "below50", macd: "negative" }), state({ rsi: "above50", macd: "positive" }));
    expect(r.changes.map((c) => c.tone)).toEqual(["positive", "positive"]);
  });

  it("detects a move into the top of the 52-week range", () => {
    const r = diffAssetState(state({ rangePosition: 60 }), state({ rangePosition: 90 }));
    expect(r.changes).toEqual([{ label: "Pushed into the top of its 52-week range", tone: "positive", importance: 1 }]);
  });

  it("ranks thesis and long-term trend changes above secondary context", () => {
    const r = diffAssetState(
      state({ bias: "Bullish", ema200: "above", rangePosition: 60 }),
      state({ bias: "Bearish", ema200: "below", rangePosition: 10 }),
    );
    expect(r.changes.map((c) => c.importance)).toEqual([3, 3, 1]);
  });

  it("does not invent changes from missing (null) readings", () => {
    const r = diffAssetState(state({ ema50: null }), state({ ema50: "above" }));
    expect(r.changes).toHaveLength(0);
  });
});
