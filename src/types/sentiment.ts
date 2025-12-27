// Market sentiment types

export type SentimentLevel = 'extreme_fear' | 'fear' | 'neutral' | 'greed' | 'extreme_greed';

export interface SentimentData {
  level: SentimentLevel;
  score: number; // 0-100 (0 = extreme fear, 100 = extreme greed)
  label: string;
  description: string;
  timestamp: number;
  source?: string;
}

export interface SentimentImpact {
  scoreModifier: number;    // Adjustment to base score (-3 to +3)
  confidenceModifier: number; // Adjustment to confidence (-20 to +20)
  warning?: string;
}

export function getSentimentLevel(score: number): SentimentLevel {
  if (score <= 20) return 'extreme_fear';
  if (score <= 40) return 'fear';
  if (score <= 60) return 'neutral';
  if (score <= 80) return 'greed';
  return 'extreme_greed';
}

export function getSentimentImpact(
  sentiment: SentimentData,
  signalType: 'bullish' | 'bearish'
): SentimentImpact {
  const { level, score } = sentiment;

  // Contrarian logic: extreme fear may be a buying opportunity
  if (level === 'extreme_fear' && signalType === 'bullish') {
    return {
      scoreModifier: 2,
      confidenceModifier: 15,
      warning: '💡 Extreme fear sentiment - possible contrarian opportunity',
    };
  }

  // Extreme euphoria: be cautious with buys
  if (level === 'extreme_greed' && signalType === 'bullish') {
    return {
      scoreModifier: -2,
      confidenceModifier: -15,
      warning: '⚠️ Extreme euphoria - caution with new bullish entries',
    };
  }

  // Extreme fear with bearish signal: may be overextended
  if (level === 'extreme_fear' && signalType === 'bearish') {
    return {
      scoreModifier: -1,
      confidenceModifier: -10,
      warning: '⚠️ Already extreme fear - caution with shorts at bottom',
    };
  }

  // Euphoria with bearish signal: good timing for sells
  if (level === 'extreme_greed' && signalType === 'bearish') {
    return {
      scoreModifier: 1,
      confidenceModifier: 10,
      warning: '💡 Extreme euphoria - good timing for bearish positions',
    };
  }

  // Intermediate levels: less impact
  if (level === 'fear' && signalType === 'bullish') {
    return { scoreModifier: 1, confidenceModifier: 5 };
  }

  if (level === 'greed' && signalType === 'bearish') {
    return { scoreModifier: 1, confidenceModifier: 5 };
  }

  // Neutral or no clear confluence
  return { scoreModifier: 0, confidenceModifier: 0 };
}
