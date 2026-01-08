import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a concise macro analyst. Generate a ONE sentence market insight (max 25 words) covering:
- Overall risk sentiment (risk-on/risk-off)
- Key cross-asset themes

Be actionable and data-driven. Never use bullet points. Start with the most important insight.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch latest snapshots for key assets
    const { data: snapshots } = await supabase
      .from('asset_snapshots')
      .select('symbol, asset_type, signal_type, rsi, trend, current_price')
      .in('symbol', ['BTCUSDT', 'ETHUSDT', '^GSPC', '^VIX', 'GC=F', 'CL=F'])
      .eq('interval', '1d')
      .order('calculated_at', { ascending: false })
      .limit(6);

    // Build context for AI
    let marketContext = "Current market data:\n";
    
    if (snapshots && snapshots.length > 0) {
      for (const s of snapshots) {
        marketContext += `- ${s.symbol}: ${s.signal_type || 'neutral'}, RSI ${s.rsi?.toFixed(0) || 'N/A'}, trend ${s.trend || 'N/A'}\n`;
      }
    } else {
      marketContext += "No recent data available. Provide a general market outlook.";
    }

    // Call AI gateway
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: marketContext }
        ],
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      // Return fallback insight
      return new Response(JSON.stringify({ 
        insight: "Markets are showing mixed signals across asset classes. Monitor VIX and key support levels." 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    const insight = data.choices?.[0]?.message?.content?.trim() || 
      "Cross-asset analysis in progress. Check individual sectors for detailed signals.";

    return new Response(JSON.stringify({ insight }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in dashboard-insight:', error);
    return new Response(JSON.stringify({ 
      insight: "Market analysis temporarily unavailable. Please check individual asset signals." 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
