import { describe, expect, it } from "vitest";
import { formatUsd, sortAndFilterRadar, type CryptoRadarRow } from "../cryptoRadar";

function row(rank: number, patch: Partial<CryptoRadarRow> = {}): CryptoRadarRow {
  return {
    id: "asset-" + rank, rank, symbol: "T" + rank, name: "Token " + rank,
    price: 1, marketCap: 100, volume24h: 10, volumeToMarketCap: 0.1,
    change1h: 1, change24h: 4, change7d: 8, change30d: 10,
    rsi7dSparkline: 50, fundingPct: null, openInterestUsd: null, oiToMarketCap: null,
    derivativesTurnover24h: null, shortSqueezeScore: null, longSqueezeScore: null,
    momentumScore: 60, ...patch,
  };
}
describe("Crypto radar filters", () => {
  it("keeps top 200 ordered by market cap rank by default", () => {
    expect(sortAndFilterRadar([row(4),row(1),row(3)], "", "all", "rank").map(r => r.rank)).toEqual([1,3,4]);
  });
  it("never invents short squeeze signals for assets without derivatives", () => {
    expect(sortAndFilterRadar([row(1), row(2, { fundingPct: -0.01, shortSqueezeScore: 70 })], "", "short", "shortSqueezeScore").map(r => r.rank)).toEqual([2]);
  });
  it("places missing values last when sorting scores", () => {
    expect(sortAndFilterRadar([row(1), row(2, { shortSqueezeScore: 60 }), row(3, { shortSqueezeScore: 90 })], "", "all", "shortSqueezeScore").map(r => r.rank)).toEqual([3,2,1]);
  });
  it("does not turn missing amounts into zero", () => {
    expect(formatUsd(null)).toBe("—");
  });
});
