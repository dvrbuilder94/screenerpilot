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
  scoreModifier: number;    // Ajuste al score base (-3 a +3)
  confidenceModifier: number; // Ajuste a la confianza (-20 a +20)
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

  // Lógica contrarian: miedo extremo puede ser oportunidad de compra
  if (level === 'extreme_fear' && signalType === 'bullish') {
    return {
      scoreModifier: 2,
      confidenceModifier: 15,
      warning: '💡 Sentimiento de miedo extremo - posible oportunidad contrarian',
    };
  }

  // Euforia extrema: ser cauteloso con compras
  if (level === 'extreme_greed' && signalType === 'bullish') {
    return {
      scoreModifier: -2,
      confidenceModifier: -15,
      warning: '⚠️ Euforia extrema - precaución con nuevas entradas alcistas',
    };
  }

  // Miedo extremo y señal bajista: puede estar sobreextendido
  if (level === 'extreme_fear' && signalType === 'bearish') {
    return {
      scoreModifier: -1,
      confidenceModifier: -10,
      warning: '⚠️ Ya hay miedo extremo - cuidado con shorts en suelo',
    };
  }

  // Euforia y señal bajista: buen timing para ventas
  if (level === 'extreme_greed' && signalType === 'bearish') {
    return {
      scoreModifier: 1,
      confidenceModifier: 10,
      warning: '💡 Euforia extrema - buen timing para posiciones bajistas',
    };
  }

  // Niveles intermedios: menor impacto
  if (level === 'fear' && signalType === 'bullish') {
    return { scoreModifier: 1, confidenceModifier: 5 };
  }

  if (level === 'greed' && signalType === 'bearish') {
    return { scoreModifier: 1, confidenceModifier: 5 };
  }

  // Neutral o no hay confluencia clara
  return { scoreModifier: 0, confidenceModifier: 0 };
}
