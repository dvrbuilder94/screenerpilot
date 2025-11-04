import { IndicatorData } from "./indicators";
import { EnhancedSignal, SignalType } from "@/types/trading";

interface SignalCalculationParams {
  indicators: IndicatorData;
  currentPrice: number;
  prevPrice?: number;
}

/**
 * Sistema de señales mejorado con confluencia y análisis de contexto
 */
export function calculateEnhancedSignal({
  indicators,
  currentPrice,
  prevPrice = currentPrice,
}: SignalCalculationParams): EnhancedSignal {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 0;
  let confidence = 0;

  // Obtener últimos valores
  const lastEma20 = indicators.ema20[indicators.ema20.length - 1] || 0;
  const lastEma50 = indicators.ema50[indicators.ema50.length - 1] || 0;
  const lastRsi = indicators.rsi[indicators.rsi.length - 1] || 0;
  const lastMacd = indicators.macd.macd[indicators.macd.macd.length - 1] || 0;
  const lastSignal = indicators.macd.signal[indicators.macd.signal.length - 1] || 0;
  const lastHistogram = indicators.macd.histogram[indicators.macd.histogram.length - 1] || 0;
  const lastAtr = indicators.atr[indicators.atr.length - 1] || 0;
  const lastSupertrend = indicators.supertrend.trend[indicators.supertrend.trend.length - 1];
  const supertrendValue = indicators.supertrend.value[indicators.supertrend.value.length - 1] || 0;

  // Valores anteriores para detectar cruces
  const prevMacd = indicators.macd.macd[indicators.macd.macd.length - 2] || lastMacd;
  const prevSignalLine = indicators.macd.signal[indicators.macd.signal.length - 2] || lastSignal;
  const prevRsi = indicators.rsi[indicators.rsi.length - 2] || lastRsi;

  // ============= ANÁLISIS DE TENDENCIA =============
  let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  
  if (lastEma20 > lastEma50 && currentPrice > lastEma20) {
    trend = 'BULLISH';
    score += 3;
    reasons.push("Tendencia alcista confirmada (EMA20 > EMA50)");
    confidence += 15;
  } else if (lastEma20 < lastEma50 && currentPrice < lastEma20) {
    trend = 'BEARISH';
    score -= 3;
    reasons.push("Tendencia bajista confirmada (EMA20 < EMA50)");
    confidence += 15;
  } else {
    trend = 'NEUTRAL';
    warnings.push("Precio entre EMAs - sin tendencia clara");
  }

  // ============= SUPERTREND (alta fiabilidad) =============
  if (lastSupertrend) {
    score += 3;
    reasons.push("Supertrend alcista activo");
    confidence += 20;
  } else {
    score -= 3;
    reasons.push("Supertrend bajista activo");
    confidence += 20;
  }

  // ============= RSI (Momentum) =============
  if (lastRsi > 55 && lastRsi < 75) {
    score += 2;
    reasons.push(`RSI saludable (${lastRsi.toFixed(1)})`);
    confidence += 10;
  } else if (lastRsi < 45 && lastRsi > 25) {
    score -= 2;
    reasons.push(`RSI débil (${lastRsi.toFixed(1)})`);
    confidence += 10;
  } else if (lastRsi >= 75) {
    warnings.push(`⚠️ Sobrecompra extrema (RSI ${lastRsi.toFixed(1)})`);
    score -= 1;
  } else if (lastRsi <= 25) {
    warnings.push(`⚠️ Sobreventa extrema (RSI ${lastRsi.toFixed(1)})`);
    score += 1;
  }

  // Divergencia RSI (señal avanzada)
  if (currentPrice > prevPrice && lastRsi < prevRsi) {
    warnings.push("🔴 Divergencia bajista detectada (precio sube pero RSI baja)");
    score -= 2;
  } else if (currentPrice < prevPrice && lastRsi > prevRsi) {
    reasons.push("🟢 Divergencia alcista detectada (precio baja pero RSI sube)");
    score += 2;
    confidence += 15;
  }

  // ============= MACD (Confluencia) =============
  const macdCrossover = prevMacd <= prevSignalLine && lastMacd > lastSignal;
  const macdCrossunder = prevMacd >= prevSignalLine && lastMacd < lastSignal;

  if (macdCrossover) {
    score += 3;
    reasons.push("🚀 MACD cruce alcista reciente");
    confidence += 20;
  } else if (macdCrossunder) {
    score -= 3;
    reasons.push("📉 MACD cruce bajista reciente");
    confidence += 20;
  } else if (lastMacd > lastSignal && lastHistogram > 0) {
    score += 1;
    reasons.push("MACD por encima de señal");
    confidence += 5;
  } else if (lastMacd < lastSignal && lastHistogram < 0) {
    score -= 1;
    reasons.push("MACD por debajo de señal");
    confidence += 5;
  }

  // ============= ATR (Gestión de riesgo) =============
  const atrPercent = currentPrice > 0 ? (lastAtr / currentPrice) * 100 : 0;
  if (atrPercent > 5) {
    warnings.push(`⚠️ Volatilidad extrema (ATR ${atrPercent.toFixed(1)}%)`);
    confidence -= 10;
  } else if (atrPercent < 1) {
    warnings.push("Baja volatilidad - movimientos limitados esperados");
  }

  // ============= CONFLUENCIA BONUS =============
  const bullishIndicators = [
    lastEma20 > lastEma50,
    lastSupertrend,
    lastRsi > 50 && lastRsi < 75,
    lastMacd > lastSignal,
  ].filter(Boolean).length;

  const bearishIndicators = [
    lastEma20 < lastEma50,
    !lastSupertrend,
    lastRsi < 50 && lastRsi > 25,
    lastMacd < lastSignal,
  ].filter(Boolean).length;

  if (bullishIndicators >= 3) {
    score += 2;
    reasons.push(`✅ Confluencia alcista (${bullishIndicators}/4 indicadores)`);
    confidence += 15;
  } else if (bearishIndicators >= 3) {
    score -= 2;
    reasons.push(`❌ Confluencia bajista (${bearishIndicators}/4 indicadores)`);
    confidence += 15;
  }

  // ============= CALCULAR ZONAS DE ENTRADA Y STOP LOSS =============
  const entryZone = calculateEntryZone(currentPrice, lastAtr, trend);
  const stopLoss = calculateStopLoss(currentPrice, lastAtr, supertrendValue, trend);
  const targets = calculateTargets(currentPrice, lastAtr, trend);

  // ============= DETERMINAR SEÑAL FINAL =============
  const signal = getSignalFromScore(score);
  
  // Ajustar confidence máximo a 100
  confidence = Math.min(Math.max(confidence, 0), 100);

  return {
    signal,
    score,
    confidence,
    reasons,
    warnings,
    entryZone,
    stopLoss,
    targets,
    trend,
  };
}

function getSignalFromScore(score: number): SignalType {
  if (score >= 8) return 'STRONG_BUY';
  if (score >= 4) return 'BUY';
  if (score <= -8) return 'STRONG_SELL';
  if (score <= -4) return 'SELL';
  return 'HOLD';
}

function calculateEntryZone(
  price: number,
  atr: number,
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
): { min: number; max: number } | undefined {
  if (trend === 'NEUTRAL') return undefined;

  const zone = atr * 0.5; // 50% del ATR como zona de entrada
  
  if (trend === 'BULLISH') {
    return {
      min: price - zone,
      max: price,
    };
  } else {
    return {
      min: price,
      max: price + zone,
    };
  }
}

function calculateStopLoss(
  price: number,
  atr: number,
  supertrendValue: number,
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
): number | undefined {
  if (trend === 'NEUTRAL') return undefined;

  // Usar Supertrend como stop loss preferido, o 2x ATR como fallback
  if (supertrendValue > 0) {
    return supertrendValue;
  }

  const stopDistance = atr * 2;
  return trend === 'BULLISH' ? price - stopDistance : price + stopDistance;
}

function calculateTargets(
  price: number,
  atr: number,
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
): number[] | undefined {
  if (trend === 'NEUTRAL') return undefined;

  const multiplier = trend === 'BULLISH' ? 1 : -1;
  
  return [
    price + (atr * 2 * multiplier),  // Target 1: 2x ATR
    price + (atr * 4 * multiplier),  // Target 2: 4x ATR
    price + (atr * 6 * multiplier),  // Target 3: 6x ATR
  ];
}
