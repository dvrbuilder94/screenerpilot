// Asset name mapping for readable display
export const ASSET_NAMES: Record<string, string> = {
  // Crypto
  BTCUSDT: "Bitcoin",
  ETHUSDT: "Ethereum",
  BNBUSDT: "BNB",
  SOLUSDT: "Solana",
  XRPUSDT: "Ripple",
  ADAUSDT: "Cardano",
  DOGEUSDT: "Dogecoin",
  TRXUSDT: "Tron",
  AVAXUSDT: "Avalanche",
  LINKUSDT: "Chainlink",
  DOTUSDT: "Polkadot",
  MATICUSDT: "Polygon",
  UNIUSDT: "Uniswap",
  LTCUSDT: "Litecoin",
  XLMUSDT: "Stellar",
  ATOMUSDT: "Cosmos",
  FILUSDT: "Filecoin",
  NEARUSDT: "Near Protocol",
  APTUSDT: "Aptos",
  SUIUSDT: "Sui",
  CRVUSDT: "Curve",
  AAVEUSDT: "Aave",
  EIGENUSDT: "EigenLayer",
  RNDRUSDT: "Render",

  // Commodities (Yahoo Finance symbols)
  "GC=F": "Gold",
  "SI=F": "Silver",
  "PL=F": "Platinum",
  "PA=F": "Palladium",
  "HG=F": "Copper",
  "CL=F": "Crude Oil",
  "NG=F": "Natural Gas",

  // Magnificent Seven
  AAPL: "Apple",
  MSFT: "Microsoft",
  NVDA: "NVIDIA",
  AMZN: "Amazon",
  GOOGL: "Alphabet",
  META: "Meta",
  TSLA: "Tesla",

  // Other Stocks
  BMNR: "Bitwise DeFi",
  FIGS: "FIGS Inc",
  ADBE: "Adobe",
  FIG: "Simplify ETF",
  "BRK-B": "Berkshire Hathaway",
  AVGO: "Broadcom",
  LLY: "Eli Lilly",
  V: "Visa",
  UNH: "UnitedHealth",
  XOM: "Exxon Mobil",
  WMT: "Walmart",
  JNJ: "Johnson & Johnson",
  ORCL: "Oracle",
  COST: "Costco",
  MA: "Mastercard",
  PG: "Procter & Gamble",
  XPEV: "XPeng",
  RIVN: "Rivian",
  SOFI: "SoFi",
  ENPH: "Enphase Energy",
  SEDG: "SolarEdge",

  // Indices
  "^GSPC": "S&P 500",
  "^RUT": "Russell 2000",
  "^NDX": "NASDAQ 100",

  // ETFs
  SPY: "S&P 500 ETF",
  IWM: "Russell 2000 ETF",
  QQQ: "NASDAQ 100 ETF",

  // Metals (alternative symbols)
  XAUUSD: "Gold",
  XAGUSD: "Silver",
  XPTUSD: "Platinum",
  XPDUSD: "Palladium",
  XCUUSD: "Copper",

  // Rare Earths
  MP: "MP Materials",
  LYSCF: "Lynas Rare Earths",
  ILHMF: "Iluka Resources",
  REMX: "Rare Earth ETF",
};

export function getAssetName(symbol: string): string {
  return ASSET_NAMES[symbol] || symbol;
}
