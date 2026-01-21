export type CommodityState = 
  | 'inflationary_boom'  // Energy + Metals ↑
  | 'late_cycle'         // Metals ↓, Gold ↑
  | 'deflationary'       // Commodities ↓, USD ↑
  | 'supply_shock';      // Energy ↑ strong

export interface CommodityMarketRegime {
  state: CommodityState;
  drivers: string[];
  dxy: number;
  copperGoldRatio: number;
  oilTrend: 'up' | 'down' | 'flat';
  isLoading?: boolean;
}

interface PriceData {
  current: number;
  past: number; // 7 days ago
}

async function fetchPriceWithHistory(symbol: string): Promise<PriceData | null> {
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
    
    // Handle graceful degradation (skipped symbols)
    if (data.skipped) {
      console.warn(`Symbol ${symbol} skipped: ${data.reason}`);
      return null;
    }
    
    const candles = data.candles || data;
    
    if (Array.isArray(candles) && candles.length >= 7) {
      return {
        current: candles[candles.length - 1].close,
        past: candles[candles.length - 7].close,
      };
    } else if (Array.isArray(candles) && candles.length > 0) {
      return {
        current: candles[candles.length - 1].close,
        past: candles[0].close,
      };
    }
    return null;
  } catch (err) {
    console.error(`Error fetching ${symbol}:`, err);
    return null;
  }
}

export async function calculateCommodityRegime(): Promise<CommodityMarketRegime> {
  const drivers: string[] = [];
  
  // Fetch all required data in parallel
  // Note: DX=F is Dollar Index Futures (DXY alternative on Yahoo)
  const [dxyData, oilData, goldData, copperData] = await Promise.all([
    fetchPriceWithHistory('DX=F'),      // DXY (Dollar Index Futures)
    fetchPriceWithHistory('CL=F'),      // Oil
    fetchPriceWithHistory('GC=F'),      // Gold
    fetchPriceWithHistory('HG=F'),      // Copper
  ]);

  // Default values
  let dxy = 103;
  let copperGoldRatio = 0.0002;
  let oilTrend: 'up' | 'down' | 'flat' = 'flat';
  
  // Scoring factors
  let energyScore = 0;
  let usdScore = 0;
  let metalsScore = 0;

  // 1. USD Strength (DXY)
  if (dxyData) {
    dxy = dxyData.current;
    const dxyChange = ((dxyData.current - dxyData.past) / dxyData.past) * 100;
    
    if (dxy > 105) {
      usdScore = -1;
      drivers.push(`USD strong (DXY: ${dxy.toFixed(1)})`);
    } else if (dxy < 100) {
      usdScore = 1;
      drivers.push(`USD weakening (DXY: ${dxy.toFixed(1)})`);
    } else {
      drivers.push(`USD neutral (DXY: ${dxy.toFixed(1)})`);
    }
  } else {
    drivers.push('DXY data unavailable');
  }

  // 2. Energy Leadership (Oil trend)
  if (oilData) {
    const oilReturn = ((oilData.current - oilData.past) / oilData.past) * 100;
    
    if (oilReturn > 5) {
      oilTrend = 'up';
      energyScore = 2; // Strong weight for supply shock detection
      drivers.push(`Oil surging +${oilReturn.toFixed(1)}% (7d)`);
    } else if (oilReturn > 2) {
      oilTrend = 'up';
      energyScore = 1;
      drivers.push(`Oil rising +${oilReturn.toFixed(1)}% (7d)`);
    } else if (oilReturn < -5) {
      oilTrend = 'down';
      energyScore = -2;
      drivers.push(`Oil falling ${oilReturn.toFixed(1)}% (7d)`);
    } else if (oilReturn < -2) {
      oilTrend = 'down';
      energyScore = -1;
      drivers.push(`Oil declining ${oilReturn.toFixed(1)}% (7d)`);
    } else {
      oilTrend = 'flat';
      drivers.push(`Oil stable (${oilReturn > 0 ? '+' : ''}${oilReturn.toFixed(1)}% 7d)`);
    }
  }

  // 3. Copper/Gold Ratio (Industrial vs Safe Haven)
  if (copperData && goldData) {
    copperGoldRatio = copperData.current / goldData.current;
    
    // Calculate the change in ratio
    const pastRatio = copperData.past / goldData.past;
    const ratioChange = ((copperGoldRatio - pastRatio) / pastRatio) * 100;
    
    if (ratioChange > 2) {
      metalsScore = 1;
      drivers.push('Copper outperforming Gold (risk appetite)');
    } else if (ratioChange < -2) {
      metalsScore = -1;
      drivers.push('Gold outperforming Copper (safe haven)');
    } else {
      drivers.push('Copper/Gold ratio stable');
    }
  }

  // 4. Determine State based on combination
  let state: CommodityState;

  // Supply Shock: Strong energy move + weak USD
  if (energyScore >= 2 && usdScore >= 0) {
    state = 'supply_shock';
  }
  // Deflationary: Strong USD + falling commodities
  else if (usdScore < 0 && energyScore <= 0 && metalsScore <= 0) {
    state = 'deflationary';
  }
  // Late Cycle: Gold outperforming, copper weak
  else if (metalsScore < 0 && energyScore <= 0) {
    state = 'late_cycle';
  }
  // Inflationary Boom: Energy + Metals both up
  else if (energyScore > 0 && metalsScore >= 0) {
    state = 'inflationary_boom';
  }
  // Default to late_cycle if unclear
  else {
    state = 'late_cycle';
  }

  return {
    state,
    drivers,
    dxy,
    copperGoldRatio,
    oilTrend,
  };
}

// Helper to get user-friendly state labels
export function getCommodityStateLabel(state: CommodityState): string {
  switch (state) {
    case 'inflationary_boom':
      return 'Inflationary Boom';
    case 'late_cycle':
      return 'Late Cycle';
    case 'deflationary':
      return 'Deflationary';
    case 'supply_shock':
      return 'Supply Shock';
    default:
      return state;
  }
}

// Helper to get state color
export function getCommodityStateColor(state: CommodityState): string {
  switch (state) {
    case 'inflationary_boom':
      return 'text-green-500';
    case 'supply_shock':
      return 'text-blue-500';
    case 'late_cycle':
      return 'text-yellow-500';
    case 'deflationary':
      return 'text-red-500';
    default:
      return 'text-muted-foreground';
  }
}
