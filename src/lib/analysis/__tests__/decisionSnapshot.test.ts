import { describe, it, expect } from "vitest";
import { buildDecisionSnapshot } from "@/lib/analysis/decisionSnapshot";
import { emaReading, rsiReading, macdReading } from "@/lib/analysis/marketSignals";
import { DECISION_SNAPSHOT_VERSION, type Analysis } from "@/types/analysis";

const base = (overrides: Partial<Analysis> = {}): Analysis => ({
  symbol: "TEST",
  companyName: "Test Co",
  price: 100,
  marketCap: "N/A",
  ...overrides,
});

const NOW = new Date("2026-01-01T00:00:00.000Z");

describe("buildDecisionSnapshot", () => {
  it("reads bullish when trend and momentum align up", () => {
    const s = buildDecisionSnapshot(
      base({
        price: 100,
        indicators: { emas: { ema20: 90, ema50: 85, ema200: 80 }, macd: { hist: 1.2, label: "" }, rsi: { value: 58, label: "" } },
      }),
      { now: NOW },
    );
    expect(s.bias).toBe("Bullish");
    expect(s.confidence).toBe(85);
    expect(s.evidenceFor.length).toBeGreaterThan(0);
    expect(s.evidenceAgainst).toHaveLength(0);
    expect(s.evidenceFor.length).toBeLessThanOrEqual(3); // capped
  });

  it("reads bearish when trend and momentum align down", () => {
    const s = buildDecisionSnapshot(
      base({
        price: 70,
        indicators: { emas: { ema20: 90, ema50: 85, ema200: 80 }, macd: { hist: -1, label: "" }, rsi: { value: 42, label: "" } },
      }),
      { now: NOW },
    );
    expect(s.bias).toBe("Bearish");
    expect(s.evidenceAgainst.length).toBeGreaterThan(0);
  });

  it("stays neutral on contradictory signals", () => {
    const s = buildDecisionSnapshot(
      base({ price: 85, indicators: { emas: { ema20: 80, ema50: 90, ema200: null } } }),
      { now: NOW },
    );
    expect(s.bias).toBe("Neutral");
    expect(s.evidenceFor).toHaveLength(1);
    expect(s.evidenceAgainst).toHaveLength(1);
  });

  it("degrades gracefully with no indicator data", () => {
    const s = buildDecisionSnapshot(base({ indicators: undefined }), { now: NOW });
    expect(s.bias).toBe("Neutral");
    expect(s.confidence).toBe(0);
    expect(s.warnings.length).toBeGreaterThan(0);
    expect(s.summary).toMatch(/not enough/i);
    expect(s.variablesUsed).toHaveLength(0);
  });

  it("prefers a stated support level for invalidation", () => {
    const s = buildDecisionSnapshot(
      base({ priceAction: { trend: "", momentum: "", volatility: "", support: "88.50" }, indicators: { emas: { ema20: 90, ema50: 85, ema200: 80 } } }),
      { now: NOW },
    );
    expect(s.invalidation).toBe("Reassess if price loses 88.50.");
    expect(s.variablesUsed).toContain("SUPPORT");
  });

  it("falls back to the nearest key MA for invalidation", () => {
    const s = buildDecisionSnapshot(base({ indicators: { emas: { ema20: null, ema50: 85, ema200: 80 } } }), { now: NOW });
    expect(s.invalidation).toBe("Reassess on a sustained move below $85.00.");
  });

  it("uses a generic invalidation when no level is available", () => {
    const s = buildDecisionSnapshot(base({ price: 100 }), { now: NOW });
    expect(s.invalidation).toMatch(/reassess if the current trend/i);
  });

  it("carries traceable, versioned metadata", () => {
    const s = buildDecisionSnapshot(
      base({ indicators: { emas: { ema20: 90, ema50: 85, ema200: 80 }, rsi: { value: 60, label: "" } } }),
      { timeframe: "weekly", now: NOW },
    );
    expect(s.methodologyVersion).toBe(DECISION_SNAPSHOT_VERSION);
    expect(s.horizon).toMatch(/position/i);
    expect(s.computedAt).toBe(NOW.toISOString());
    expect(s.variablesUsed).toEqual(expect.arrayContaining(["EMA20", "EMA50", "EMA200", "RSI"]));
    expect(s.confidenceBasis).toMatch(/not a probability/i);
  });
});

describe("marketSignals", () => {
  it("returns null for missing inputs (no invented evidence)", () => {
    expect(emaReading(100, null, 20)).toBeNull();
    expect(emaReading(100, undefined, 50)).toBeNull();
    expect(macdReading(null)).toBeNull();
    expect(rsiReading(undefined)).toBeNull();
    expect(emaReading(NaN, 90, 20)).toBeNull();
  });

  it("classifies RSI regimes", () => {
    expect(rsiReading(75)?.tone).toBe("negative"); // overbought risk
    expect(rsiReading(25)?.tone).toBe("positive"); // oversold bounce
    expect(rsiReading(55)?.tone).toBe("positive"); // above 50
    expect(rsiReading(45)?.tone).toBe("negative"); // below 50
  });

  it("weights the 200-day EMA more than shorter EMAs", () => {
    expect(Math.abs(emaReading(100, 90, 200)!.weight)).toBe(1.5);
    expect(Math.abs(emaReading(100, 90, 20)!.weight)).toBe(1);
  });
});
