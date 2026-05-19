import { gatewayFetch, type PaddleEnv } from '../_shared/paddle.ts';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

async function resolvePaddlePrice(priceId: string, environment: PaddleEnv): Promise<string> {
  const response = await gatewayFetch(environment, `/prices?external_id=${encodeURIComponent(priceId)}`);
  const data = await response.json();
  if (!data.data?.length) throw new Error(`Price not found: ${priceId}`);
  return data.data[0].id;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Require authentication to prevent unauthenticated abuse of the Paddle API
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { priceId, environment } = await req.json();
    if (!priceId || typeof priceId !== 'string') {
      return new Response(JSON.stringify({ error: 'priceId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // Strictly validate environment to prevent toggling to live with arbitrary values
    if (environment !== 'sandbox' && environment !== 'live') {
      return new Response(JSON.stringify({ error: 'environment must be "sandbox" or "live"' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const paddleId = await resolvePaddlePrice(priceId, environment as PaddleEnv);
    return new Response(JSON.stringify({ paddleId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('get-paddle-price error:', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
