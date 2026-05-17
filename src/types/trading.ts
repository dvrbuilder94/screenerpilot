// Trading signal types and interfaces

export type SignalType = 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL_BIAS' | 'BEARISH' | 'STRONG_BEARISH';

export interface EnhancedSignal {
  signal: SignalType;
  score: number;
  confidence: number; // 0-100
  reasons: string[];
  warnings: string[];
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface TradingSetup {
  symbol: string;
  assetType: 'crypto' | 'stock' | 'index' | 'etf' | 'commodity';
  currentPrice: number;
  macroSignal: EnhancedSignal;
  microSignal: EnhancedSignal;
  combinedConfidence: number;
  lastUpdate: number;
  priceChange24h?: number;
  recentPrices?: number[];
  volume24h?: number;
}

export interface FilterOptions {
  trend?: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'ALL';
  signalType?: SignalType | 'ALL';
  assetType?: 'crypto' | 'stock' | 'index' | 'etf' | 'commodity' | 'ALL';
  minConfidence?: number;
}
