// Binance API client for fetching candlestick data

export interface Candle {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
}

export type Symbol = 'BTCUSDT' | 'ETHUSDT';
export type Interval = '1h' | '4h' | '1d' | '1w';

const BINANCE_API_BASE = 'https://api.binance.com/api/v3';

/**
 * Fetch candlestick data from Binance
 */
export async function fetchCandles(
  symbol: Symbol,
  interval: Interval,
  limit: number = 500
): Promise<Candle[]> {
  try {
    const url = `${BINANCE_API_BASE}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
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
 * Get current price for a symbol
 */
export async function getCurrentPrice(symbol: Symbol): Promise<number> {
  try {
    const url = `${BINANCE_API_BASE}/ticker/price?symbol=${symbol}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error('Error fetching current price:', error);
    throw error;
  }
}
