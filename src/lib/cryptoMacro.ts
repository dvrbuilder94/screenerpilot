import { fetchCandles, Candle, Symbol } from './binanceApi';

// Top altcoins para el índice de altseason
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
 * Calcula el rendimiento porcentual entre dos precios
 */
function calculateReturn(startPrice: number, endPrice: number): number {
  return ((endPrice - startPrice) / startPrice) * 100;
}

/**
 * Calcula la desviación estándar de retornos diarios
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
  
  return Math.sqrt(variance) * 100; // en %
}

/**
 * Calcula el máximo drawdown
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
 * Calcula métricas de un activo
 */
async function calculateAssetMetrics(symbol: Symbol, lookbackDays: number = 90): Promise<AssetMetrics> {
  const candles = await fetchCandles(symbol, '1d', lookbackDays);
  
  if (candles.length < 2) {
    throw new Error(`No hay suficientes datos para ${symbol}`);
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
 * Calcula el índice de Altseason (0-100)
 */
export async function calculateAltseasonIndex(lookbackDays: number = 90): Promise<AltseasonData> {
  try {
    // Obtener rendimiento de BTC
    const btcCandles = await fetchCandles('BTCUSDT', '1d', lookbackDays);
    const btcReturn = calculateReturn(btcCandles[0].close, btcCandles[btcCandles.length - 1].close);
    
    // Calcular rendimientos de alts
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
    
    // Filtrar resultados exitosos
    const validResults = altReturns
      .filter((result): result is PromiseFulfilledResult<{ symbol: Symbol; return: number; outperforms: boolean } | null> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value!);
    
    const altsOutperforming = validResults.filter(r => r.outperforms).length;
    const totalAlts = validResults.length;
    const altsOutperformingPercent = totalAlts > 0 ? (altsOutperforming / totalAlts) * 100 : 0;
    
    // Convertir a índice 0-100
    const value = Math.round(altsOutperformingPercent);
    
    return {
      value,
      altsOutperformingPercent,
      lookbackDays,
      totalAlts,
      altsOutperforming
    };
  } catch (error) {
    console.error('Error calculando Altseason Index:', error);
    throw error;
  }
}

/**
 * Compara ETH vs BTC en términos de Risk/Reward
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
      conclusion = 'BTC y ETH tienen perfiles de riesgo/retorno similares en 90 días.';
    } else if (ethMetrics.riskReward > btcMetrics.riskReward) {
      winner = 'ETH';
      conclusion = `ETH tiene mejor perfil riesgo/retorno (${ethMetrics.riskReward.toFixed(2)} vs ${btcMetrics.riskReward.toFixed(2)}), aunque con ${Math.abs(ethMetrics.maxDrawdown).toFixed(1)}% de drawdown máximo.`;
    } else {
      winner = 'BTC';
      conclusion = `BTC ofrece mejor perfil riesgo/retorno (${btcMetrics.riskReward.toFixed(2)} vs ${ethMetrics.riskReward.toFixed(2)}) en los últimos 90 días.`;
    }
    
    return {
      btc: btcMetrics,
      eth: ethMetrics,
      winner,
      conclusion
    };
  } catch (error) {
    console.error('Error calculando ETH vs BTC:', error);
    throw error;
  }
}

/**
 * Calcula el estado Risk-On / Risk-Off del mercado crypto
 */
export async function calculateCryptoRisk(): Promise<CryptoRiskData> {
  try {
    // Calcular retorno promedio de alts últimos 7 días
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
    
    // Obtener retorno de BTC últimos 7 días
    const btcCandles = await fetchCandles('BTCUSDT', '1d', 7);
    const btcReturn7d = calculateReturn(btcCandles[0].close, btcCandles[btcCandles.length - 1].close);
    
    // Determinar estado
    let state: RiskState = 'neutral';
    const reasons: string[] = [];
    
    if (altsAvgReturn7d > 5 && altsAvgReturn7d > btcReturn7d) {
      state = 'risk_on';
      reasons.push(`Alts promediando +${altsAvgReturn7d.toFixed(1)}% en 7 días`);
      reasons.push('Capital fluyendo hacia altcoins');
      reasons.push('Sentimiento de apetito por riesgo');
    } else if (altsAvgReturn7d < -5 || (btcReturn7d > 2 && altsAvgReturn7d < 0)) {
      state = 'risk_off';
      reasons.push('Alts bajo presión bajista');
      reasons.push('Capital refugiándose en BTC');
      reasons.push('Mercado en modo defensivo');
    } else {
      state = 'neutral';
      reasons.push('Movimientos laterales en el mercado');
      reasons.push('Sin tendencia clara de riesgo');
      reasons.push('Esperar confirmación direccional');
    }
    
    return {
      state,
      reasons,
      altsAvgReturn7d
    };
  } catch (error) {
    console.error('Error calculando Crypto Risk:', error);
    throw error;
  }
}
