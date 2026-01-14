import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

/* ======================================================
   CONFIG
====================================================== */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const INTERVAL = "1d";
const BATCH_SIZE = 15;
const DELAY_BETWEEN_BATCHES = 800;

/* ======================================================
   ASSET UNIVERSES
====================================================== */

const CRYPTO = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT"];

const STOCKS = [
  // Mega Caps
  "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA",
  "AVGO", "ADBE", "BRK-B", "LLY", "V", "UNH", "XOM", "WMT",
  "JNJ", "ORCL", "COST", "MA", "PG", "NFLX", "PEP", "CSCO",
  "AMD", "INTC", "QCOM", "TXN", "AMAT", "INTU", "ISRG", "BKNG",
  "MU", "LRCX", "KLAC", "ASML", "MRVL", "SNPS", "CDNS", "ORLY",
  "REGN", "VRTX", "MDLZ", "SBUX", "GILD", "ADI", "PANW", "CRWD",
  "FTNT", "ADP", "PYPL", "ABNB", "MAR", "CTAS", "NXPI", "ROP",
  "AEP", "EXC", "PAYX", "ODFL", "FAST", "IDXX", "BIIB", "EA",
  "TTWO", "MNST", "DLTR", "ROST", "KDP", "PCAR", "XEL", "WDAY",
  "ZS", "DDOG", "MDB", "TEAM", "SHOP", "UBER", "LYFT",
  
  // Financials
  "JPM", "BAC", "WFC", "GS", "MS", "C", "AXP", "BLK", "SCHW",
  "PNC", "USB", "TFC", "COF", "BK", "STT", "AMP", "NTRS", "CFG",
  "KEY", "FITB", "RF", "HBAN", "CMA", "ZION", "MTB",
  
  // Communications
  "T", "VZ", "CMCSA", "DIS", "CRM", "NOW", "IBM", "ACN", "SPGI",
  
  // Insurance
  "MMC", "CB", "AIG", "TRV", "AFL", "PRU", "MET", "ALL",
  
  // Healthcare
  "DHR", "ABT", "TMO", "SYK", "MDT", "BMY", "PFE", "MRK", "ABBV",
  "AMGN", "CVS", "CI", "HUM", "UHS", "HCA", "ELV", "CNC", "DVA",
  "ZBH", "BDX", "BAX", "BSX", "EW", "HOLX", "DXCM", "ALGN",
  "A", "IQV", "MTD", "WAT", "TER", "KEYS", "MCHP", "ON", "SWKS", "MPWR",
  
  // Consumer
  "KO", "MCD", "NKE", "TGT", "HD", "LOW", "TJX", "CMG", "YUM",
  "DPZ", "DRI", "F", "GM", "HON", "GE", "CAT", "DE", "RTX",
  "LMT", "NOC", "BA", "UPS", "FDX",
  
  // Utilities
  "NEE", "DUK", "SO", "D", "SRE", "PEG", "ED", "WEC", "ES", "AWK", "ATO",
  
  // Growth Stocks
  "FIGS", "XPEV", "RIVN", "SOFI", "ENPH", "SEDG", "WDC",
  
  // Technology Growth
  "PLTR", "SNOW", "NET", "OKTA", "GTLB", "PATH", "DOCN", "CFLT", "ESTC",
  "BILL", "HUBS", "TWLO", "DOCU", "SMAR", "MNDY", "PCTY", "PAYC",
  "FIVN", "NICE", "DT", "FRSH", "TENB", "VRNS", "QLYS",
  "RPD", "NCNO", "DBX", "WEAV", "BRZE", "AMPL", "AI", "BBAI",
  "IONQ", "RGTI", "QUBT", "TOST", "FOUR", "FLYW", "PSFE", "OLO", "TASK",
  "COUR", "UDMY", "DUOL", "CHGG", "U", "RBLX", "ZI", "S", "FSLY",
  "APPF", "PD", "APP",
  
  // Healthcare/Biotech
  "VEEV", "HIMS", "DOCS", "RXRX", "TDOC", "NBIX", "AXSM", "MRNA", "BNTX",
  "NVAX", "BEAM", "EDIT", "NTLA", "CRSP", "EXAS", "ILMN", "NTRA", "TXG",
  "SDGR", "LEGN", "ALNY", "IONS", "SRPT", "BMRN", "GH", "TWST", "VCYT",
  "MYGN", "RGEN", "MEDP", "DNLI", "ARVN", "RCKT", "RARE", "KURA", "APLS",
  "ARWR", "PCVX", "IOVA", "BLUE", "FATE", "SRRK", "KRYS", "PTCT", "VKTX",
  "VRNA", "BHVN", "CERT", "GTHX", "BBIO",
  
  // Consumer Discretionary
  "CROX", "SHAK", "BROS", "RVLV", "LULU", "DECK", "ONON", "GOOS",
  "WRBY", "ASO", "DKS", "HIBB", "COLM", "PVH", "RL",
  "TPR", "CPRI", "VFC", "HBI", "UAA", "SKX", "NIO", "LI", "LCID",
  "NKLA", "WKHS", "GOEV", "SFIX", "CHWY", "W",
  "ETSY", "CVNA",
  
  // Fintech
  "HOOD", "UPST", "AFRM", "LC", "LMND", "ROOT", "MQ", "PAYO", "DLO",
  "RELY", "NU", "COIN", "MARA", "RIOT", "CLSK", "HUT", "BTBT", "CIFR",
  "HIVE", "BITF", "CORZ", "WULF", "SQ", "OPEN", "RDFN", "RKT", "UWMC",
  "TREE", "GHLD", "CLOV", "OSCR", "ACHR",
  
  // Industrials/Aerospace
  "RKLB", "JOBY", "LILM", "SPCE", "ASTS", "LUNR", "RDW", "PLUG",
  "FCEL", "BLDP", "BE", "BLBD", "LEV", "HYLN",
  "LDOS", "KTOS", "RCAT", "EH", "BWXT",
  
  // Clean Energy
  "RUN", "NOVA", "FSLR", "ARRY", "STEM", "CHPT", "EVGO", "BLNK",
  "QS", "GEVO", "CLNE", "MAXN", "CSIQ", "JKS",
  "DQ", "EOSE", "FLNC",
  
  // Communications/Media
  "ROKU", "TTD", "MGNI", "PUBM", "IAS", "DV", "APPS", "GENI", "SKLZ",
  "DKNG", "PENN", "RSI", "FUBO", "PARA", "WBD", "LYV", "SPOT", "SIRI",
  "IHRT",
  
  // Real Estate
  "ZG", "EXPI", "COMP", "RMAX", "FYBR"
];

const ETFS = ["SPY", "QQQ", "IWM", "DIA", "XLF", "XLK", "XLE", "GLD", "TLT", "HYG", "LQD"];

const INDICES = ["^GSPC", "^NDX", "^DJI", "^RUT", "^VIX"];
const COMMODITIES = ["GC=F", "SI=F", "CL=F", "NG=F"];

type AssetType = "crypto" | "stock" | "etf" | "index" | "commodity";
type Source = "binance" | "yahoo";

interface Asset {
  symbol: string;
  type: AssetType;
  source: Source;
}

/* ======================================================
   BUILD ASSET LIST
====================================================== */

function buildAssets(): Asset[] {
  return [
    ...INDICES.map((s) => ({ symbol: s, type: "index" as const, source: "yahoo" as const })),
    ...STOCKS.map((s) => ({ symbol: s, type: "stock" as const, source: "yahoo" as const })),
    ...ETFS.map((s) => ({ symbol: s, type: "etf" as const, source: "yahoo" as const })),
    ...COMMODITIES.map((s) => ({ symbol: s, type: "commodity" as const, source: "yahoo" as const })),
    ...CRYPTO.map((s) => ({ symbol: s, type: "crypto" as const, source: "binance" as const })),
  ];
}

/* ======================================================
   TYPES
====================================================== */

interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/* ======================================================
   INDICATORS
====================================================== */

function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    out[i] = values[i] * k + out[i - 1] * (1 - k);
  }
  return out;
}

function rsi(values: number[], period = 14): number[] {
  const out: number[] = Array(values.length).fill(null);
  let gain = 0,
    loss = 0;

  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff > 0) gain += diff;
    else loss -= diff;
  }

  let avgGain = gain / period;
  let avgLoss = loss / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

function macd(values: number[]) {
  const fast = ema(values, 12);
  const slow = ema(values, 26);
  const line = fast.map((v, i) => v - slow[i]);
  const signal = ema(line, 9);
  const hist = line.map((v, i) => v - signal[i]);
  return { line, signal, hist };
}

function atr(candles: Candle[], period = 14): number[] {
  const tr: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    tr.push(
      Math.max(
        candles[i].high - candles[i].low,
        Math.abs(candles[i].high - candles[i - 1].close),
        Math.abs(candles[i].low - candles[i - 1].close),
      ),
    );
  }
  const atrRaw = ema(tr, period);
  return Array(period).fill(null).concat(atrRaw);
}

/* REAL Supertrend */
function supertrend(candles: Candle[], period = 10, multiplier = 3) {
  const atrVals = atr(candles, period);
  const trend: ("BULLISH" | "BEARISH")[] = [];
  let prevTrend: "BULLISH" | "BEARISH" = "BULLISH";

  for (let i = period; i < candles.length; i++) {
    const hl2 = (candles[i].high + candles[i].low) / 2;
    const upper = hl2 + multiplier * atrVals[i];
    const lower = hl2 - multiplier * atrVals[i];

    if (candles[i].close > upper) prevTrend = "BULLISH";
    else if (candles[i].close < lower) prevTrend = "BEARISH";

    trend[i] = prevTrend;
  }
  return trend;
}

/* ======================================================
   SIGNAL ENGINE
====================================================== */

function generateSignal(params: {
  ema9: number;
  ema21: number;
  ema50: number;
  rsi: number;
  macd: number;
  macdSignal: number;
  supertrend: "BULLISH" | "BEARISH";
  assetType: AssetType;
}) {
  let score = 0;

  if (params.ema9 > params.ema21 && params.ema21 > params.ema50) score += 30;
  if (params.ema9 < params.ema21 && params.ema21 < params.ema50) score -= 30;

  if (params.rsi < 30) score += 20;
  else if (params.rsi > 70) score -= 20;
  else if (params.rsi > 50) score += 10;
  else score -= 10;

  score += params.macd > params.macdSignal ? 20 : -20;
  score += params.supertrend === "BULLISH" ? 20 : -20;

  const volatilityAdj = params.assetType === "crypto" ? 0.85 : params.assetType === "index" ? 1.2 : 1;

  score *= volatilityAdj;

  let signal = "HOLD";
  if (score > 60) signal = "STRONG_BUY";
  else if (score > 30) signal = "BUY";
  else if (score < -60) signal = "STRONG_SELL";
  else if (score < -30) signal = "SELL";

  return {
    signal,
    score: Math.round(score),
    confidence: Math.min(Math.abs(score), 100),
    trend: score > 10 ? "BULLISH" : score < -10 ? "BEARISH" : "NEUTRAL",
  };
}

/* ======================================================
   DATA FETCHERS
====================================================== */

async function fetchBinance(symbol: string): Promise<Candle[] | null> {
  try {
    const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1d&limit=300`);
    if (!res.ok) return null;
    const raw = await res.json();
    return raw.map((k: any) => ({
      timestamp: k[0],
      open: +k[1],
      high: +k[2],
      low: +k[3],
      close: +k[4],
      volume: +k[5],
    }));
  } catch {
    return null;
  }
}

async function fetchYahoo(symbol: string): Promise<Candle[] | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=2y&interval=1d`,
      { headers: { "User-Agent": "Mozilla/5.0" } },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const r = json.chart?.result?.[0];
    if (!r) return null;

    return r.timestamp
      .map((t: number, i: number) => ({
        timestamp: t * 1000,
        open: r.indicators.quote[0].open[i],
        high: r.indicators.quote[0].high[i],
        low: r.indicators.quote[0].low[i],
        close: r.indicators.quote[0].close[i],
        volume: r.indicators.quote[0].volume?.[i] ?? 0,
      }))
      .filter((c: Candle) => c.close != null);
  } catch {
    return null;
  }
}

/* ======================================================
   PROCESS SINGLE ASSET
====================================================== */

async function processAsset(asset: Asset, supabase: any): Promise<boolean> {
  try {
    const candles = asset.source === "binance" ? await fetchBinance(asset.symbol) : await fetchYahoo(asset.symbol);

    if (!candles || candles.length < 60) {
      console.log(`Skipping ${asset.symbol}: insufficient data`);
      return false;
    }

    const closes = candles.map((c) => c.close);
    const ema9 = ema(closes, 9);
    const ema21 = ema(closes, 21);
    const ema50 = ema(closes, 50);
    const rsiVals = rsi(closes);
    const macdVals = macd(closes);
    const st = supertrend(candles);

    const i = candles.length - 1;

    const signal = generateSignal({
      ema9: ema9[i],
      ema21: ema21[i],
      ema50: ema50[i],
      rsi: rsiVals[i],
      macd: macdVals.line[i],
      macdSignal: macdVals.signal[i],
      supertrend: st[i],
      assetType: asset.type,
    });

    await supabase.from("asset_snapshots").upsert(
      {
        symbol: asset.symbol,
        asset_type: asset.type,
        interval: INTERVAL,
        current_price: closes[i],
        signal_type: signal.signal,
        signal_score: signal.score,
        confidence: signal.confidence,
        trend: signal.trend,
        calculated_at: new Date().toISOString(),
      },
      { onConflict: "symbol,asset_type,interval" },
    );

    return true;
  } catch (err) {
    console.log(`Error processing ${asset.symbol}:`, err);
    return false;
  }
}

/* ======================================================
   SERVER
====================================================== */

serve(async () => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const assets = buildAssets();
  console.log(`Processing ${assets.length} assets in batches of ${BATCH_SIZE}`);

  let processed = 0;
  let failed = 0;

  // Process in batches with parallel requests per batch
  for (let i = 0; i < assets.length; i += BATCH_SIZE) {
    const batch = assets.slice(i, i + BATCH_SIZE);
    
    const results = await Promise.all(
      batch.map(asset => processAsset(asset, supabase))
    );
    
    results.forEach(success => {
      if (success) processed++;
      else failed++;
    });

    // Delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < assets.length) {
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES));
    }
  }

  console.log(`Completed: ${processed} processed, ${failed} failed`);

  return new Response(JSON.stringify({ 
    success: true, 
    processed, 
    failed,
    total: assets.length 
  }), {
    headers: corsHeaders,
  });
});
