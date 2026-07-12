// A curated directory of the most-searched tickers so search can autocomplete
// by symbol OR company name — instantly, with no backend call. Any exact ticker
// not in this list still works: typing it and pressing enter opens /asset.
export interface TickerEntry {
  symbol: string;
  name: string;
  type: "stock" | "crypto" | "etf";
}

export const TICKER_DIRECTORY: TickerEntry[] = [
  // Mega / popular stocks
  { symbol: "AAPL", name: "Apple", type: "stock" },
  { symbol: "MSFT", name: "Microsoft", type: "stock" },
  { symbol: "NVDA", name: "Nvidia", type: "stock" },
  { symbol: "AMZN", name: "Amazon", type: "stock" },
  { symbol: "GOOGL", name: "Alphabet (Google)", type: "stock" },
  { symbol: "META", name: "Meta Platforms", type: "stock" },
  { symbol: "TSLA", name: "Tesla", type: "stock" },
  { symbol: "AMD", name: "Advanced Micro Devices", type: "stock" },
  { symbol: "NFLX", name: "Netflix", type: "stock" },
  { symbol: "INTC", name: "Intel", type: "stock" },
  { symbol: "AVGO", name: "Broadcom", type: "stock" },
  { symbol: "QCOM", name: "Qualcomm", type: "stock" },
  { symbol: "MU", name: "Micron", type: "stock" },
  { symbol: "MRVL", name: "Marvell", type: "stock" },
  { symbol: "SMCI", name: "Super Micro Computer", type: "stock" },
  { symbol: "ARM", name: "Arm Holdings", type: "stock" },
  { symbol: "TSM", name: "TSMC", type: "stock" },
  { symbol: "ORCL", name: "Oracle", type: "stock" },
  { symbol: "CRM", name: "Salesforce", type: "stock" },
  { symbol: "ADBE", name: "Adobe", type: "stock" },
  { symbol: "PLTR", name: "Palantir", type: "stock" },
  { symbol: "COIN", name: "Coinbase", type: "stock" },
  { symbol: "HOOD", name: "Robinhood", type: "stock" },
  { symbol: "SOFI", name: "SoFi Technologies", type: "stock" },
  { symbol: "PYPL", name: "PayPal", type: "stock" },
  { symbol: "SQ", name: "Block (Square)", type: "stock" },
  { symbol: "SHOP", name: "Shopify", type: "stock" },
  { symbol: "UBER", name: "Uber", type: "stock" },
  { symbol: "ABNB", name: "Airbnb", type: "stock" },
  { symbol: "DASH", name: "DoorDash", type: "stock" },
  { symbol: "RDDT", name: "Reddit", type: "stock" },
  { symbol: "SPOT", name: "Spotify", type: "stock" },
  { symbol: "SNAP", name: "Snap", type: "stock" },
  { symbol: "PINS", name: "Pinterest", type: "stock" },
  { symbol: "RBLX", name: "Roblox", type: "stock" },
  { symbol: "ROKU", name: "Roku", type: "stock" },
  { symbol: "DKNG", name: "DraftKings", type: "stock" },
  { symbol: "CRWD", name: "CrowdStrike", type: "stock" },
  { symbol: "SNOW", name: "Snowflake", type: "stock" },
  { symbol: "DDOG", name: "Datadog", type: "stock" },
  { symbol: "NET", name: "Cloudflare", type: "stock" },
  { symbol: "PANW", name: "Palo Alto Networks", type: "stock" },
  { symbol: "MDB", name: "MongoDB", type: "stock" },
  { symbol: "DIS", name: "Disney", type: "stock" },
  { symbol: "BA", name: "Boeing", type: "stock" },
  { symbol: "NKE", name: "Nike", type: "stock" },
  { symbol: "SBUX", name: "Starbucks", type: "stock" },
  { symbol: "MCD", name: "McDonald's", type: "stock" },
  { symbol: "KO", name: "Coca-Cola", type: "stock" },
  { symbol: "PEP", name: "PepsiCo", type: "stock" },
  { symbol: "WMT", name: "Walmart", type: "stock" },
  { symbol: "COST", name: "Costco", type: "stock" },
  { symbol: "TGT", name: "Target", type: "stock" },
  { symbol: "HD", name: "Home Depot", type: "stock" },
  { symbol: "JPM", name: "JPMorgan Chase", type: "stock" },
  { symbol: "BAC", name: "Bank of America", type: "stock" },
  { symbol: "GS", name: "Goldman Sachs", type: "stock" },
  { symbol: "MS", name: "Morgan Stanley", type: "stock" },
  { symbol: "V", name: "Visa", type: "stock" },
  { symbol: "MA", name: "Mastercard", type: "stock" },
  { symbol: "BRK-B", name: "Berkshire Hathaway", type: "stock" },
  { symbol: "JNJ", name: "Johnson & Johnson", type: "stock" },
  { symbol: "PFE", name: "Pfizer", type: "stock" },
  { symbol: "MRNA", name: "Moderna", type: "stock" },
  { symbol: "LLY", name: "Eli Lilly", type: "stock" },
  { symbol: "UNH", name: "UnitedHealth", type: "stock" },
  { symbol: "HIMS", name: "Hims & Hers Health", type: "stock" },
  { symbol: "OSCR", name: "Oscar Health", type: "stock" },
  { symbol: "XOM", name: "Exxon Mobil", type: "stock" },
  { symbol: "CVX", name: "Chevron", type: "stock" },
  { symbol: "F", name: "Ford", type: "stock" },
  { symbol: "GM", name: "General Motors", type: "stock" },
  { symbol: "RIVN", name: "Rivian", type: "stock" },
  { symbol: "LCID", name: "Lucid Group", type: "stock" },
  { symbol: "NIO", name: "NIO", type: "stock" },
  { symbol: "XPEV", name: "XPeng", type: "stock" },
  { symbol: "LI", name: "Li Auto", type: "stock" },
  { symbol: "GME", name: "GameStop", type: "stock" },
  { symbol: "AMC", name: "AMC Entertainment", type: "stock" },
  { symbol: "BBAI", name: "BigBear.ai", type: "stock" },
  { symbol: "IONQ", name: "IonQ", type: "stock" },
  { symbol: "RGTI", name: "Rigetti Computing", type: "stock" },
  { symbol: "QBTS", name: "D-Wave Quantum", type: "stock" },
  { symbol: "LAC", name: "Lithium Americas", type: "stock" },
  { symbol: "ALB", name: "Albemarle", type: "stock" },
  { symbol: "MARA", name: "Marathon Digital", type: "stock" },
  { symbol: "RIOT", name: "Riot Platforms", type: "stock" },
  { symbol: "CLSK", name: "CleanSpark", type: "stock" },
  { symbol: "MSTR", name: "MicroStrategy", type: "stock" },
  { symbol: "BMNR", name: "Bitmine Immersion", type: "stock" },
  { symbol: "ASTS", name: "AST SpaceMobile", type: "stock" },
  { symbol: "RKLB", name: "Rocket Lab", type: "stock" },
  { symbol: "ACHR", name: "Archer Aviation", type: "stock" },
  { symbol: "JOBY", name: "Joby Aviation", type: "stock" },
  { symbol: "BABA", name: "Alibaba", type: "stock" },
  { symbol: "PDD", name: "PDD Holdings", type: "stock" },
  { symbol: "NU", name: "Nu Holdings", type: "stock" },
  { symbol: "MELI", name: "MercadoLibre", type: "stock" },
  // Crypto
  { symbol: "BTC-USD", name: "Bitcoin", type: "crypto" },
  { symbol: "ETH-USD", name: "Ethereum", type: "crypto" },
  { symbol: "SOL-USD", name: "Solana", type: "crypto" },
  { symbol: "XRP-USD", name: "XRP", type: "crypto" },
  { symbol: "DOGE-USD", name: "Dogecoin", type: "crypto" },
  { symbol: "ADA-USD", name: "Cardano", type: "crypto" },
  { symbol: "AVAX-USD", name: "Avalanche", type: "crypto" },
  { symbol: "LINK-USD", name: "Chainlink", type: "crypto" },
  { symbol: "DOT-USD", name: "Polkadot", type: "crypto" },
  { symbol: "MATIC-USD", name: "Polygon", type: "crypto" },
  { symbol: "SHIB-USD", name: "Shiba Inu", type: "crypto" },
  { symbol: "LTC-USD", name: "Litecoin", type: "crypto" },
  { symbol: "BNB-USD", name: "BNB", type: "crypto" },
  { symbol: "TRX-USD", name: "Tron", type: "crypto" },
  { symbol: "UNI-USD", name: "Uniswap", type: "crypto" },
  { symbol: "PEPE-USD", name: "Pepe", type: "crypto" },
  { symbol: "WIF-USD", name: "dogwifhat", type: "crypto" },
  { symbol: "BONK-USD", name: "Bonk", type: "crypto" },
  { symbol: "TON-USD", name: "Toncoin", type: "crypto" },
  { symbol: "NEAR-USD", name: "NEAR Protocol", type: "crypto" },
  // ETFs
  { symbol: "SPY", name: "S&P 500 ETF", type: "etf" },
  { symbol: "QQQ", name: "Nasdaq 100 ETF", type: "etf" },
  { symbol: "VOO", name: "Vanguard S&P 500", type: "etf" },
  { symbol: "IWM", name: "Russell 2000 ETF", type: "etf" },
  { symbol: "DIA", name: "Dow Jones ETF", type: "etf" },
  { symbol: "VTI", name: "Total Market ETF", type: "etf" },
  { symbol: "ARKK", name: "ARK Innovation ETF", type: "etf" },
  { symbol: "GLD", name: "Gold ETF", type: "etf" },
  { symbol: "SLV", name: "Silver ETF", type: "etf" },
  { symbol: "TLT", name: "20Y Treasury ETF", type: "etf" },
  { symbol: "SMH", name: "Semiconductor ETF", type: "etf" },
  { symbol: "SOXL", name: "Semis Bull 3x", type: "etf" },
  { symbol: "TQQQ", name: "Nasdaq Bull 3x", type: "etf" },
  { symbol: "URA", name: "Uranium ETF", type: "etf" },
];

// Rank matches by symbol/name relevance.
export function searchTickers(query: string, limit = 8): TickerEntry[] {
  const s = query.trim().toUpperCase();
  if (!s) return [];
  const scored: { t: TickerEntry; score: number }[] = [];
  for (const t of TICKER_DIRECTORY) {
    const sym = t.symbol.toUpperCase();
    const name = t.name.toUpperCase();
    let score = 0;
    if (sym === s) score = 100;
    else if (sym.startsWith(s)) score = 80;
    else if (name.startsWith(s)) score = 65;
    else if (name.includes(s)) score = 45;
    else if (sym.includes(s)) score = 30;
    if (score > 0) scored.push({ t, score });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((x) => x.t);
}
