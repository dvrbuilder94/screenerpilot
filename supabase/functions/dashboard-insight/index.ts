import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `
You are a senior macro strategist writing a professional market brief.

Generate a macro market insight with a MAXIMUM of FOUR short lines.

Requirements:
- Mention stocks, commodities, and crypto explicitly
- Clearly describe overall risk sentiment (risk-on or risk-off)
- Reference volatility conditions (VIX)
- Include the Fed stance or monetary policy expectations
- Mention at least one important macro or market event from this week or the coming days
- Professional, neutral tone, no investment advice
- No bullet points

Each line must add new information and flow logically.
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    /* -----------------------------
       1️⃣ FETCH LATEST ASSET DATA
    ------------------------------*/
    const { data: snapshots } = await supabase
      .from("asset_snapshots")
      .select("symbol, signal_type, rsi, trend")
      .in("symbol", ["BTCUSDT", "ETHUSDT", "^GSPC", "^VIX", "GC=F", "CL=F"])
      .eq("interval", "1d")
      .order("calculated_at", { ascending: false });

    /* -----------------------------
       2️⃣ FETCH WEEKLY MACRO EVENTS
    ------------------------------*/
    const { data: events } = await supabase
      .from("macro_events")
      .select("title, category, impact")
      .gte("event_date", new Date(Date.now() - 7 * 86400000).toISOString())
      .order("impact", { ascending: false })
      .limit(3);

    /* -----------------------------
       3️⃣ BUILD STRUCTURED CONTEXT
    ------------------------------*/
    let marketContext = "Cross-asset market signals:\n";

    if (snapshots && snapshots.length > 0) {
      for (const s of snapshots) {
        marketContext += `${s.symbol}: ${s.signal_type || "neutral"}, trend ${s.trend || "flat"}, RSI ${Math.round(s.rsi ?? 0)}.\n`;
      }
    } else {
      marketContext += "Limited price signals available.\n";
    }

    marketContext += "\nMacro policy & events:\n";

    if (events && events.length > 0) {
      for (const e of events) {
        marketContext += `${e.category}: ${e.title} (${e.impact} impact).\n`;
      }
    } else {
      marketContext += "No major macro events scheduled.\n";
    }

    /* -----------------------------
       4️⃣ AI SYNTHESIS
    ------------------------------*/
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.35,
        max_tokens: 180,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: marketContext },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("AI gateway error");
    }

    const data = await response.json();

    const insight =
      data.choices?.[0]?.message?.content
        ?.replace(/\r/g, "")
        ?.split("\n")
        .filter(Boolean)
        .slice(0, 4)
        .join("\n")
        .trim() ??
      "Risk sentiment remains mixed as markets assess Fed expectations, elevated volatility, and upcoming macro events.";

    return new Response(JSON.stringify({ insight }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("dashboard-insight error:", error);
    return new Response(
      JSON.stringify({
        insight:
          "Macro conditions remain uncertain as investors monitor Fed guidance, volatility trends, and key economic events this week.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
