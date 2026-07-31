// Wallet PnL — multi-EVM portfolio + profit/loss for any address. Real data comes
// from the wallet-pnl edge function (Zerion API, single cross-chain call). This
// holds the shared shape + a sample so the UI renders before the key is set.

export interface WalletHolding { symbol: string; name: string; value: number; chain: string }
export interface WalletChain { chain: string; value: number }

export interface WalletPnL {
  totalValue: number; // current portfolio value, USD
  change1d: number; // percent, 24h
  netInvested: number; // net capital put in (received_external − sent_external)
  received: number; // total value received into the wallet
  sent: number; // total value sent out
  realized: number; // realized gain
  unrealized: number; // unrealized gain (on current holdings)
  fees: number; // total gas/fees paid
  byChain: WalletChain[];
  holdings: WalletHolding[];
}

export const isEvmAddress = (a: string) => /^0x[0-9a-fA-F]{40}$/.test(a.trim());

export function fmtUsd(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(2)}`;
}

export const SAMPLE_WALLET: WalletPnL = {
  totalValue: 48210.42,
  change1d: 2.4,
  netInvested: 31500,
  received: 62800,
  sent: 31300,
  realized: 9450,
  unrealized: 7260,
  fees: 842,
  byChain: [
    { chain: "Ethereum", value: 22400 },
    { chain: "Base", value: 12800 },
    { chain: "Arbitrum", value: 8100 },
    { chain: "Optimism", value: 3010 },
    { chain: "Polygon", value: 1900 },
  ],
  holdings: [
    { symbol: "ETH", name: "Ethereum", value: 18400, chain: "Ethereum" },
    { symbol: "USDC", name: "USD Coin", value: 9200, chain: "Base" },
    { symbol: "WBTC", name: "Wrapped BTC", value: 7100, chain: "Arbitrum" },
    { symbol: "AERO", name: "Aerodrome", value: 4300, chain: "Base" },
    { symbol: "ARB", name: "Arbitrum", value: 3010, chain: "Arbitrum" },
    { symbol: "OP", name: "Optimism", value: 2600, chain: "Optimism" },
  ],
};
