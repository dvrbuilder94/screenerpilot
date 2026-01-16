// Trading signal types and interfaces

export type SignalType = 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';

export type Region = 'usa' | 'latam' | 'asia' | 'global';

export interface EnhancedSignal {
  signal: SignalType;
  score: number;
  confidence: number; // 0-100
  reasons: string[];
  warnings: string[];
  entryZone?: { min: number; max: number };
  stopLoss?: number;
  targets?: number[];
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
  volume24h?: number; // Average daily volume for sorting
  region?: Region;
}

export interface FilterOptions {
  trend?: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'ALL';
  signalType?: SignalType | 'ALL';
  assetType?: 'crypto' | 'stock' | 'index' | 'etf' | 'commodity' | 'ALL';
  minConfidence?: number;
}
