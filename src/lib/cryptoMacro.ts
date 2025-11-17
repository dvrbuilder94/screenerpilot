import { fetchCandles, Candle, Symbol } from './binanceApi';

// Top altcoins for the altseason index
export const TOP_ALTS: Symbol[] = [
  'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'XRPUSDT',
  'DOTUSDT', 'DOGEUSDT', 'AVAXUSDT', 'MATICUSDT', 'LINKUSDT',
  'ATOMUSDT', 'LTCUSDT', 'NEARUSDT', 'APTUSDT', 'ARBUSDT',
  'OPUSDT', 'INJUSDT', 'SUIUSDT', 'FILUSDT', 'RNDRUSDT'
];

export interface AltseasonData {
  value: number; // 0-100
  altsOutperformingPercent: number;
  lookbackDays: number;
  totalAlts: number;
  altsOutperforming: number;
}

export interface AssetMetrics {
  symbol: string;
  returns: number; // % return
  volatility: number; // std dev of daily returns
  maxDrawdown: number; // max drawdown %
  riskReward: number; // returns / volatility
  currentPrice: number;
}

export interface EthVsBtcData {
  btc: AssetMetrics;
  eth: AssetMetrics;
  winner: 'BTC' | 'ETH' | 'NEUTRAL';
  conclusion: string;
}

export type RiskState = 'risk_on' | 'neutral' | 'risk_off';

export interface CryptoRiskData {
  state: RiskState;
  reasons: string[];
  btcDominance?: number;
  altsAvgReturn7d: number;
}

/**
 * Calculates percentage return between two prices
 */
function calculateReturn(startPrice: number, endPrice: number): number {
  return ((endPrice - startPrice) / startPrice) * 100;
}

/**
 * Calculates standard deviation of daily returns
 */
function calculateVolatility(candles: Candle[]): number {
  if (candles.length < 2) return 0;
  
  const dailyReturns = [];
  for (let i = 1; i < candles.length; i++) {
    const ret = (candles[i].close - candles[i - 1].close) / candles[i - 1].close;
    dailyReturns.push(ret);
  }
  
  const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / dailyReturns.length;
  
  return Math.sqrt(variance) * 100; // in %
}

/**
 * Calculates maximum drawdown
 */
function calculateMaxDrawdown(candles: Candle[]): number {
  let maxPrice = candles[0].close;
  let maxDD = 0;
  
  for (const candle of candles) {
    if (candle.close > maxPrice) {
      maxPrice = candle.close;
    }
    const dd = ((candle.close - maxPrice) / maxPrice) * 100;
    if (dd < maxDD) {
      maxDD = dd;
    }
  }
  
  return maxDD;
}

/**
 * Calculates asset metrics
 */
async function calculateAssetMetrics(symbol: Symbol, lookbackDays: number = 90): Promise<AssetMetrics> {
  const candles = await fetchCandles(symbol, '1d', lookbackDays);
  
  if (candles.length < 2) {
    throw new Error(`Not enough data for ${symbol}`);
  }
  
  const startPrice = candles[0].close;
  const endPrice = candles[candles.length - 1].close;
  const returns = calculateReturn(startPrice, endPrice);
  const volatility = calculateVolatility(candles);
  const maxDrawdown = calculateMaxDrawdown(candles);
  const riskReward = volatility > 0 ? returns / volatility : 0;
  
  return {
    symbol,
    returns,
    volatility,
    maxDrawdown,
    riskReward,
    currentPrice: endPrice
  };
}

/**
 * Calculates Altseason Index (0-100)
 */
export async function calculateAltseasonIndex(lookbackDays: number = 90): Promise<AltseasonData> {
  try {
    // Get BTC return
    const btcCandles = await fetchCandles('BTCUSDT', '1d', lookbackDays);
    const btcReturn = calculateReturn(btcCandles[0].close, btcCandles[btcCandles.length - 1].close);
    
    // Calculate alt returns
    const altReturns = await Promise.allSettled(
      TOP_ALTS.map(async (symbol) => {
        try {
          const candles = await fetchCandles(symbol, '1d', lookbackDays);
          const altReturn = calculateReturn(candles[0].close, candles[candles.length - 1].close);
          return { symbol, return: altReturn, outperforms: altReturn > btcReturn };
        } catch {
          return null;
        }
      })
    );
    
    // Filter successful results
    const validResults = altReturns
      .filter((result): result is PromiseFulfilledResult<{ symbol: Symbol; return: number; outperforms: boolean } | null> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value!);
    
    const altsOutperforming = validResults.filter(r => r.outperforms).length;
    const totalAlts = validResults.length;
    const altsOutperformingPercent = totalAlts > 0 ? (altsOutperforming / totalAlts) * 100 : 0;
    
    // Convert to 0-100 index
    const value = Math.round(altsOutperformingPercent);
    
    return {
      value,
      altsOutperformingPercent,
      lookbackDays,
      totalAlts,
      altsOutperforming
    };
  } catch (error) {
    console.error('Error calculating Altseason Index:', error);
    throw error;
  }
}

/**
 * Compares ETH vs BTC in terms of Risk/Reward
 */
export async function calculateEthVsBtc(): Promise<EthVsBtcData> {
  try {
    const [btcMetrics, ethMetrics] = await Promise.all([
      calculateAssetMetrics('BTCUSDT', 90),
      calculateAssetMetrics('ETHUSDT', 90)
    ]);
    
    let winner: 'BTC' | 'ETH' | 'NEUTRAL' = 'NEUTRAL';
    let conclusion = '';
    
    if (Math.abs(btcMetrics.riskReward - ethMetrics.riskReward) < 0.1) {
      winner = 'NEUTRAL';
      conclusion = 'BTC and ETH have similar risk/return profiles over 90 days.';
    } else if (ethMetrics.riskReward > btcMetrics.riskReward) {
      winner = 'ETH';
      conclusion = `ETH has better risk/reward profile (${ethMetrics.riskReward.toFixed(2)} vs ${btcMetrics.riskReward.toFixed(2)}), although with ${Math.abs(ethMetrics.maxDrawdown).toFixed(1)}% max drawdown.`;
    } else {
      winner = 'BTC';
      conclusion = `BTC offers better risk/reward profile (${btcMetrics.riskReward.toFixed(2)} vs ${ethMetrics.riskReward.toFixed(2)}) over the last 90 days.`;
    }
    
    return {
      btc: btcMetrics,
      eth: ethMetrics,
      winner,
      conclusion
    };
  } catch (error) {
    console.error('Error calculating ETH vs BTC:', error);
    throw error;
  }
}

/**
 * Calculates the Risk-On / Risk-Off state of the crypto market
 */
export async function calculateCryptoRisk(): Promise<CryptoRiskData> {
  try {
    // Calculate average alt return over last 7 days
    const altReturns7d = await Promise.allSettled(
      TOP_ALTS.slice(0, 10).map(async (symbol) => {
        try {
          const candles = await fetchCandles(symbol, '1d', 7);
          return calculateReturn(candles[0].close, candles[candles.length - 1].close);
        } catch {
          return null;
        }
      })
    );
    
    const validReturns = altReturns7d
      .filter((result): result is PromiseFulfilledResult<number | null> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value!);
    
    const altsAvgReturn7d = validReturns.length > 0
      ? validReturns.reduce((a, b) => a + b, 0) / validReturns.length
      : 0;
    
    // Get BTC return over last 7 days
    const btcCandles = await fetchCandles('BTCUSDT', '1d', 7);
    const btcReturn7d = calculateReturn(btcCandles[0].close, btcCandles[btcCandles.length - 1].close);
    
    // Determine state
    let state: RiskState = 'neutral';
    const reasons: string[] = [];
    
    if (altsAvgReturn7d > 5 && altsAvgReturn7d > btcReturn7d) {
      state = 'risk_on';
      reasons.push(`Alts averaging +${altsAvgReturn7d.toFixed(1)}% over 7 days`);
      reasons.push('Capital flowing into altcoins');
      reasons.push('Risk-on sentiment prevailing');
    } else if (altsAvgReturn7d < -5 || (btcReturn7d > 2 && altsAvgReturn7d < 0)) {
      state = 'risk_off';
      reasons.push('Alts under bearish pressure');
      reasons.push('Capital seeking refuge in BTC');
      reasons.push('Market in defensive mode');
    } else {
      state = 'neutral';
      reasons.push('Sideways market movements');
      reasons.push('No clear risk trend');
      reasons.push('Awaiting directional confirmation');
    }
    
    return {
      state,
      reasons,
      altsAvgReturn7d
    };
  } catch (error) {
    console.error('Error calculating Crypto Risk:', error);
    throw error;
  }
}
