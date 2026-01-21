import { fetchCandles, type Candle } from './binanceApi';

export type StockRiskState = 'risk_on' | 'neutral' | 'risk_off';

export interface StockMarketRegime {
  state: StockRiskState;
  reasons: string[];
  vix: number;
  sectorRotation: 'cyclical' | 'defensive' | 'neutral';
  isLoading?: boolean;
}

// Sector ETFs
const CYCLICAL_ETFS = ['XLK', 'XLF', 'XLE', 'XLI'];
const DEFENSIVE_ETFS = ['XLP', 'XLV', 'XLU'];

async function fetchLatestPrice(symbol: string): Promise<number | null> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-stock-data`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ symbol, interval: '1d' }),
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const candles = data.candles || data;
    
    if (Array.isArray(candles) && candles.length > 0) {
      return candles[candles.length - 1].close;
    }
    return null;
  } catch (err) {
    console.error(`Error fetching ${symbol}:`, err);
    return null;
  }
}

async function fetchSectorReturns(symbols: string[]): Promise<number> {
  const returns: number[] = [];
  
  await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-stock-data`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ symbol, interval: '1d' }),
          }
        );

        if (!response.ok) return;

        const data = await response.json();
        const candles = data.candles || data;
        
        if (Array.isArray(candles) && candles.length >= 5) {
          const current = candles[candles.length - 1].close;
          const past = candles[candles.length - 5].close; // 5-day return
          const returnPct = ((current - past) / past) * 100;
          returns.push(returnPct);
        }
      } catch (err) {
        console.error(`Error fetching ${symbol}:`, err);
      }
    })
  );

  if (returns.length === 0) return 0;
  return returns.reduce((a, b) => a + b, 0) / returns.length;
}

export async function calculateStockRegime(): Promise<StockMarketRegime> {
  const reasons: string[] = [];
  let vixScore = 0;
  let sectorScore = 0;
  let vixValue = 20; // Default neutral
  let sectorRotation: 'cyclical' | 'defensive' | 'neutral' = 'neutral';

  // 1. Fetch VIX
  const vix = await fetchLatestPrice('^VIX');
  if (vix !== null) {
    vixValue = vix;
    
    if (vix < 18) {
      vixScore = 1;
      reasons.push(`VIX at ${vix.toFixed(1)} (low volatility)`);
    } else if (vix > 25) {
      vixScore = -1;
      reasons.push(`VIX at ${vix.toFixed(1)} (elevated fear)`);
    } else {
      reasons.push(`VIX at ${vix.toFixed(1)} (moderate)`);
    }
  } else {
    reasons.push('VIX data unavailable');
  }

  // 2. Sector Rotation Analysis
  const [cyclicalReturn, defensiveReturn] = await Promise.all([
    fetchSectorReturns(CYCLICAL_ETFS),
    fetchSectorReturns(DEFENSIVE_ETFS),
  ]);

  const rotationDiff = cyclicalReturn - defensiveReturn;

  if (rotationDiff > 0.5) {
    sectorScore = 1;
    sectorRotation = 'cyclical';
    reasons.push('Cyclical sectors outperforming defensives');
  } else if (rotationDiff < -0.5) {
    sectorScore = -1;
    sectorRotation = 'defensive';
    reasons.push('Defensive sectors outperforming cyclicals');
  } else {
    sectorRotation = 'neutral';
    reasons.push('Sector rotation neutral');
  }

  // 3. Calculate final state
  const totalScore = vixScore + sectorScore;
  let state: StockRiskState;

  if (totalScore >= 1) {
    state = 'risk_on';
  } else if (totalScore <= -1) {
    state = 'risk_off';
  } else {
    state = 'neutral';
  }

  return {
    state,
    reasons,
    vix: vixValue,
    sectorRotation,
  };
}
