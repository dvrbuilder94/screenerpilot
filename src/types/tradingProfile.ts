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
    description: 'Quick trades on short timeframes (5m-15m)',
    preferredTimeframes: ['5m', '15m', '1h'],
    weights: {
      trend: 0.8,
      momentum: 1.5,      // Momentum is critical
      supertrend: 1.3,
      volatility: 0.7,    // Less weight on volatility
      confluence: 1.0,
    },
  },
  swing: {
    style: 'swing',
    name: 'Swing Trading',
    description: 'Trades lasting days to weeks (1h-4h-1d)',
    preferredTimeframes: ['1h', '4h', '1d'],
    weights: {
      trend: 1.2,         // Trend more important
      momentum: 1.0,
      supertrend: 1.2,
      volatility: 1.0,
      confluence: 1.3,    // Confluence is critical
    },
  },
  investment: {
    style: 'investment',
    name: 'Technical Investment',
    description: 'Positions lasting weeks to months (1d-1w)',
    preferredTimeframes: ['1d', '1w'],
    weights: {
      trend: 1.5,         // Trend is dominant
      momentum: 0.8,      // Less emphasis on momentum
      supertrend: 1.0,
      volatility: 0.5,    // Volatility less relevant
      confluence: 1.5,    // High confluence essential
    },
  },
};
