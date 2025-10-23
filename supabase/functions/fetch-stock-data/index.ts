import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, interval } = await req.json();
    
    if (!symbol || !interval) {
      return new Response(
        JSON.stringify({ error: 'Missing symbol or interval' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Fetching data for ${symbol} with interval ${interval}`);

    // Map intervals to Yahoo Finance format
    const intervalMap: Record<string, { range: string; granularity: string }> = {
      '1h': { range: '1mo', granularity: '1h' },
      '4h': { range: '3mo', granularity: '1d' }, // Yahoo doesn't have 4h, use 1d
      '1d': { range: '2y', granularity: '1d' },
      '1w': { range: '5y', granularity: '1wk' },
    };

    const { range, granularity } = intervalMap[interval] || intervalMap['1d'];
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${granularity}`;
    
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
      .filter((c: any) => c.close > 0); // Filter invalid candles

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
