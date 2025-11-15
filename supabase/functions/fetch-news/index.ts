import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    .regex(/^[\^]?[A-Z0-9\-]+(?:USDT)?$/, 'Invalid symbol format')
});

// Mapping of crypto symbols to their full names
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

// Rate limiting per tier (requests per hour)
const TIER_LIMITS = {
  free: 20,
  pro: 200,
  premium: 1000
};

async function checkAndIncrementRateLimit(
  supabase: any,
  userId: string,
  tier: string,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number }> {
  const limit = TIER_LIMITS[tier as keyof typeof TIER_LIMITS] || TIER_LIMITS.free;
  const windowStart = new Date();
  windowStart.setMinutes(0, 0, 0);

  const { data: usage } = await supabase
    .from('api_usage')
    .select('*')
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .gte('window_start', windowStart.toISOString())
    .maybeSingle();

  const currentCount = usage?.request_count || 0;

  if (currentCount >= limit) {
    return { allowed: false, remaining: 0 };
  }

  await supabase.from('api_usage').upsert({
    user_id: userId,
    endpoint,
    window_start: windowStart.toISOString(),
    request_count: currentCount + 1
  }, {
    onConflict: 'user_id,endpoint,window_start'
  });

  return { allowed: true, remaining: limit - currentCount - 1 };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Optional authentication - allow both authenticated and anonymous access
    const authHeader = req.headers.get('authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let user = null;
    let tier = 'free';

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: authenticatedUser }, error: authError } = await supabase.auth.getUser(token);
      
      if (!authError && authenticatedUser) {
        user = authenticatedUser;
        
        // Get user tier if authenticated
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('tier')
          .eq('user_id', user.id)
          .single();
        
        tier = subscription?.tier || 'free';
      }
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

    const { symbol } = validationResult.data;

    // Check rate limit only for authenticated users
    let rateLimitCheck = { allowed: true, remaining: 999 };
    
    if (user) {
      rateLimitCheck = await checkAndIncrementRateLimit(supabase, user.id, tier, 'fetch-news');
    }

    if (!rateLimitCheck.allowed) {
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded. Upgrade to Pro for more requests.',
        tier,
        remaining: 0
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY');
    
    if (!NEWS_API_KEY) {
      console.log('No NEWS_API_KEY found, returning mock data');
      return new Response(
        JSON.stringify({
          articles: [
            {
              title: "Market Analysis for " + symbol,
              description: "Configure NEWS_API_KEY in secrets to see real news",
              url: "https://marketaux.com",
              publishedAt: new Date().toISOString(),
              source: { name: "Market News" }
            }
          ]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean the symbol
    let cleanSymbol = symbol.replace(/USDT$/, '').replace(/^[\^]/, '');
    const isCrypto = symbol.endsWith('USDT');
    
    // Build Marketaux API URL
    const url = new URL('https://api.marketaux.com/v1/news/all');
    
    if (isCrypto && CRYPTO_SYMBOL_MAP[cleanSymbol]) {
      url.searchParams.append('search', CRYPTO_SYMBOL_MAP[cleanSymbol]);
      console.log('Fetching news for crypto:', CRYPTO_SYMBOL_MAP[cleanSymbol]);
    } else {
      url.searchParams.append('symbols', cleanSymbol);
      console.log('Fetching news for symbol:', cleanSymbol);
    }
    
    url.searchParams.append('filter_entities', 'true');
    url.searchParams.append('language', 'en');
    url.searchParams.append('limit', '5');
    url.searchParams.append('api_token', NEWS_API_KEY);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Marketaux API error:', errorText);
      throw new Error(`Marketaux API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Marketaux response received');

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
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Rate-Limit-Remaining': rateLimitCheck.remaining.toString()
        } 
      }
    );

  } catch (error) {
    console.error('Error in fetch-news:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        articles: [] 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
