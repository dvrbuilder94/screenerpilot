import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `
You are a senior macro strategist at an institutional trading desk.

Generate ONE concise weekly macro insight (max 25 words).
Requirements:
- Clearly state risk-on or risk-off
- Integrate crypto, equities, commodities, volatility
- Reference Fed stance or major macro events if relevant
- Mention key upcoming or recent events only if impactful
- Professional, neutral, no investment advice
- No bullet points, one sentence only
Start with the most important macro takeaway.
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    /* -------------------------------
       1️⃣ FETCH LATEST ASSET SNAPSHOTS
    --------------------------------*/
    const { data: assets } = await supabase
      .from("asset_snapshots")
      .select("symbol, signal_type, rsi, trend")
      .in("symbol", ["BTCUSDT", "ETHUSDT", "^GSPC", "^VIX", "GC=F", "CL=F"])
      .eq("interval", "1d")
      .order("calculated_at", { ascending: false });

    /* -------------------------------
       2️⃣ FETCH IMPORTANT MACRO EVENTS
    --------------------------------*/
    const { data: events } = await supabase
      .from("macro_events")
      .select("title, category, impact")
      .gte("event_date", new Date(Date.now() - 7 * 86400000).toISOString())
      .order("impact", { ascending: false })
      .limit(5);

    /* -------------------------------
       3️⃣ BUILD STRUCTURED CONTEXT
    --------------------------------*/
    let context = "Cross-asset signals:\n";

    if (assets && assets.length > 0) {
      for (const a of assets) {
        context += `${a.symbol}: ${a.signal_type || "neutral"}, trend ${a.trend || "flat"}, RSI ${Math.round(a.rsi ?? 0)}.\n`;
      }
    }

    context += "\nMacro & policy context:\n";

    if (events && events.length > 0) {
      for (const e of events) {
        context += `${e.category} event: ${e.title} (${e.impact} impact).\n`;
      }
    } else {
      context += "No major scheduled macro events.\n";
    }

    /* -------------------------------
       4️⃣ AI SYNTHESIS
    --------------------------------*/
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.4,
        max_tokens: 80,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: context },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const insight =
      data.choices?.[0]?.message?.content?.replace(/\n/g, " ")?.trim()?.slice(0, 200) ??
      "Risk sentiment remains mixed as markets digest macro data and policy signals.";

    return new Response(JSON.stringify({ insight }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({
        insight:
          "Macro visibility remains limited as markets await clearer signals from policy and upcoming economic events.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
