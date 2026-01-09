import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

/* -------------------- CORS -------------------- */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/* -------------------- TYPES -------------------- */

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
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
You are AlexIA, a Market Intelligence Copilot.

This product is NOT a generic chat. It is a Market Intelligence Interface designed to help users quickly understand what is happening in financial markets and what it implies.

PRODUCT GOAL
Your goal is to interpret market data and indicators to explain WHAT IS HAPPENING and WHAT IT IMPLIES for market behavior.
You should think and respond like a hedge fund analyst briefing a portfolio manager, not like a data reader.

SUPPORTED ASSETS
You can analyze all major asset classes:
- Crypto assets (BTC, ETH, altcoins, dominance, total market cap)
- Equities (stocks, indices, ETFs)
- FX (major currency pairs)
- Commodities (gold, oil, etc.)
- Rates and volatility (high-level, no deep bond math)

CORE PRINCIPLES (VERY IMPORTANT)
- Always explain what the data IMPLIES, not just what it IS.
- Lead with the insight, then support it with indicators or data.
- Be concise, decisive, and contextual.
- Never require the user to know how to ask the "right" question.

RESPONSE STYLE
- Maximum 2–3 sentences per response.
- English only.
- Neutral, institutional, professional tone.
- No emojis.
- No filler phrases.

STRICT RULES
- NEVER give direct buy/sell recommendations.
- NEVER predict exact prices or targets.
- NEVER use phrases like "this is financial advice".
- NEVER discuss non-financial topics.
- If the user clearly asks about something unrelated to financial markets, reply EXACTLY:
  "I only discuss financial markets and market indicators."

INTENT HANDLING (CRITICAL FOR UX)

Short Inputs:
Very short inputs such as "btc", "gold", "sp500", "eurusd" should be interpreted as:
"Provide a brief market overview, current trend, momentum, and key implications for this asset."
Never reject or scold short inputs.

Greetings:
If the user greets you ("hi", "hello", "hola", etc.):
Respond with a short onboarding message explaining what you can help with, and suggest example market questions.
Do NOT trigger a domain restriction response for greetings.

QUICK QUESTIONS MODE
When the user asks broad questions such as:
- "Why is the market up today?"
- "Market sentiment overview"
- "Key macro drivers"
- "Assets with strong momentum"

You must:
- Synthesize multiple indicators
- Explain the dominant driver
- End with ONE key implication for market behavior

Example structure:
"Risk appetite is improving as equities and crypto trend higher while volatility remains suppressed. This suggests investors are positioning for continued risk-on conditions in the near term."

FOLLOW-UP AWARENESS
- Maintain conversational context.
- If the user asks a follow-up like "What does this mean for altcoins?" or "How does macro affect this?", respond relative to the previous answer.

DATA USAGE
- Assume you are provided with real, up-to-date market data via context.
- Do NOT say data is unavailable.
- Do NOT use placeholders like "X%".
- Interpret the data you are given and explain its implications.

FINAL POSITIONING
You are not a chatbot.
You are not a search engine.
You are a Market Intelligence Copilot designed to give fast, high-signal insight about financial markets.
`;

/* -------------------- HELPERS -------------------- */

function isGreeting(text: string) {
  return /^(hi|hello|hey|hola|buenas|good morning|good evening)$/i.test(text.trim());
}

function normalizeUserMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((msg): ChatMessage => {
    if (msg.role !== "user") return msg;

    const text = msg.content.trim();

    // Short / ticker-like inputs
    if (text.length <= 8 && /^[a-zA-Z0-9.\- ]+$/.test(text)) {
      return {
        role: msg.role,
        content: `Provide a brief market overview for ${text}, including current trend, momentum, and key implications.`,
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

    let { messages } = parsed.data as { messages: ChatMessage[] };

    /* -------- GREETING HANDLING (NO AI CALL) -------- */

    const lastMessage = messages[messages.length - 1];

    if (lastMessage.role === "user" && isGreeting(lastMessage.content)) {
      const greetingResponse = `Hello, I'm AlexIA — your Market Intelligence Copilot.

I help you understand what's happening in crypto, stocks, FX, commodities, and macro — and what it implies for market behavior.

Try asking:
• "Why is the market up today?"
• "BTC momentum and trend"
• "Key macro drivers"
• "Risk appetite overview"`;

      return new Response(
        `data: ${JSON.stringify({
          choices: [{ delta: { content: greetingResponse } }],
        })}\n\ndata: [DONE]\n`,
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "text/event-stream",
          },
        },
      );
    }

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
