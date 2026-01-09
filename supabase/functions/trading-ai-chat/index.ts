import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

/* -------------------- CORS -------------------- */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/* -------------------- SCHEMA -------------------- */

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().max(2000),
      }),
    )
    .min(1)
    .max(20),
});

/* -------------------- LIMITS -------------------- */

const TIER_LIMITS: Record<string, number> = {
  free: 3,
  pro: 50,
  premium: 999,
};

/* -------------------- SYSTEM PROMPT -------------------- */

const SYSTEM_PROMPT = `
You are AlexIA, a professional multi-asset market copilot.

ROLE:
- You analyze financial markets across all asset classes:
  crypto, stocks, ETFs, indices, FX, commodities, and rates.
- You provide concise, factual market insight.

STYLE RULES:
- Maximum 2 sentences per response.
- English only.
- Clear, neutral, institutional tone.

CONTENT RULES:
- Discuss trends, momentum, volatility, indicators, correlations, and sentiment.
- Allowed indicators: RSI, MACD, EMA, SMA, SuperTrend, volatility, dominance, breadth, Fear & Greed.
- NEVER give direct buy/sell or investment advice.
- NEVER predict prices with certainty.

INTENT HANDLING:
- Very short inputs (e.g. "btc", "gold", "sp500") imply:
  "Provide a brief market overview and current technical context."
- Follow-up questions should respect previous context automatically.

DOMAIN RESTRICTION:
- If the user asks about something clearly unrelated to financial markets,
  reply exactly:
  "I only discuss financial market data and indicators."
`;

/* -------------------- HELPERS -------------------- */

function normalizeUserMessages(messages: { role: string; content: string }[]) {
  return messages.map((msg) => {
    if (msg.role !== "user") return msg;

    const text = msg.content.trim();

    // Very short / ticker-like input
    if (text.length <= 8 && /^[a-zA-Z0-9.\- ]+$/.test(text)) {
      return {
        ...msg,
        content: `Give a brief technical and market overview for ${text}, including trend and momentum.`,
      };
    }

    return msg;
  });
}

/* -------------------- SERVER -------------------- */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    /* -------- AUTH -------- */

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    /* -------- BODY -------- */

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400, headers: corsHeaders });
    }

    let { messages } = parsed.data;

    /* -------- RATE LIMIT -------- */

    const { data: sub } = await supabase.from("user_subscriptions").select("tier").eq("user_id", user.id).single();

    const tier = sub?.tier || "free";
    const limit = TIER_LIMITS[tier];

    const today = new Date().toISOString().split("T")[0];

    const { data: usage } = await supabase
      .from("user_ai_usage")
      .select("message_count")
      .eq("user_id", user.id)
      .eq("date", today)
      .single();

    const count = usage?.message_count || 0;

    if (count >= limit) {
      return new Response(JSON.stringify({ error: "Daily limit reached" }), { status: 429, headers: corsHeaders });
    }

    await supabase.from("user_ai_usage").upsert({
      user_id: user.id,
      date: today,
      message_count: count + 1,
    });

    /* -------- NORMALIZE INPUT -------- */

    messages = normalizeUserMessages(messages);

    /* -------- AI CALL -------- */

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "AI service error" }), { status: 500, headers: corsHeaders });
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
      },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: corsHeaders });
  }
});
