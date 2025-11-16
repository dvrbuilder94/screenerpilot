// Crypto Metrics Library - Corrected Technical Analysis Formulas
import { fetchCandles, Candle } from './binanceApi';

// ============================================
// Technical Indicator Helpers (Corrected)
// ============================================

/**
 * Calculate EMA using correct formula
 * EMA_today = Price_today * (2/(n+1)) + EMA_yesterday * (1 - (2/(n+1)))
 */
function calculateEMA(prices: number[], period: number): number[] {
  if (prices.length < period) return [];
  
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  
  // First EMA is SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  ema[period - 1] = sum / period;
  
  // Calculate rest using EMA formula
  for (let i = period; i < prices.length; i++) {
    ema[i] = prices[i] * multiplier + ema[i - 1] * (1 - multiplier);
  }
  
  return ema;
}

/**
 * Calculate SMA (Simple Moving Average)
 */
function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = period - 1; i < prices.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += prices[i - j];
    }
    sma[i] = sum / period;
  }
  return sma;
}

/**
 * Calculate standard deviation
 */
function calculateStdDev(prices: number[], period: number, index: number): number {
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[index - i];
  }
  const mean = sum / period;
  
  let variance = 0;
  for (let i = 0; i < period; i++) {
    variance += Math.pow(prices[index - i] - mean, 2);
  }
  return Math.sqrt(variance / period);
}

/**
 * Calculate Bollinger Band Width
 * BBWidth = (Upper - Lower) / Middle
 * Upper = SMA20 + (stddev20 * 2)
 * Lower = SMA20 - (stddev20 * 2)
 */
function calculateBBWidth(prices: number[], period: number = 20): number {
  if (prices.length < period) return 0;
  
  const sma = calculateSMA(prices, period);
  const lastIndex = prices.length - 1;
  const middle = sma[lastIndex];
  const stdDev = calculateStdDev(prices, period, lastIndex);
  
  const upper = middle + (stdDev * 2);
  const lower = middle - (stdDev * 2);
  
  return (upper - lower) / middle;
}

/**
 * Calculate RSI using Wilder's smoothing method
 * RSI = 100 - (100 / (1 + RS))
 * RS = Average Gain / Average Loss (smoothed)
 */
function calculateRSI(prices: number[], period: number = 14): number[] {
  if (prices.length < period + 1) return [];
  
  const rsi: number[] = [];
  let avgGain = 0;
  let avgLoss = 0;
  
  // Calculate initial average gain and loss
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      avgGain += change;
    } else {
      avgLoss += Math.abs(change);
    }
  }
  avgGain /= period;
  avgLoss /= period;
  
  // Calculate first RSI
  const rs = avgGain / avgLoss;
  rsi[period] = 100 - (100 / (1 + rs));
  
  // Calculate subsequent RSI values using Wilder's smoothing
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    
    const currentRS = avgGain / avgLoss;
    rsi[i] = 100 - (100 / (1 + currentRS));
  }
  
  return rsi;
}

/**
 * Calculate 7-day slope
 */
function calculate7DaySlope(prices: number[]): number {
  if (prices.length < 8) return 0;
  const current = prices[prices.length - 1];
  const past = prices[prices.length - 8];
  return (current - past) / 7;
}

// ============================================
// 1) ETH Upside Probability (0-100)
// ============================================

export interface EthUpsideData {
  score: number;
  ethbtcPrice: number;
  ema50: number;
  ema200: number;
  bbWidth: number;
  rsi: number;
  slope7d: number;
  emaTrend: 'Bullish' | 'Neutral' | 'Bearish';
  volatilityState: 'Normal' | 'Compressed';
  rsiState: 'Rising' | 'Falling';
  slopeSign: 'Positive' | 'Negative';
  factors: {
    aboveEma50: boolean;
    aboveEma200: boolean;
    compressed: boolean;
    rsiRising: boolean;
    positiveSlope: boolean;
  };
}

export async function getEthUpsideScore(): Promise<EthUpsideData> {
  const candles = await fetchCandles('ETHBTC', '1d', 210);
  const closes = candles.map(c => c.close);
  
  if (closes.length < 200) {
    throw new Error('Insufficient data for ETH upside calculation');
  }

  const currentPrice = closes[closes.length - 1];
  
  // Calculate EMAs
  const ema50Values = calculateEMA(closes, 50);
  const ema200Values = calculateEMA(closes, 200);
  const ema50 = ema50Values[ema50Values.length - 1];
  const ema200 = ema200Values[ema200Values.length - 1];
  
  // Calculate BB Width
  const bbWidth = calculateBBWidth(closes, 20);
  
  // Calculate RSI
  const rsiValues = calculateRSI(closes, 14);
  const currentRSI = rsiValues[rsiValues.length - 1];
  const rsi3DaysAgo = rsiValues[rsiValues.length - 4];
  const isRsiRising = currentRSI > rsi3DaysAgo;
  
  // Calculate 7-day slope
  const slope7d = calculate7DaySlope(closes);
  
  // Scoring system (0-100)
  let score = 0;
  const aboveEma50 = currentPrice > ema50;
  const aboveEma200 = currentPrice > ema200;
  const compressed = bbWidth < 0.10;
  const positiveSlope = slope7d > 0;
  
  if (aboveEma50) score += 25;
  if (aboveEma200) score += 25;
  if (compressed) score += 20;
  if (isRsiRising) score += 20;
  if (positiveSlope) score += 10;
  
  // Determine states
  let emaTrend: 'Bullish' | 'Neutral' | 'Bearish' = 'Neutral';
  if (currentPrice > ema50 && currentPrice > ema200) emaTrend = 'Bullish';
  else if (currentPrice < ema50 && currentPrice < ema200) emaTrend = 'Bearish';
  
  const volatilityState: 'Normal' | 'Compressed' = compressed ? 'Compressed' : 'Normal';
  const rsiState: 'Rising' | 'Falling' = isRsiRising ? 'Rising' : 'Falling';
  const slopeSign: 'Positive' | 'Negative' = positiveSlope ? 'Positive' : 'Negative';
  
  return {
    score,
    ethbtcPrice: currentPrice,
    ema50,
    ema200,
    bbWidth,
    rsi: currentRSI,
    slope7d,
    emaTrend,
    volatilityState,
    rsiState,
    slopeSign,
    factors: {
      aboveEma50,
      aboveEma200,
      compressed,
      rsiRising: isRsiRising,
      positiveSlope
    }
  };
}

// ============================================
// 2) Enhanced Altseason Index (0-100)
// ============================================

export interface AltseasonIndexData {
  index: number;
  altsOutperforming: number;
  totalAlts: number;
  percentOutperforming: number;
  ethbtcTrend: 'Bullish' | 'Neutral' | 'Bearish';
  dominanceArrow: '↑' | '↓' | '→';
}

const TOP_ALTS = [
  'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'XRPUSDT', 'DOTUSDT',
  'AVAXUSDT', 'MATICUSDT', 'LINKUSDT', 'ATOMUSDT', 'LTCUSDT',
  'UNIUSDT', 'XLMUSDT', 'ETCUSDT', 'FILUSDT', 'TRXUSDT',
  'NEARUSDT', 'ALGOUSDT', 'VETUSDT', 'ICPUSDT', 'APTUSDT'
];

export async function getAltseasonIndex(lookbackDays: number = 30): Promise<AltseasonIndexData> {
  const limit = Math.max(lookbackDays + 60, 100);
  
  // Fetch BTC performance
  const btcCandles = await fetchCandles('BTCUSDT', '1d', limit);
  if (btcCandles.length < lookbackDays + 1) {
    throw new Error('Insufficient BTC data');
  }
  const btcStart = btcCandles[btcCandles.length - lookbackDays - 1].close;
  const btcEnd = btcCandles[btcCandles.length - 1].close;
  const btcPerformance = (btcEnd - btcStart) / btcStart;
  
  // Calculate alt performances
  let outperforming = 0;
  let totalAlts = 0;
  
  for (const alt of TOP_ALTS) {
    try {
      const altCandles = await fetchCandles(alt, '1d', limit);
      if (altCandles.length < lookbackDays + 1) continue;
      
      const altStart = altCandles[altCandles.length - lookbackDays - 1].close;
      const altEnd = altCandles[altCandles.length - 1].close;
      const altPerformance = (altEnd - altStart) / altStart;
      
      totalAlts++;
      if (altPerformance > btcPerformance) {
        outperforming++;
      }
    } catch (e) {
      console.warn(`Failed to fetch ${alt}:`, e);
    }
  }
  
  const percentOutperforming = totalAlts > 0 ? (outperforming / totalAlts) * 100 : 0;
  
  // Fetch ETHBTC trend
  const ethbtcCandles = await fetchCandles('ETHBTC', '1d', limit);
  const ethbtcCloses = ethbtcCandles.map(c => c.close);
  const ethbtcEma50 = calculateEMA(ethbtcCloses, 50);
  const ethbtcPrice = ethbtcCloses[ethbtcCloses.length - 1];
  const ethbtcEma = ethbtcEma50[ethbtcEma50.length - 1];
  
  let ethbtcTrend: 'Bullish' | 'Neutral' | 'Bearish' = 'Neutral';
  if (ethbtcPrice > ethbtcEma) ethbtcTrend = 'Bullish';
  else if (ethbtcPrice < ethbtcEma * 0.98) ethbtcTrend = 'Bearish';
  
  // Mock BTC dominance delta (using BTC performance as proxy)
  const dominanceDelta = -btcPerformance * 10; // Inverse relationship approximation
  const dominanceArrow: '↑' | '↓' | '→' = dominanceDelta > 0.1 ? '↑' : dominanceDelta < -0.1 ? '↓' : '→';
  
  // Calculate index (0-100)
  let index = percentOutperforming * 0.5;
  if (ethbtcTrend === 'Bullish') index += 30;
  if (dominanceDelta < 0) index += 20;
  
  index = Math.max(0, Math.min(100, Math.round(index)));
  
  return {
    index,
    altsOutperforming: outperforming,
    totalAlts,
    percentOutperforming: Math.round(percentOutperforming),
    ethbtcTrend,
    dominanceArrow
  };
}

// ============================================
// 3) BTC Dominance Panel (0-100)
// ============================================

export interface DominanceData {
  dominance: number;
  change7d: number;
  rsi: number;
  regime: 'Risk-On' | 'Neutral' | 'Risk-Off';
}

export async function getDominanceData(): Promise<DominanceData> {
  // Using BTC market cap proxy calculation
  const btcCandles = await fetchCandles('BTCUSDT', '1d', 100);
  const ethCandles = await fetchCandles('ETHUSDT', '1d', 100);
  
  // Simple dominance proxy: BTC/(BTC+ETH) * 100
  // This is a simplified version - real dominance would need total market cap
  const btcPrice = btcCandles[btcCandles.length - 1].close;
  const ethPrice = ethCandles[ethCandles.length - 1].close;
  const btcVolume = btcCandles[btcCandles.length - 1].volume;
  const ethVolume = ethCandles[ethCandles.length - 1].volume;
  
  const btcMarketWeight = btcPrice * btcVolume;
  const ethMarketWeight = ethPrice * ethVolume;
  const currentDominance = (btcMarketWeight / (btcMarketWeight + ethMarketWeight * 20)) * 100; // ETH weighted
  
  // Calculate 7 days ago
  const btcPrice7d = btcCandles[btcCandles.length - 8].close;
  const ethPrice7d = ethCandles[ethCandles.length - 8].close;
  const btcVolume7d = btcCandles[btcCandles.length - 8].volume;
  const ethVolume7d = ethCandles[ethCandles.length - 8].volume;
  
  const btcMarketWeight7d = btcPrice7d * btcVolume7d;
  const ethMarketWeight7d = ethPrice7d * ethVolume7d;
  const dominance7d = (btcMarketWeight7d / (btcMarketWeight7d + ethMarketWeight7d * 20)) * 100;
  
  const change7d = currentDominance - dominance7d;
  
  // Create dominance time series for RSI
  const dominanceSeries: number[] = [];
  for (let i = 0; i < btcCandles.length; i++) {
    const btcW = btcCandles[i].close * btcCandles[i].volume;
    const ethW = ethCandles[i].close * ethCandles[i].volume;
    dominanceSeries.push((btcW / (btcW + ethW * 20)) * 100);
  }
  
  // Calculate RSI on dominance
  const rsiValues = calculateRSI(dominanceSeries, 14);
  const rsi = rsiValues[rsiValues.length - 1];
  
  // Determine regime
  let regime: 'Risk-On' | 'Neutral' | 'Risk-Off' = 'Neutral';
  if (change7d > 0 && rsi > 55) {
    regime = 'Risk-Off';
  } else if (change7d < 0 && rsi < 45) {
    regime = 'Risk-On';
  }
  
  return {
    dominance: currentDominance,
    change7d,
    rsi,
    regime
  };
}

// ============================================
// 4) Fear & Greed Index
// ============================================

export interface FearGreedData {
  value: number;
  category: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  updatedAt: Date;
}

export async function getFearGreedIndex(): Promise<FearGreedData> {
  // Mock implementation - in production, use Alternative.me API or similar
  // For now, derive from market conditions
  const ethUpside = await getEthUpsideScore();
  const altseason = await getAltseasonIndex();
  const dominance = await getDominanceData();
  
  // Simple formula combining metrics
  let value = 50; // Start neutral
  
  // Adjust based on upside score
  value += (ethUpside.score - 50) * 0.3;
  
  // Adjust based on altseason
  value += (altseason.index - 50) * 0.2;
  
  // Adjust based on dominance regime
  if (dominance.regime === 'Risk-On') value += 15;
  if (dominance.regime === 'Risk-Off') value -= 15;
  
  value = Math.max(0, Math.min(100, Math.round(value)));
  
  // Determine category
  let category: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  if (value <= 25) category = 'Extreme Fear';
  else if (value <= 44) category = 'Fear';
  else if (value <= 54) category = 'Neutral';
  else if (value <= 74) category = 'Greed';
  else category = 'Extreme Greed';
  
  return {
    value,
    category,
    updatedAt: new Date()
  };
}
