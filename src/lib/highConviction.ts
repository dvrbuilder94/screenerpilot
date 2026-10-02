export type HighConvictionBucket =
  | "DAT / crypto-linked"
  | "AI semiconductors"
  | "AI power & grid"
  | "Cooling"
  | "Space / intelligence"
  | "Consumer growth";

export type HighConvictionHolding = {
  symbol: string;
  snapshotValue: number;
  bucket: HighConvictionBucket;
};

export const HIGH_CONVICTION_SNAPSHOT_DATE = "2026-10-01";

export const HIGH_CONVICTION_HOLDINGS: HighConvictionHolding[] = [
  { symbol: "ORBS", snapshotValue: 3663.90, bucket: "DAT / crypto-linked" },
  { symbol: "ONON", snapshotValue: 629.47, bucket: "Consumer growth" },
  { symbol: "ETHA", snapshotValue: 537.77, bucket: "DAT / crypto-linked" },
  { symbol: "MRVL", snapshotValue: 476.33, bucket: "AI semiconductors" },
  { symbol: "LITS", snapshotValue: 345.80, bucket: "DAT / crypto-linked" },
  { symbol: "RMBS", snapshotValue: 259.41, bucket: "AI semiconductors" },
  { symbol: "VST", snapshotValue: 224.80, bucket: "AI power & grid" },
  { symbol: "GEV", snapshotValue: 213.12, bucket: "AI power & grid" },
  { symbol: "MOD", snapshotValue: 101.13, bucket: "Cooling" },
  { symbol: "BKSY", snapshotValue: 99.27, bucket: "Space / intelligence" },
  { symbol: "POWI", snapshotValue: 99.18, bucket: "AI semiconductors" },
  { symbol: "ZSTK", snapshotValue: 98.00, bucket: "DAT / crypto-linked" },
];

export const HIGH_CONVICTION_TOTAL = HIGH_CONVICTION_HOLDINGS.reduce(
  (sum, holding) => sum + holding.snapshotValue,
  0,
);

export const HIGH_CONVICTION_WEIGHTS = Object.fromEntries(
  HIGH_CONVICTION_HOLDINGS.map((holding) => [
    holding.symbol,
    holding.snapshotValue / HIGH_CONVICTION_TOTAL,
  ]),
) as Record<string, number>;

export const HIGH_CONVICTION_BUCKET_WEIGHTS = HIGH_CONVICTION_HOLDINGS.reduce(
  (acc, holding) => {
    acc[holding.bucket] = (acc[holding.bucket] ?? 0) + holding.snapshotValue / HIGH_CONVICTION_TOTAL;
    return acc;
  },
  {} as Record<HighConvictionBucket, number>,
);
