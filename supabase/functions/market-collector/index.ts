import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// ASSET UNIVERSES FOR TRACK RECORD
// ============================================

// Crypto (Binance API)
const CRYPTO_UNIVERSE = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 
  'ADAUSDT', 'DOGEUSDT', 'MATICUSDT', 'DOTUSDT', 'LINKUSDT',
  'AVAXUSDT', 'UNIUSDT', 'ATOMUSDT', 'NEARUSDT', 'APTUSDT',
  'ARBUSDT', 'OPUSDT', 'INJUSDT', 'SUIUSDT', 'TAOUSDT'
];

// Stocks (Yahoo Finance) - Top traded + missing tickers restored
const STOCK_UNIVERSE = [
  'AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'TSLA', 'AVGO', 'BRK-B', 'LLY',
  'V', 'UNH', 'XOM', 'WMT', 'JNJ', 'ORCL', 'COST', 'MA', 'PG', 'NFLX',
  'JPM', 'BAC', 'GS', 'AMD', 'INTC', 'QCOM', 'CRM', 'ADBE', 'CSCO', 'PEP',
  'FIGS', 'XPEV', 'RIVN', 'SOFI', 'ENPH', 'SEDG', 'WDC'
];

// ETFs (Yahoo Finance) - Including BlackRock iShares
const ETF_UNIVERSE = [
  'SPY', 'IWM', 'QQQ', 'DIA', 'XLF', 'XLE', 'XLK',
  'IVV', 'IEFA', 'AGG', 'IJH', 'IJR', 'EFA', 'EEM',
  'IWF', 'IWD', 'LQD', 'HYG', 'TIP', 'IWB', 'IWN', 'IWO',
  'IEMG', 'ITOT', 'IXUS', 'SHY', 'TLT', 'GLD', 'SLV'
];

// Indices (Yahoo Finance)
const INDEX_UNIVERSE = ['^GSPC', '^NDX', '^RUT', '^DJI', '^VIX'];

// Commodities (Yahoo Finance)
const COMMODITY_UNIVERSE = ['GC=F', 'SI=F', 'CL=F', 'NG=F', 'PL=F', 'HG=F', 'PA=F'];

const INTERVALS = ['5m', '15m', '1h', '4h', '1d'];

interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface AssetConfig {
  symbol: string;
  type: 'crypto' | 'stock' | 'etf' | 'index' | 'commodity';
  source: 'binance' | 'yahoo';
}

// Build unified asset list
function buildAssetList(): AssetConfig[] {
  return [
    ...CRYPTO_UNIVERSE.map(s => ({ symbol: s, type: 'crypto' as const, source: 'binance' as const })),
    ...STOCK_UNIVERSE.map(s => ({ symbol: s, type: 'stock' as const, source: 'yahoo' as const })),
    ...ETF_UNIVERSE.map(s => ({ symbol: s, type: 'etf' as const, source: 'yahoo' as const })),
    ...INDEX_UNIVERSE.map(s => ({ symbol: s, type: 'index' as const, source: 'yahoo' as const })),
    ...COMMODITY_UNIVERSE.map(s => ({ symbol: s, type: 'commodity' as const, source: 'yahoo' as const })),
  ];
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

// Fetch data from Binance (crypto)
async function fetchBinanceData(symbol: string, interval: string, limit: number): Promise<Candle[] | null> {
  try {
    const binanceUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const response = await fetch(binanceUrl);
    if (!response.ok) return null;

    const rawData = await response.json();
    return rawData.map((k: any) => ({
      timestamp: k[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5])
    }));
  } catch {
    return null;
  }
}

// Map interval to Yahoo Finance range/interval
function getYahooParams(interval: string): { range: string; yahooInterval: string } {
  switch (interval) {
    case '5m': return { range: '1d', yahooInterval: '5m' };
    case '15m': return { range: '5d', yahooInterval: '15m' };
    case '1h': return { range: '1mo', yahooInterval: '1h' };
    case '4h': return { range: '3mo', yahooInterval: '1d' }; // Yahoo doesn't support 4h, use 1d as proxy
    case '1d': return { range: '1y', yahooInterval: '1d' };
    default: return { range: '1mo', yahooInterval: '1d' };
  }
}

// Fetch data from Yahoo Finance (stocks, ETFs, indices, commodities)
async function fetchYahooData(symbol: string, interval: string): Promise<Candle[] | null> {
  try {
    // Only fetch daily data for non-crypto to reduce API calls
    if (interval !== '1d') return null;

    const { range, yahooInterval } = getYahooParams(interval);
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${yahooInterval}`;
    
    const response = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) return null;

    const data = await response.json();
    const result = data.chart?.result?.[0];
    if (!result?.timestamp || !result?.indicators?.quote?.[0]) return null;

    const quotes = result.indicators.quote[0];
    const timestamps = result.timestamp;

    const candles: Candle[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (quotes.open[i] != null && quotes.close[i] != null) {
        candles.push({
          timestamp: timestamps[i] * 1000,
          open: quotes.open[i],
          high: quotes.high[i],
          low: quotes.low[i],
          close: quotes.close[i],
          volume: quotes.volume[i] || 0
        });
      }
    }

    return candles.length > 50 ? candles : null;
  } catch {
    return null;
  }
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
      track_record_captured: 0,
      by_type: {
        crypto: 0,
        stock: 0,
        etf: 0,
        index: 0,
        commodity: 0
      }
    };

    const allAssets = buildAssetList();

    for (const asset of allAssets) {
      // For non-crypto, only process daily (1d) to reduce API calls
      const intervals = asset.source === 'binance' ? INTERVALS : ['1d'];

      for (const interval of intervals) {
        try {
          let candles: Candle[] | null = null;

          // Fetch data from appropriate source
          if (asset.source === 'binance') {
            const limit = interval === '1d' ? 200 : interval === '4h' ? 168 : 100;
            candles = await fetchBinanceData(asset.symbol, interval, limit);
          } else {
            candles = await fetchYahooData(asset.symbol, interval);
          }

          if (!candles || candles.length < 50) {
            console.log(`Skipping ${asset.symbol} ${interval}: insufficient data`);
            continue;
          }

          // Save candles to DB (upsert last 50 candles)
          const recentCandles = candles.slice(-50);
          for (const candle of recentCandles) {
            await supabase.from('asset_candles').upsert({
              symbol: asset.symbol,
              asset_type: asset.type,
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
            symbol: asset.symbol,
            asset_type: asset.type,
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
          // DAILY (1d) SIGNALS ONLY - All asset types
          // ========================================
          if (interval === '1d') {
            const shouldCapture = await shouldCaptureSnapshot(
              supabase,
              asset.symbol,
              interval,
              signal.signalType
            );

            if (shouldCapture) {
              const { error: snapshotError } = await supabase
                .from('signal_snapshots')
                .insert({
                  symbol: asset.symbol,
                  asset_type: asset.type,
                  timeframe: interval,
                  signal: signal.signalType,
                  score: signal.score,
                  confidence: signal.confidence,
                  price_at_signal: currentPrice
                });

              if (snapshotError) {
                console.error(`Track record error for ${asset.symbol} ${interval}:`, snapshotError);
              } else {
                results.track_record_captured++;
                results.by_type[asset.type]++;
                console.log(`📸 Track record captured: ${asset.symbol} [${asset.type}] ${interval} = ${signal.signalType}`);
              }
            }
          }

          results.processed++;
          console.log(`✓ Processed ${asset.symbol} [${asset.type}] ${interval}`);

        } catch (error) {
          console.error(`Error processing ${asset.symbol} ${interval}:`, error);
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
