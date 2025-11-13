import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();
    
    if (!symbol) {
      return new Response(
        JSON.stringify({ error: 'Symbol is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Using NewsAPI.org - free tier allows 100 requests per day
    const apiKey = Deno.env.get('NEWS_API_KEY');
    
    if (!apiKey) {
      console.log('No NEWS_API_KEY found, returning mock data');
      // Return mock data if no API key is configured
      return new Response(
        JSON.stringify({
          articles: [
            {
              title: `${symbol} Market Update`,
              description: 'Configure NEWS_API_KEY to see real news articles',
              url: '#',
              publishedAt: new Date().toISOString(),
              source: { name: 'Demo' }
            }
          ]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean symbol for search (remove special characters)
    const searchSymbol = symbol.replace(/[\^-]/g, '');
    
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchSymbol)}&sortBy=publishedAt&language=en&pageSize=5&apiKey=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('NewsAPI error:', data);
      return new Response(
        JSON.stringify({ error: data.message || 'Failed to fetch news' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-news:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
