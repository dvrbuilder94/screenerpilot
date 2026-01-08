import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Top crypto tickers for batch collection
const CRYPTO_UNIVERSE = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 
  'ADAUSDT', 'DOGEUSDT', 'MATICUSDT', 'DOTUSDT', 'LINKUSDT',
  'AVAXUSDT', 'UNIUSDT', 'ATOMUSDT', 'NEARUSDT', 'APTUSDT',
  'ARBUSDT', 'OPUSDT', 'INJUSDT', 'SUIUSDT', 'TAOUSDT'
];

const INTERVALS = ['5m', '15m', '1h', '4h', '1d'];

interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Calculate EMA
function calculateEMA(data: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  ema[0] = data[0];
  
  for (let i = 1; i < data.length; i++) {
    ema[i] = (data[i] - ema[i - 1]) * multiplier + ema[i - 1];
  }
  return ema;
}

// Calculate RSI
function calculateRSI(closes: number[], period = 14): number[] {
  const rsi: number[] = [];
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  rsi[period] = 100 - (100 / (1 + avgGain / avgLoss));

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    rsi[i] = 100 - (100 / (1 + avgGain / avgLoss));
  }

  return rsi;
}

// Calculate MACD
function calculateMACD(closes: number[]) {
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macdLine = ema12.map((val, i) => val - ema26[i]);
  const signal = calculateEMA(macdLine, 9);
  const histogram = macdLine.map((val, i) => val - signal[i]);
  
  return { macdLine, signal, histogram };
}

// Calculate ATR
function calculateATR(candles: Candle[], period = 14): number[] {
  const tr: number[] = [];
  
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    
    tr[i] = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
  }
  
  return calculateEMA(tr.slice(1), period);
}

// Calculate Supertrend
function calculateSupertrend(candles: Candle[], period = 10, multiplier = 3) {
  const atr = calculateATR(candles, period);
  const supertrend: number[] = [];
  const direction: string[] = [];
  
  for (let i = period; i < candles.length; i++) {
    const hl2 = (candles[i].high + candles[i].low) / 2;
    const upperBand = hl2 + multiplier * atr[i - period];
    const lowerBand = hl2 - multiplier * atr[i - period];
    
    if (candles[i].close > upperBand) {
      supertrend[i] = lowerBand;
      direction[i] = 'BULLISH';
    } else {
      supertrend[i] = upperBand;
      direction[i] = 'BEARISH';
    }
  }
  
  return { supertrend, direction };
}

// Generate trading signal
function generateSignal(
  close: number,
  ema9: number,
  ema21: number,
  ema50: number,
  rsi: number,
  macd: number,
  macdSignal: number,
  supertrendDir: string
) {
  let score = 0;
  let confidence = 0;

  // EMA alignment
  if (ema9 > ema21 && ema21 > ema50) score += 30;
  else if (ema9 < ema21 && ema21 < ema50) score -= 30;

  // RSI
  if (rsi > 70) score -= 20;
  else if (rsi < 30) score += 20;
  else if (rsi > 50) score += 10;
  else score -= 10;

  // MACD
  if (macd > macdSignal) score += 20;
  else score -= 20;

  // Supertrend
  if (supertrendDir === 'BULLISH') score += 20;
  else score -= 20;

  confidence = Math.min(Math.abs(score), 100);

  let signalType = 'HOLD';
  if (score > 60) signalType = 'STRONG_BUY';
  else if (score > 30) signalType = 'BUY';
  else if (score < -60) signalType = 'STRONG_SELL';
  else if (score < -30) signalType = 'SELL';

  const trend = score > 10 ? 'BULLISH' : score < -10 ? 'BEARISH' : 'NEUTRAL';

  return { signalType, score, confidence, trend };
}

// Check if snapshot should be captured (immutable track record)
async function shouldCaptureSnapshot(
  supabase: any,
  symbol: string,
  timeframe: string,
  currentSignal: string
): Promise<boolean> {
  const { data: lastSnapshot } = await supabase
    .from('signal_snapshots')
    .select('signal, created_at')
    .eq('symbol', symbol)
    .eq('timeframe', timeframe)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Capture if no previous snapshot exists
  if (!lastSnapshot) return true;

  // Capture if signal changed
  if (lastSnapshot.signal !== currentSignal) return true;

  // Capture if 24+ hours have passed (daily capture)
  const lastCreatedAt = new Date(lastSnapshot.created_at).getTime();
  const hoursSinceLast = (Date.now() - lastCreatedAt) / (1000 * 60 * 60);
  if (hoursSinceLast >= 24) return true;

  return false;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting market collector batch job...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results = {
      processed: 0,
      errors: 0,
      candles_saved: 0,
      snapshots_saved: 0,
      track_record_captured: 0
    };

    for (const symbol of CRYPTO_UNIVERSE) {
      for (const interval of INTERVALS) {
        try {
          // Fetch from Binance
          const limit = interval === '1d' ? 200 : interval === '4h' ? 168 : 100;
          const binanceUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
          
          const response = await fetch(binanceUrl);
          if (!response.ok) {
            console.error(`Binance error for ${symbol} ${interval}:`, response.status);
            results.errors++;
            continue;
          }

          const rawData = await response.json();
          const candles: Candle[] = rawData.map((k: any) => ({
            timestamp: k[0],
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5])
          }));

          // Save candles to DB (upsert last 50 candles)
          const recentCandles = candles.slice(-50);
          for (const candle of recentCandles) {
            await supabase.from('asset_candles').upsert({
              symbol,
              asset_type: 'crypto',
              interval,
              timestamp: candle.timestamp,
              open: candle.open,
              high: candle.high,
              low: candle.low,
              close: candle.close,
              volume: candle.volume
            }, { onConflict: 'symbol,asset_type,interval,timestamp' });
          }
          results.candles_saved += recentCandles.length;

          // Calculate indicators
          const closes = candles.map(c => c.close);
          const ema9 = calculateEMA(closes, 9);
          const ema21 = calculateEMA(closes, 21);
          const ema50 = calculateEMA(closes, 50);
          const ema200 = calculateEMA(closes, 200);
          const rsi = calculateRSI(closes, 14);
          const { macdLine, signal: macdSignal, histogram } = calculateMACD(closes);
          const atr = calculateATR(candles, 14);
          const { supertrend, direction: supertrendDir } = calculateSupertrend(candles, 10, 3);

          const lastIdx = candles.length - 1;
          const currentPrice = candles[lastIdx].close;

          const signal = generateSignal(
            currentPrice,
            ema9[lastIdx],
            ema21[lastIdx],
            ema50[lastIdx],
            rsi[lastIdx],
            macdLine[lastIdx],
            macdSignal[lastIdx],
            supertrendDir[lastIdx]
          );

          // Save live snapshot (overwrites - for real-time display)
          await supabase.from('asset_snapshots').upsert({
            symbol,
            asset_type: 'crypto',
            interval,
            current_price: currentPrice,
            ema_9: ema9[lastIdx],
            ema_21: ema21[lastIdx],
            ema_50: ema50[lastIdx],
            ema_200: ema200[lastIdx],
            rsi: rsi[lastIdx],
            macd: macdLine[lastIdx],
            macd_signal: macdSignal[lastIdx],
            macd_histogram: histogram[lastIdx],
            atr: atr[atr.length - 1],
            supertrend: supertrend[lastIdx],
            supertrend_direction: supertrendDir[lastIdx],
            signal_type: signal.signalType,
            signal_score: signal.score,
            confidence: signal.confidence,
            trend: signal.trend,
            calculated_at: new Date().toISOString()
          }, { onConflict: 'symbol,asset_type,interval' });

          results.snapshots_saved++;

          // ========================================
          // TRACK RECORD: Immutable signal snapshot
          // ========================================
          const shouldCapture = await shouldCaptureSnapshot(
            supabase,
            symbol,
            interval,
            signal.signalType
          );

          if (shouldCapture) {
            const { error: snapshotError } = await supabase
              .from('signal_snapshots')
              .insert({
                symbol,
                asset_type: 'crypto',
                timeframe: interval,
                signal: signal.signalType,
                score: signal.score,
                confidence: signal.confidence,
                price_at_signal: currentPrice
              });

            if (snapshotError) {
              console.error(`Track record error for ${symbol} ${interval}:`, snapshotError);
            } else {
              results.track_record_captured++;
              console.log(`📸 Track record captured: ${symbol} ${interval} = ${signal.signalType}`);
            }
          }

          results.processed++;
          console.log(`✓ Processed ${symbol} ${interval}`);

        } catch (error) {
          console.error(`Error processing ${symbol} ${interval}:`, error);
          results.errors++;
        }
      }
    }

    console.log('Batch collection complete:', results);

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
    console.error('Market collector error:', error);
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
