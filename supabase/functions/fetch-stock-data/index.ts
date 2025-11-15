import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const requestSchema = z.object({
  symbol: z.string()
    .min(1, 'Symbol required')
    .max(20, 'Symbol too long')
    .regex(/^[\^]?[A-Z0-9]+(?:USDT)?$/, 'Invalid symbol format'),
  interval: z.enum(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'], {
    errorMap: () => ({ message: 'Invalid interval' })
  })
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate input
    const body = await req.json();
    const validationResult = requestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(JSON.stringify({ 
        error: 'Invalid input', 
        details: validationResult.error.issues 
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

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

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
