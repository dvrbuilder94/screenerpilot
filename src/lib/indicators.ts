// Technical indicators calculation library

export interface OHLC {
  open: number;
  high: number;
  low: number;
  close: number;
}

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function ema(data: number[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);
  
  if (data.length < period) return [];
  
  // First EMA is SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  result.push(sum / period);
  
  // Calculate EMA for remaining values
  for (let i = period; i < data.length; i++) {
    const emaValue = (data[i] - result[result.length - 1]) * multiplier + result[result.length - 1];
    result.push(emaValue);
  }
  
  return result;
}

/**
 * Calculate Relative Strength Index (RSI)
 */
export function rsi(closes: number[], period: number = 14): number[] {
  if (closes.length < period + 1) return [];
  
  const result: number[] = [];
  const changes: number[] = [];
  
  // Calculate price changes
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }
  
  // Calculate first RSI using SMA
  let avgGain = 0;
  let avgLoss = 0;
  
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }
  
  avgGain /= period;
  avgLoss /= period;
  
  if (avgLoss === 0) {
    result.push(100);
  } else {
    const rs = avgGain / avgLoss;
    result.push(100 - (100 / (1 + rs)));
  }
  
  // Calculate remaining RSI values using smoothed averages
  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    
    if (avgLoss === 0) {
      result.push(100);
    } else {
      const rs = avgGain / avgLoss;
      result.push(100 - (100 / (1 + rs)));
    }
  }
  
  return result;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function macd(
  closes: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macd: number[]; signal: number[]; histogram: number[] } {
  const fastEMA = ema(closes, fastPeriod);
  const slowEMA = ema(closes, slowPeriod);
  
  const macdLine: number[] = [];
  const offset = slowPeriod - fastPeriod;
  
  for (let i = 0; i < fastEMA.length - offset; i++) {
    macdLine.push(fastEMA[i + offset] - slowEMA[i]);
  }
  
  const signalLine = ema(macdLine, signalPeriod);
  const histogram: number[] = [];
  
  for (let i = 0; i < signalLine.length; i++) {
    histogram.push(macdLine[i + (macdLine.length - signalLine.length)] - signalLine[i]);
  }
  
  return {
    macd: macdLine,
    signal: signalLine,
    histogram,
  };
}

/**
 * Calculate Bollinger Bands
 */
export interface BollingerBand {
  upper: number;
  middle: number;
  lower: number;
}

export function bollingerBands(
  closes: number[],
  period: number = 20,
  multiplier: number = 2
): BollingerBand[] {
  if (closes.length < period) return [];
  
  const result: BollingerBand[] = [];
  
  for (let i = period - 1; i < closes.length; i++) {
    // Calculate SMA (middle band)
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += closes[i - j];
    }
    const middle = sum / period;
    
    // Calculate standard deviation
    let variance = 0;
    for (let j = 0; j < period; j++) {
      variance += Math.pow(closes[i - j] - middle, 2);
    }
    const stdDev = Math.sqrt(variance / period);
    
    // Calculate upper and lower bands
    const upper = middle + multiplier * stdDev;
    const lower = middle - multiplier * stdDev;
    
    result.push({ upper, middle, lower });
  }
  
  return result;
}

/**
 * Calculate Average True Range (ATR)
 */
export function atr(ohlc: OHLC[], period: number = 14): number[] {
  if (ohlc.length < period + 1) return [];
  
  const trueRanges: number[] = [];
  
  for (let i = 1; i < ohlc.length; i++) {
    const high = ohlc[i].high;
    const low = ohlc[i].low;
    const prevClose = ohlc[i - 1].close;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    
    trueRanges.push(tr);
  }
  
  const result: number[] = [];
  
  // First ATR is SMA of TR
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += trueRanges[i];
  }
  result.push(sum / period);
  
  // Remaining ATRs use smoothing
  for (let i = period; i < trueRanges.length; i++) {
    const atrValue = (result[result.length - 1] * (period - 1) + trueRanges[i]) / period;
    result.push(atrValue);
  }
  
  return result;
}

/**
 * Calculate Supertrend
 */
export function supertrend(
  ohlc: OHLC[],
  period: number = 10,
  multiplier: number = 3
): { trend: boolean[]; value: number[] } {
  const atrValues = atr(ohlc, period);
  const trend: boolean[] = [];
  const value: number[] = [];
  
  if (atrValues.length === 0) return { trend: [], value: [] };
  
  const offset = ohlc.length - atrValues.length;
  
  for (let i = 0; i < atrValues.length; i++) {
    const idx = i + offset;
    const hl2 = (ohlc[idx].high + ohlc[idx].low) / 2;
    const atrValue = atrValues[i];
    
    const upperBand = hl2 + multiplier * atrValue;
    const lowerBand = hl2 - multiplier * atrValue;
    
    if (i === 0) {
      trend.push(true);
      value.push(lowerBand);
    } else {
      const prevTrend = trend[i - 1];
      const close = ohlc[idx].close;
      
      if (prevTrend) {
        // Was in uptrend
        if (close <= lowerBand) {
          trend.push(false);
          value.push(upperBand);
        } else {
          trend.push(true);
          value.push(Math.max(lowerBand, value[i - 1]));
        }
      } else {
        // Was in downtrend
        if (close >= upperBand) {
          trend.push(true);
          value.push(lowerBand);
        } else {
          trend.push(false);
          value.push(Math.min(upperBand, value[i - 1]));
        }
      }
    }
  }
  
  return { trend, value };
}

/**
 * Calculate signal score based on indicators
 */
export interface IndicatorData {
  ema20: number[];
  ema50: number[];
  rsi: number[];
  macd: { macd: number[]; signal: number[]; histogram: number[] };
  atr: number[];
  supertrend: { trend: boolean[]; value: number[] };
}

export function calculateScore(indicators: IndicatorData): number {
  let score = 0;
  
  const lastIdx = indicators.ema20.length - 1;
  const ema20 = indicators.ema20[lastIdx];
  const ema50 = indicators.ema50[lastIdx];
  
  // EMA trend
  if (ema20 > ema50) score += 2;
  else if (ema20 < ema50) score -= 2;
  
  // RSI momentum
  const rsiValue = indicators.rsi[indicators.rsi.length - 1];
  if (rsiValue < 40) score += 1;
  else if (rsiValue > 60) score -= 1;
  
  // MACD
  const macdIdx = indicators.macd.macd.length - 1;
  const macdValue = indicators.macd.macd[macdIdx];
  const signalValue = indicators.macd.signal[macdIdx];
  if (macdValue > signalValue) score += 1;
  else score -= 1;
  
  // Supertrend
  const stIdx = indicators.supertrend.trend.length - 1;
  if (indicators.supertrend.trend[stIdx]) score += 1;
  else score -= 1;
  
  return score;
}

export type Signal = 'BULLISH' | 'BEARISH' | 'NEUTRAL_BIAS';

export function getSignal(score: number): Signal {
  if (score >= 3) return 'BULLISH';
  if (score <= -3) return 'BEARISH';
  return 'NEUTRAL_BIAS';
}
