import { IndicatorData } from "./indicators";
import { EnhancedSignal, SignalType } from "@/types/trading";
import { TradingProfile } from "@/types/tradingProfile";

interface SignalCalculationParams {
  indicators: IndicatorData;
  currentPrice: number;
  prevPrice?: number;
  tradingProfile?: TradingProfile;
  sentiment?: null;
}

/**
 * Enhanced signal system with confluence and context analysis
 */
export function calculateEnhancedSignal({
  indicators,
  currentPrice,
  prevPrice = currentPrice,
  tradingProfile,
  sentiment,
}: SignalCalculationParams): EnhancedSignal {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 0;
  let confidence = 0;

  // Get trading profile weights (default: swing)
  const weights = tradingProfile?.weights || {
    trend: 1.2,
    momentum: 1.0,
    supertrend: 1.2,
    volatility: 1.0,
    confluence: 1.3,
  };

  // Get last values
  const lastEma20 = indicators.ema20[indicators.ema20.length - 1] || 0;
  const lastEma50 = indicators.ema50[indicators.ema50.length - 1] || 0;
  const lastRsi = indicators.rsi[indicators.rsi.length - 1] || 0;
  const lastMacd = indicators.macd.macd[indicators.macd.macd.length - 1] || 0;
  const lastSignal = indicators.macd.signal[indicators.macd.signal.length - 1] || 0;
  const lastHistogram = indicators.macd.histogram[indicators.macd.histogram.length - 1] || 0;
  const lastAtr = indicators.atr[indicators.atr.length - 1] || 0;
  const lastSupertrend = indicators.supertrend.trend[indicators.supertrend.trend.length - 1];
  const supertrendValue = indicators.supertrend.value[indicators.supertrend.value.length - 1] || 0;

  // Previous values to detect crosses
  const prevMacd = indicators.macd.macd[indicators.macd.macd.length - 2] || lastMacd;
  const prevSignalLine = indicators.macd.signal[indicators.macd.signal.length - 2] || lastSignal;
  const prevRsi = indicators.rsi[indicators.rsi.length - 2] || lastRsi;

  // ============= TREND ANALYSIS (with adjusted weight) =============
  let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  
  if (lastEma20 > lastEma50 && currentPrice > lastEma20) {
    trend = 'BULLISH';
    score += 3 * weights.trend;
    reasons.push("Bullish trend confirmed (EMA20 > EMA50)");
    confidence += 15;
  } else if (lastEma20 < lastEma50 && currentPrice < lastEma20) {
    trend = 'BEARISH';
    score -= 3 * weights.trend;
    reasons.push("Bearish trend confirmed (EMA20 < EMA50)");
    confidence += 15;
  } else {
    trend = 'NEUTRAL';
    warnings.push("Price between EMAs - no clear trend");
  }

  // ============= SUPERTREND (with adjusted weight) =============
  if (lastSupertrend) {
    score += 3 * weights.supertrend;
    reasons.push("Bullish Supertrend active");
    confidence += 20;
  } else {
    score -= 3 * weights.supertrend;
    reasons.push("Bearish Supertrend active");
    confidence += 20;
  }

  // ============= RSI (Momentum with adjusted weight) =============
  if (lastRsi > 55 && lastRsi < 75) {
    score += 2 * weights.momentum;
    reasons.push(`Healthy RSI (${lastRsi.toFixed(1)})`);
    confidence += 10;
  } else if (lastRsi < 45 && lastRsi > 25) {
    score -= 2 * weights.momentum;
    reasons.push(`Weak RSI (${lastRsi.toFixed(1)})`);
    confidence += 10;
  } else if (lastRsi >= 75) {
    warnings.push(`⚠️ Extreme overbought (RSI ${lastRsi.toFixed(1)})`);
    score -= 1 * weights.momentum;
  } else if (lastRsi <= 25) {
    warnings.push(`⚠️ Extreme oversold (RSI ${lastRsi.toFixed(1)})`);
    score += 1 * weights.momentum;
  }

  // RSI Divergence (advanced signal with weight)
  if (currentPrice > prevPrice && lastRsi < prevRsi) {
    warnings.push("🔴 Bearish divergence detected (price rising but RSI falling)");
    score -= 2 * weights.momentum;
  } else if (currentPrice < prevPrice && lastRsi > prevRsi) {
    reasons.push("🟢 Bullish divergence detected (price falling but RSI rising)");
    score += 2 * weights.momentum;
    confidence += 15;
  }

  // ============= MACD (Confluence with adjusted weight) =============
  const macdCrossover = prevMacd <= prevSignalLine && lastMacd > lastSignal;
  const macdCrossunder = prevMacd >= prevSignalLine && lastMacd < lastSignal;

  if (macdCrossover) {
    score += 3 * weights.momentum;
    reasons.push("🚀 Recent bullish MACD crossover");
    confidence += 20;
  } else if (macdCrossunder) {
    score -= 3 * weights.momentum;
    reasons.push("📉 Recent bearish MACD crossover");
    confidence += 20;
  } else if (lastMacd > lastSignal && lastHistogram > 0) {
    score += 1 * weights.momentum;
    reasons.push("MACD above signal line");
    confidence += 5;
  } else if (lastMacd < lastSignal && lastHistogram < 0) {
    score -= 1 * weights.momentum;
    reasons.push("MACD below signal line");
    confidence += 5;
  }

  // ============= ATR (Risk management) =============
  const atrPercent = currentPrice > 0 ? (lastAtr / currentPrice) * 100 : 0;
  if (atrPercent > 5) {
    warnings.push(`⚠️ Extreme volatility (ATR ${atrPercent.toFixed(1)}%)`);
    confidence -= 10;
  } else if (atrPercent < 1) {
    warnings.push("Low volatility - limited movements expected");
  }

  // ============= CONFLUENCE BONUS (with adjusted weight) =============
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
    score += 2 * weights.confluence;
    reasons.push(`✅ Bullish confluence (${bullishIndicators}/4 indicators)`);
    confidence += 15;
  } else if (bearishIndicators >= 3) {
    score -= 2 * weights.confluence;
    reasons.push(`❌ Bearish confluence (${bearishIndicators}/4 indicators)`);
    confidence += 15;
  }

  // Sentiment impact removed in Phase 1 cleanup

  // ============= DETERMINE FINAL BIAS =============
  const signal = getSignalFromScore(score);

  // Adjust confidence maximum to 100
  confidence = Math.min(Math.max(confidence, 0), 100);

  return {
    signal,
    score,
    confidence,
    reasons,
    warnings,
    trend,
  };
}

function getSignalFromScore(score: number): SignalType {
  if (score >= 8) return 'STRONG_BULLISH';
  if (score >= 4) return 'BULLISH';
  if (score <= -8) return 'STRONG_BEARISH';
  if (score <= -4) return 'BEARISH';
  return 'NEUTRAL_BIAS';
}
