export interface CryptoRadarRow {
  id: string;
  rank: number;
  symbol: string;
  name: string;
  price: number | null;
  marketCap: number | null;
  volume24h: number | null;
  volumeToMarketCap: number | null;
  change1h: number | null;
  change24h: number | null;
  change7d: number | null;
  change30d: number | null;
  rsi7dSparkline: number | null;
  fundingPct: number | null;
  openInterestUsd: number | null;
  oiToMarketCap: number | null;
  derivativesTurnover24h: number | null;
  shortSqueezeScore: number | null;
  longSqueezeScore: number | null;
  momentumScore: number | null;
}
export interface CryptoRadarResponse {
  rows: CryptoRadarRow[];
  updatedAt: string;
  source: string;
  derivativesAvailable: boolean;
  derivativesMatched: number;
  stale?: boolean;
  warning?: string;
}
export type RadarFilter = "all" | "short" | "long" | "momentum" | "oversold" | "derivatives";
export type RadarSort = "rank" | "shortSqueezeScore" | "longSqueezeScore" | "momentumScore" | "volumeToMarketCap" | "change24h" | "change7d" | "oiToMarketCap";
export function sortAndFilterRadar(rows: CryptoRadarRow[], search: string, filter: RadarFilter, sort: RadarSort): CryptoRadarRow[] {
  const needle = search.trim().toLowerCase();
  return rows.filter((row) => {
    if (needle && !row.name.toLowerCase().includes(needle) && !row.symbol.toLowerCase().includes(needle)) return false;
    switch (filter) {
      case "short": return row.fundingPct != null && row.fundingPct < 0 && row.shortSqueezeScore != null && row.shortSqueezeScore >= 45;
      case "long": return row.fundingPct != null && row.fundingPct > 0 && row.longSqueezeScore != null && row.longSqueezeScore >= 45;
      case "momentum": return row.momentumScore != null && row.momentumScore >= 70;
      case "oversold": return row.rsi7dSparkline != null && row.rsi7dSparkline < 35;
      case "derivatives": return row.openInterestUsd != null;
      default: return true;
    }
  }).sort((a, b) => {
    if (sort === "rank") return a.rank - b.rank;
    const av = a[sort], bv = b[sort];
    if (av == null && bv == null) return a.rank - b.rank;
    if (av == null) return 1;
    if (bv == null) return -1;
    return bv - av || a.rank - b.rank;
  });
}
export function formatUsd(value: number | null): string {
  if (value == null) return "—";
  if (value >= 1e12) return "$" + (value / 1e12).toFixed(2) + "T";
  if (value >= 1e9) return "$" + (value / 1e9).toFixed(2) + "B";
  if (value >= 1e6) return "$" + (value / 1e6).toFixed(1) + "M";
  if (value < 0.01) return "$" + value.toPrecision(3);
  return "$" + value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}
