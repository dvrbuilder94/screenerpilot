// Trading profile types

export type TradingStyle = 'scalping' | 'swing' | 'investment';

export interface TradingProfile {
  style: TradingStyle;
  name: string;
  description: string;
  preferredTimeframes: string[];
  weights: {
    trend: number;        // EMA alignment weight
    momentum: number;     // RSI/MACD weight
    supertrend: number;   // Supertrend weight
    volatility: number;   // ATR consideration
    confluence: number;   // Multi-indicator alignment bonus
  };
}

export const TRADING_PROFILES: Record<TradingStyle, TradingProfile> = {
  scalping: {
    style: 'scalping',
    name: 'Scalping',
    description: 'Operaciones rápidas en timeframes cortos (5m-15m)',
    preferredTimeframes: ['5m', '15m', '1h'],
    weights: {
      trend: 0.8,
      momentum: 1.5,      // Momentum es crítico
      supertrend: 1.3,
      volatility: 0.7,    // Menos peso a volatilidad
      confluence: 1.0,
    },
  },
  swing: {
    style: 'swing',
    name: 'Swing Trading',
    description: 'Operaciones de días a semanas (1h-4h-1d)',
    preferredTimeframes: ['1h', '4h', '1d'],
    weights: {
      trend: 1.2,         // Tendencia más importante
      momentum: 1.0,
      supertrend: 1.2,
      volatility: 1.0,
      confluence: 1.3,    // Confluencia crítica
    },
  },
  investment: {
    style: 'investment',
    name: 'Inversión Técnica',
    description: 'Posiciones de semanas a meses (1d-1w)',
    preferredTimeframes: ['1d', '1w'],
    weights: {
      trend: 1.5,         // Tendencia dominante
      momentum: 0.8,      // Menos énfasis en momentum
      supertrend: 1.0,
      volatility: 0.5,    // Volatilidad menos relevante
      confluence: 1.5,    // Alta confluencia esencial
    },
  },
};
