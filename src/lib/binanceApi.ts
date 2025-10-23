// Multi-source API client for fetching candlestick data (Binance + Yahoo Finance)
import presets from '@/config/presets.json';

export interface Candle {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
}

// Dynamic types from presets
export type CryptoSymbol = typeof presets.crypto[number];
export type StockSymbol = typeof presets.stocks[number];
export type IndexSymbol = typeof presets.indices[number];
export type ETFSymbol = typeof presets.etf_alt[number];
export type Symbol = CryptoSymbol | StockSymbol | IndexSymbol | ETFSymbol;
export type Interval = '1h' | '4h' | '1d' | '1w';
export type AssetType = 'crypto' | 'stock' | 'index' | 'etf';
export type GroupKey = keyof typeof presets.groups;

const BINANCE_API_BASE = 'https://api.binance.com/api/v3';
const YAHOO_FINANCE_API = 'https://query1.finance.yahoo.com/v8/finance/chart';

/**
 * Detect asset type from symbol
 */
export function getAssetType(symbol: Symbol): AssetType {
  if (presets.crypto.includes(symbol as any)) return 'crypto';
  if (presets.stocks.includes(symbol as any)) return 'stock';
  if (presets.indices.includes(symbol as any)) return 'index';
  if (presets.etf_alt.includes(symbol as any)) return 'etf';
  return 'stock'; // default
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
 * Fetch candlestick data from Yahoo Finance (for stocks, indices, ETFs)
 */
async function fetchYahooCandles(
  symbol: Symbol,
  interval: Interval,
  limit: number = 500
): Promise<Candle[]> {
  try {
    const { range, granularity } = intervalToYahoo(interval);
    const url = `${YAHOO_FINANCE_API}/${symbol}?range=${range}&interval=${granularity}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Yahoo Finance API error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const result = data.chart.result[0];
    
    if (!result || !result.timestamp) {
      throw new Error('Invalid Yahoo Finance response');
    }
    
    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];
    
    const candles: Candle[] = timestamps.map((time: number, i: number) => ({
      openTime: time * 1000,
      open: quotes.open[i] || 0,
      high: quotes.high[i] || 0,
      low: quotes.low[i] || 0,
      close: quotes.close[i] || 0,
      volume: quotes.volume[i] || 0,
      closeTime: time * 1000 + 60000,
    })).filter((c: Candle) => c.close > 0); // Filter out invalid candles
    
    // Return the last 'limit' candles
    return candles.slice(-limit);
  } catch (error) {
    console.error('Error fetching Yahoo Finance data:', error);
    throw error;
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
      // For stocks, get the last candle
      const candles = await fetchYahooCandles(symbol, '1d', 1);
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
      return presets.stocks as Symbol[];
    case 'index':
      return presets.indices as Symbol[];
    case 'etf':
      return presets.etf_alt as Symbol[];
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
