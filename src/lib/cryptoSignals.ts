// Quantitative crypto signals library
import { fetchCandles, Candle } from './binanceApi';
import { ema, rsi, bollingerBands } from './indicators';

// ============================================
// 1) ETH Upside Probability (0-100)
// ============================================

export interface EthUpsideData {
  score: number; // 0-100
  ethbtcPrice: number;
  ema50: number;
  ema200: number;
  bbWidth: number;
  rsi: number;
  rsiRising: boolean;
  factors: {
    aboveEma50: boolean;
    aboveEma200: boolean;
    compressed: boolean;
    rsiRising: boolean;
  };
}

export async function getEthUpsideScore(): Promise<EthUpsideData> {
  // Fetch ETHBTC daily candles
  const candles = await fetchCandles('ETHBTC', '1d', 200);
  const closes = candles.map(c => c.close);
  
  if (closes.length < 200) {
    throw new Error('Insufficient data for ETH upside calculation');
  }

  const currentPrice = closes[closes.length - 1];
  
  // Calculate EMA50 and EMA200
  const ema50Values = ema(closes, 50);
  const ema200Values = ema(closes, 200);
  const ema50 = ema50Values[ema50Values.length - 1];
  const ema200 = ema200Values[ema200Values.length - 1];
  
  // Calculate Bollinger Bands Width
  const bb = bollingerBands(closes.slice(-20), 20, 2);
  const lastBB = bb[bb.length - 1];
  const bbWidth = (lastBB.upper - lastBB.lower) / lastBB.middle;
  
  // Calculate RSI
  const rsiValues = rsi(closes, 14);
  const currentRSI = rsiValues[rsiValues.length - 1];
  const previousRSI = rsiValues[rsiValues.length - 6]; // 5 days ago
  const isRsiRising = currentRSI > previousRSI;
  
  // Scoring system
  let score = 0;
  const aboveEma50 = currentPrice > ema50;
  const aboveEma200 = currentPrice > ema200;
  const compressed = bbWidth < 0.10;
  
  if (aboveEma50) score += 30;
  if (aboveEma200) score += 30;
  if (compressed) score += 20;
  if (isRsiRising) score += 20;
  
  return {
    score,
    ethbtcPrice: currentPrice,
    ema50,
    ema200,
    bbWidth,
    rsi: currentRSI,
    rsiRising: isRsiRising,
    factors: {
      aboveEma50,
      aboveEma200,
      compressed,
      rsiRising: isRsiRising
    }
  };
}

// ============================================
// 2) Altseason Index Improved (0-100)
// ============================================

export interface AltseasonIndexData {
  index: number; // 0-100
  altsOutperforming: number;
  totalAlts: number;
  percentOutperforming: number;
  ethbtcTrend: 'Bullish' | 'Neutral' | 'Bearish';
  btcDominanceTrend: 'Neutral'; // Currently always neutral as we don't have real dominance data
}

const TOP_ALTS = [
  'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'XRPUSDT', 'DOTUSDT',
  'AVAXUSDT', 'MATICUSDT', 'LINKUSDT', 'ATOMUSDT', 'LTCUSDT',
  'UNIUSDT', 'XLMUSDT', 'ETCUSDT', 'FILUSDT', 'TRXUSDT'
];

export async function getAltseasonIndex(lookbackDays: number = 30): Promise<AltseasonIndexData> {
  const limit = Math.ceil(lookbackDays * 1.5); // Buffer for daily data
  
  // Fetch BTC performance
  const btcCandles = await fetchCandles('BTCUSDT', '1d', limit);
  const btcStart = btcCandles[btcCandles.length - lookbackDays].close;
  const btcEnd = btcCandles[btcCandles.length - 1].close;
  const btcReturn = ((btcEnd - btcStart) / btcStart) * 100;
  
  // Fetch ETHBTC for trend
  const ethbtcCandles = await fetchCandles('ETHBTC', '1d', limit);
  const ethbtcCloses = ethbtcCandles.map(c => c.close);
  const ethbtcEma20 = ema(ethbtcCloses, 20);
  const ethbtcPrice = ethbtcCloses[ethbtcCloses.length - 1];
  const ethbtcEma = ethbtcEma20[ethbtcEma20.length - 1];
  
  let ethbtcTrend: 'Bullish' | 'Neutral' | 'Bearish' = 'Neutral';
  if (ethbtcPrice > ethbtcEma * 1.02) ethbtcTrend = 'Bullish';
  else if (ethbtcPrice < ethbtcEma * 0.98) ethbtcTrend = 'Bearish';
  
  // Mock BTC Dominance (since we don't have a direct source)
  // In production, you'd fetch this from CoinGecko API or similar
  const btcDominanceTrend: 'Neutral' = 'Neutral';
  
  // Calculate altcoin performance
  let altsOutperforming = 0;
  const altPromises = TOP_ALTS.map(async (symbol) => {
    try {
      const candles = await fetchCandles(symbol, '1d', limit);
      const start = candles[candles.length - lookbackDays].close;
      const end = candles[candles.length - 1].close;
      const altReturn = ((end - start) / start) * 100;
      return altReturn > btcReturn;
    } catch (error) {
      console.warn(`Failed to fetch ${symbol}:`, error);
      return false;
    }
  });
  
  const results = await Promise.all(altPromises);
  altsOutperforming = results.filter(Boolean).length;
  
  const percentOutperforming = (altsOutperforming / TOP_ALTS.length) * 100;
  
  // Calculate index (simplified since dominance is always neutral)
  const index = Math.round(
    0.65 * percentOutperforming +
    0.35 * (ethbtcTrend === 'Bullish' ? 100 : ethbtcTrend === 'Bearish' ? 0 : 50)
  );
  
  return {
    index: Math.min(100, Math.max(0, index)),
    altsOutperforming,
    totalAlts: TOP_ALTS.length,
    percentOutperforming: Math.round(percentOutperforming),
    ethbtcTrend,
    btcDominanceTrend
  };
}

// ============================================
// 3) BTC Dominance Panel
// ============================================

export interface DominanceData {
  dominance: number; // Current BTC dominance %
  change7d: number; // Change in last 7 days
  dominanceRSI: number; // RSI of dominance series
  state: 'Risk-On' | 'Neutral' | 'Risk-Off';
}

export async function getDominanceData(): Promise<DominanceData> {
  // Since we don't have direct dominance data, we'll calculate a proxy
  // using BTC market cap vs total crypto market cap estimation
  
  // Fetch BTC price for trend
  const btcCandles = await fetchCandles('BTCUSDT', '1d', 60);
  const btcCloses = btcCandles.map(c => c.close);
  
  // Fetch ETH price for market proxy
  const ethCandles = await fetchCandles('ETHUSDT', '1d', 60);
  const ethCloses = ethCandles.map(c => c.close);
  
  // Calculate a dominance proxy based on BTC vs ETH price ratio
  const dominanceSeries: number[] = [];
  for (let i = 0; i < Math.min(btcCloses.length, ethCloses.length); i++) {
    // Normalized dominance proxy (0-100)
    const ratio = btcCloses[i] / (btcCloses[i] + ethCloses[i] * 0.15); // Weight adjustment
    dominanceSeries.push(ratio * 100);
  }
  
  const currentDominance = dominanceSeries[dominanceSeries.length - 1];
  const dominance7dAgo = dominanceSeries[dominanceSeries.length - 8];
  const change7d = currentDominance - dominance7dAgo;
  
  // Calculate RSI of dominance
  const dominanceRSI_values = rsi(dominanceSeries, 14);
  const dominanceRSI = dominanceRSI_values[dominanceRSI_values.length - 1];
  
  // Determine state
  let state: 'Risk-On' | 'Neutral' | 'Risk-Off' = 'Neutral';
  if (change7d > 0 && dominanceRSI > 50) {
    state = 'Risk-Off'; // BTC dominating
  } else if (change7d < 0 && dominanceRSI < 50) {
    state = 'Risk-On'; // Alts/ETH gaining
  }
  
  return {
    dominance: currentDominance,
    change7d,
    dominanceRSI,
    state
  };
}
