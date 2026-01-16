// Multi-source API client for fetching candlestick data (Binance + Yahoo Finance)
import presets from '@/config/presets.json';
import type { Region } from '@/types/trading';

export interface Candle {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
}

// Dynamic types from presets - combine all stock sources
const ALL_STOCKS = [
  ...presets.stocks_usa,
  ...presets.stocks_latam.argentina,
  ...presets.stocks_latam.brazil,
  ...presets.stocks_latam.chile,
  ...presets.stocks_asia,
] as const;

export type CryptoSymbol = typeof presets.crypto[number];
export type StockSymbol = typeof ALL_STOCKS[number];
export type IndexSymbol = typeof presets.index[number];
export type ETFSymbol = typeof presets.etf[number];
export type CommoditySymbol = 'GC=F' | 'SI=F' | 'PL=F' | 'PA=F' | 'HG=F' | 'CL=F' | 'NG=F';
export type Symbol = CryptoSymbol | StockSymbol | IndexSymbol | ETFSymbol | CommoditySymbol;
export type Interval = '1h' | '4h' | '1d' | '1w';
export type AssetType = 'crypto' | 'stock' | 'index' | 'etf' | 'commodity';
export type GroupKey = keyof typeof presets.groups;

const BINANCE_API_BASE = 'https://api.binance.com/api/v3';

/**
 * Detect asset type from symbol
 */
const COMMODITY_SYMBOLS = ['GC=F', 'SI=F', 'PL=F', 'PA=F', 'HG=F', 'CL=F', 'NG=F'];

export function getAssetType(symbol: Symbol): AssetType {
  // Check if it's a crypto pair (ends with USDT, BUSD, etc.)
  if (symbol.endsWith('USDT') || symbol.endsWith('BUSD') || symbol.endsWith('BTC') || symbol.endsWith('ETH')) {
    return 'crypto';
  }
  
  // Check if it's a commodity (futures symbol)
  if (COMMODITY_SYMBOLS.includes(symbol)) return 'commodity';
  
  // Check presets
  if (presets.crypto.includes(symbol as any)) return 'crypto';
  if (ALL_STOCKS.includes(symbol as any)) return 'stock';
  if (presets.index.includes(symbol as any)) return 'index';
  if (presets.etf.includes(symbol as any)) return 'etf';
  
  return 'stock'; // default
}

// Build region map from presets
const LATAM_TICKERS = new Set<string>([
  ...presets.stocks_latam.argentina,
  ...presets.stocks_latam.brazil,
  ...presets.stocks_latam.chile,
]);

const ASIA_TICKERS = new Set<string>(presets.stocks_asia);

/**
 * Get region for a symbol
 */
export function getAssetRegion(symbol: string): Region {
  if (LATAM_TICKERS.has(symbol)) return 'latam';
  if (ASIA_TICKERS.has(symbol)) return 'asia';
  if (symbol.endsWith('USDT') || symbol.endsWith('BUSD')) return 'global';
  return 'usa';
}

/**
 * Get all unique tickers with their regions (deduplicates)
 */
export function getAllTickersWithRegion(): { symbol: string; region: Region }[] {
  const seen = new Set<string>();
  const result: { symbol: string; region: Region }[] = [];
  
  // Add crypto (global)
  for (const symbol of presets.crypto) {
    if (!seen.has(symbol)) {
      seen.add(symbol);
      result.push({ symbol, region: 'global' });
    }
  }
  
  // Add USA stocks
  for (const symbol of presets.stocks_usa) {
    if (!seen.has(symbol)) {
      seen.add(symbol);
      result.push({ symbol, region: 'usa' });
    }
  }
  
  // Add LATAM stocks
  for (const symbol of [...presets.stocks_latam.argentina, ...presets.stocks_latam.brazil, ...presets.stocks_latam.chile]) {
    if (!seen.has(symbol)) {
      seen.add(symbol);
      result.push({ symbol, region: 'latam' });
    }
  }
  
  // Add Asia stocks
  for (const symbol of presets.stocks_asia) {
    if (!seen.has(symbol)) {
      seen.add(symbol);
      result.push({ symbol, region: 'asia' });
    }
  }
  
  // Add ETFs (usa)
  for (const symbol of presets.etf) {
    if (!seen.has(symbol)) {
      seen.add(symbol);
      result.push({ symbol, region: 'usa' });
    }
  }
  
  // Add Index (global)
  for (const symbol of presets.index) {
    if (!seen.has(symbol)) {
      seen.add(symbol);
      result.push({ symbol, region: 'global' });
    }
  }
  
  // Add Commodities (global)
  for (const symbol of presets.commodities) {
    if (!seen.has(symbol)) {
      seen.add(symbol);
      result.push({ symbol, region: 'global' });
    }
  }
  
  return result;
}

/**
 * Convert interval to Yahoo Finance format
 */
function intervalToYahoo(interval: Interval): { range: string; granularity: string } {
  const map: Record<Interval, { range: string; granularity: string }> = {
    '1h': { range: '1mo', granularity: '1h' },
    '4h': { range: '3mo', granularity: '1d' }, // Yahoo doesn't have 4h, use 1d
    '1d': { range: '2y', granularity: '1d' },
    '1w': { range: '5y', granularity: '1wk' },
  };
  return map[interval];
}

/**
 * Fetch candlestick data from Yahoo Finance via backend (for stocks, indices, ETFs)
 */
async function fetchYahooCandles(
  symbol: Symbol,
  interval: Interval,
  limit: number = 500
): Promise<Candle[]> {
  try {
    // Use edge function as proxy to avoid CORS issues
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-stock-data`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ symbol, interval }),
      }
    );
    
    if (!response.ok) {
      // For 500 errors from Yahoo, return empty array instead of throwing
      // This prevents blank screens when Yahoo Finance has temporary issues
      if (response.status === 500 || response.status === 404) {
        console.warn(`Yahoo Finance unavailable for ${symbol}: ${response.status}`);
        return [];
      }
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Backend error: ${response.status}`);
    }
    
    const data = await response.json();
    const candles = data.candles || data || [];
    
    // Return the last 'limit' candles
    return Array.isArray(candles) ? candles.slice(-limit) : [];
  } catch (error) {
    // Log but don't crash - return empty array for graceful degradation
    console.warn(`Failed to fetch ${symbol}:`, error);
    return [];
  }
}

/**
 * Fetch candlestick data from Binance (for crypto)
 */
async function fetchBinanceCandles(
  symbol: Symbol,
  interval: Interval,
  limit: number = 500
): Promise<Candle[]> {
  try {
    const url = `${BINANCE_API_BASE}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Binance API error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.map((candle: any[]) => ({
      openTime: candle[0],
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5]),
      closeTime: candle[6],
    }));
  } catch (error) {
    console.error('Error fetching Binance data:', error);
    throw error;
  }
}

/**
 * Fetch candlestick data (auto-detects source)
 */
export async function fetchCandles(
  symbol: Symbol,
  interval: Interval,
  limit: number = 500
): Promise<Candle[]> {
  const assetType = getAssetType(symbol);
  
  if (assetType === 'crypto') {
    return fetchBinanceCandles(symbol, interval, limit);
  } else {
    return fetchYahooCandles(symbol, interval, limit);
  }
}

/**
 * Get current price for a symbol
 */
export async function getCurrentPrice(symbol: Symbol): Promise<number> {
  const assetType = getAssetType(symbol);
  
  try {
    if (assetType === 'crypto') {
      const url = `${BINANCE_API_BASE}/ticker/price?symbol=${symbol}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Binance API error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return parseFloat(data.price);
    } else {
      // For stocks, get the last candle from the fetched data
      const candles = await fetchYahooCandles(symbol, '1d', 5);
      return candles[candles.length - 1]?.close || 0;
    }
  } catch (error) {
    console.error('Error fetching current price:', error);
    throw error;
  }
}

/**
 * Get presets configuration
 */
export function getPresets() {
  return presets;
}

/**
 * Get all symbols for a specific asset type
 */
export function getSymbolsByType(type: AssetType): Symbol[] {
  switch (type) {
    case 'crypto':
      return presets.crypto as Symbol[];
    case 'stock':
      return ALL_STOCKS as unknown as Symbol[];
    case 'index':
      return presets.index as Symbol[];
    case 'etf':
      return presets.etf as Symbol[];
    case 'commodity':
      return COMMODITY_SYMBOLS as Symbol[];
    default:
      return [];
  }
}

/**
 * Get symbols for a specific group
 */
export function getGroupSymbols(groupKey: GroupKey): Symbol[] {
  return (presets.groups[groupKey] || []) as Symbol[];
}
