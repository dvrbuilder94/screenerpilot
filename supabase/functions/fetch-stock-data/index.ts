import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema - supports stocks, ETFs, indices (^), and commodities (=F)
const requestSchema = z.object({
  symbol: z.string()
    .min(1, 'Symbol required')
    .max(20, 'Symbol too long')
    .regex(/^[\^]?[A-Za-z0-9\.\-]+(=F|USDT)?$/, 'Invalid symbol format'),
  interval: z.enum(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'], {
    errorMap: () => ({ message: 'Invalid interval' })
  })
});

// IP-based rate limiter (100 requests per hour per IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100;
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (record && now > record.resetTime) {
    rateLimitMap.delete(ip);
  }
  
  const current = rateLimitMap.get(ip);
  
  if (!current) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }
  
  if (current.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  
  current.count++;
  return { allowed: true, remaining: RATE_LIMIT - current.count };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // IP-based rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const rateLimit = checkRateLimit(ip);
    
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for IP: ${ip}`);
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": "0"
          } 
        }
      );
    }

    // Validate input
    const body = await req.json();
    const validationResult = requestSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error);
      return new Response(JSON.stringify({ 
        error: 'Invalid request parameters'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { symbol, interval } = validationResult.data;

    console.log(`Fetching data for ${symbol} with interval ${interval}`);

    // Map intervals to Yahoo Finance format
    const intervalMap: Record<string, { range: string; granularity: string }> = {
      '1m': { range: '1d', granularity: '1m' },
      '5m': { range: '5d', granularity: '5m' },
      '15m': { range: '5d', granularity: '15m' },
      '30m': { range: '1mo', granularity: '30m' },
      '1h': { range: '1mo', granularity: '1h' },
      '4h': { range: '3mo', granularity: '1d' },
      '1d': { range: '2y', granularity: '1d' },
      '1w': { range: '5y', granularity: '1wk' },
      '1M': { range: '10y', granularity: '1mo' },
    };

    const { range, granularity } = intervalMap[interval];
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${granularity}`;
    
    console.log(`Yahoo Finance URL: ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`Yahoo Finance error: ${response.status} ${response.statusText}`);
        return new Response(
          JSON.stringify({ error: `Yahoo Finance API error: ${response.status}` }), 
          { 
            status: response.status, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const data = await response.json();
      
      if (!data.chart?.result?.[0]) {
        console.error('Invalid Yahoo Finance response structure');
        return new Response(
          JSON.stringify({ error: 'Invalid response from Yahoo Finance' }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const result = data.chart.result[0];
      
      if (!result.timestamp || !result.indicators?.quote?.[0]) {
        console.error('Missing data in Yahoo Finance response');
        return new Response(
          JSON.stringify({ error: 'Incomplete data from Yahoo Finance' }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const timestamps = result.timestamp;
      const quotes = result.indicators.quote[0];
      
      // Transform to our Candle format
      const candles = timestamps
        .map((time: number, i: number) => ({
          openTime: time * 1000,
          open: quotes.open[i] || 0,
          high: quotes.high[i] || 0,
          low: quotes.low[i] || 0,
          close: quotes.close[i] || 0,
          volume: quotes.volume[i] || 0,
          closeTime: time * 1000 + 60000,
        }))
        .filter((c: any) => c.close > 0);

      console.log(`Successfully fetched ${candles.length} candles for ${symbol}`);

      return new Response(
        JSON.stringify(candles), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error(`Request timeout for ${symbol}`);
        return new Response(
          JSON.stringify({ error: 'Request timeout - Yahoo Finance took too long to respond' }), 
          { 
            status: 504, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Error in fetch-stock-data function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
