import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Horizon definitions with milliseconds
const HORIZONS = [
  { name: '1w', days: 7, ms: 7 * 24 * 60 * 60 * 1000 },
  { name: '1m', days: 30, ms: 30 * 24 * 60 * 60 * 1000 },
  { name: '3m', days: 90, ms: 90 * 24 * 60 * 60 * 1000 }
];

// Interval to milliseconds mapping for candle data
const INTERVAL_MS: Record<string, number> = {
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000
};

interface SignalSnapshot {
  id: string;
  symbol: string;
  asset_type: string;
  timeframe: string;
  signal: string;
  score: number;
  confidence: number;
  price_at_signal: number;
  created_at: string;
}

interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

// Calculate max drawdown from price data
function calculateMaxDrawdown(prices: number[], direction: 'long' | 'short'): number {
  if (prices.length === 0) return 0;
  
  let maxDrawdown = 0;
  
  if (direction === 'long') {
    // For long positions: track peak-to-trough decline
    let peak = prices[0];
    for (const price of prices) {
      if (price > peak) peak = price;
      const drawdown = ((peak - price) / peak) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
  } else {
    // For short positions: track trough-to-peak rise (adverse move)
    let trough = prices[0];
    for (const price of prices) {
      if (price < trough) trough = price;
      const drawdown = ((price - trough) / trough) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
  }
  
  return maxDrawdown;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting signal outcome resolution...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = Date.now();
    const results = {
      checked: 0,
      resolved: 0,
      errors: 0,
      skipped: 0
    };

    // Process each horizon
    for (const horizon of HORIZONS) {
      const cutoffTime = new Date(now - horizon.ms).toISOString();
      
      console.log(`Checking horizon ${horizon.name} (cutoff: ${cutoffTime})`);

      // Find snapshots that are old enough but don't have this horizon resolved yet
      // Use a LEFT JOIN approach: get snapshots, then check if outcome exists
      const { data: candidates, error: candidateError } = await supabase
        .from('signal_snapshots')
        .select('*')
        .lt('created_at', cutoffTime)
        .order('created_at', { ascending: true })
        .limit(100); // Process in batches

      if (candidateError) {
        console.error('Error fetching candidates:', candidateError);
        continue;
      }

      if (!candidates || candidates.length === 0) {
        console.log(`No candidates for ${horizon.name}`);
        continue;
      }

      results.checked += candidates.length;

      for (const snapshot of candidates as SignalSnapshot[]) {
        try {
          // Check if outcome already exists for this snapshot + horizon
          const { data: existingOutcome } = await supabase
            .from('signal_outcomes')
            .select('id')
            .eq('snapshot_id', snapshot.id)
            .eq('horizon', horizon.name)
            .maybeSingle();

          if (existingOutcome) {
            results.skipped++;
            continue;
          }

          // Calculate time window for price data
          const startTime = new Date(snapshot.created_at).getTime();
          const endTime = startTime + horizon.ms;

          // Fetch candles for the horizon window
          const { data: candles, error: candleError } = await supabase
            .from('asset_candles')
            .select('timestamp, open, high, low, close')
            .eq('symbol', snapshot.symbol)
            .eq('asset_type', snapshot.asset_type)
            .eq('interval', snapshot.timeframe)
            .gte('timestamp', startTime)
            .lte('timestamp', endTime)
            .order('timestamp', { ascending: true });

          if (candleError || !candles || candles.length === 0) {
            console.log(`No candle data for ${snapshot.symbol} ${snapshot.timeframe} - skipping`);
            results.skipped++;
            continue;
          }

          // Get start and end prices
          const startPrice = snapshot.price_at_signal;
          const endCandle = candles[candles.length - 1] as Candle;
          const endPrice = endCandle.close;

          // Calculate return percentage
          const returnPct = ((endPrice - startPrice) / startPrice) * 100;

          // Determine direction based on signal for drawdown calculation
          const isLongSignal = ['STRONG_BUY', 'BUY'].includes(snapshot.signal);
          const direction = isLongSignal ? 'long' : 'short';

          // Calculate max drawdown using low prices for long, high prices for short
          const pricesForDrawdown = isLongSignal
            ? (candles as Candle[]).map(c => c.low)
            : (candles as Candle[]).map(c => c.high);
          
          const maxDrawdown = calculateMaxDrawdown(pricesForDrawdown, direction);

          // Insert outcome (immutable)
          const { error: insertError } = await supabase
            .from('signal_outcomes')
            .insert({
              snapshot_id: snapshot.id,
              horizon: horizon.name,
              start_price: startPrice,
              end_price: endPrice,
              return_pct: returnPct,
              max_drawdown: maxDrawdown
            });

          if (insertError) {
            // Unique constraint violation means it was already resolved (race condition)
            if (insertError.code === '23505') {
              results.skipped++;
            } else {
              console.error(`Error inserting outcome for ${snapshot.id}:`, insertError);
              results.errors++;
            }
          } else {
            results.resolved++;
            console.log(`✓ Resolved ${snapshot.symbol} ${horizon.name}: ${returnPct.toFixed(2)}%`);
          }

        } catch (error) {
          console.error(`Error processing snapshot ${snapshot.id}:`, error);
          results.errors++;
        }
      }
    }

    console.log('Outcome resolution complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Outcome resolution error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
