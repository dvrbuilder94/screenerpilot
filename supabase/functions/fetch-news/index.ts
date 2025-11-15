import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapping of crypto symbols to their full names to avoid stock ticker conflicts
const CRYPTO_SYMBOL_MAP: Record<string, string> = {
  'BTC': 'Bitcoin',
  'ETH': 'Ethereum',
  'BNB': 'Binance Coin',
  'SOL': 'Solana',
  'ADA': 'Cardano',
  'XRP': 'Ripple',
  'DOT': 'Polkadot',
  'DOGE': 'Dogecoin',
  'AVAX': 'Avalanche',
  'MATIC': 'Polygon',
  'LINK': 'Chainlink',
  'UNI': 'Uniswap',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();
    
    if (!symbol) {
      throw new Error('Symbol is required');
    }

    const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY');
    
    if (!NEWS_API_KEY) {
      console.log('No NEWS_API_KEY found, returning mock data');
      return new Response(
        JSON.stringify({
          articles: [
            {
              title: "Market Analysis for " + symbol,
              description: "Configure NEWS_API_KEY in Lovable Cloud secrets to see real news",
              url: "https://marketaux.com",
              publishedAt: new Date().toISOString(),
              source: { name: "Market News" }
            }
          ]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean the symbol for API request
    let cleanSymbol = symbol.replace(/USDT$/, '').replace(/^[\^]/, '');
    const isCrypto = symbol.endsWith('USDT');
    
    // Build Marketaux API URL
    const url = new URL('https://api.marketaux.com/v1/news/all');
    
    // Use full name for crypto symbols to avoid stock ticker conflicts (e.g., ETH = Ethan Allen stock)
    if (isCrypto && CRYPTO_SYMBOL_MAP[cleanSymbol]) {
      url.searchParams.append('search', CRYPTO_SYMBOL_MAP[cleanSymbol]);
      console.log('Fetching news from Marketaux for crypto:', CRYPTO_SYMBOL_MAP[cleanSymbol]);
    } else {
      url.searchParams.append('symbols', cleanSymbol);
      console.log('Fetching news from Marketaux for symbol:', cleanSymbol);
    }
    
    url.searchParams.append('filter_entities', 'true');
    url.searchParams.append('language', 'en');
    url.searchParams.append('limit', '5');
    url.searchParams.append('api_token', NEWS_API_KEY);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Marketaux API error:', errorText);
      throw new Error(`Marketaux API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Marketaux response:', JSON.stringify(data).substring(0, 200));

    // Transform Marketaux response to match our component expectations
    const articles = (data.data || []).map((article: any) => ({
      title: article.title,
      description: article.description || article.snippet,
      url: article.url,
      publishedAt: article.published_at,
      source: { 
        name: article.entities?.[0]?.name || article.source || 'Market News' 
      }
    }));

    return new Response(
      JSON.stringify({ articles }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-news function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        articles: [] 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
