import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const requestSchema = z.object({
  question: z.string().trim().min(1).max(500),
  context: z.object({
    regime: z.string().optional(),
    fearGreed: z.number().optional(),
    vix: z.number().optional(),
    spy_1d: z.number().optional(),
    btc_1d: z.number().optional(),
    topMovers: z.array(z.object({
      symbol: z.string(),
      change_pct: z.number(),
    })).max(10).optional(),
    sectors: z.array(z.object({
      name: z.string(),
      change_pct: z.number(),
    })).max(12).optional(),
  }).optional(),
});

const agentSchema = z.object({
  bias: z.enum(["bullish", "neutral", "bearish"]),
  confidence: z.number().min(0).max(100),
  thesis: z.string(),
  evidence: z.array(z.string()).max(3),
});

const responseSchema = z.object({
  macro: agentSchema,
  momentum: agentSchema,
  quant: agentSchema,
  summary: z.string(),
});

const SYSTEM_PROMPT = `You are the AI Market Intelligence Committee — three specialized hedge fund analysts responding to a market question in unison.

You will be given:
- The user's question
- A snapshot of real-time market context (regime, fear/greed, VIX, top movers, sector performance)

You MUST respond in valid JSON matching this exact shape:
{
  "macro": { "bias": "bullish|neutral|bearish", "confidence": 0-100, "thesis": "1-2 sentences", "evidence": ["short data point", ...] },
  "momentum": { "bias": "bullish|neutral|bearish", "confidence": 0-100, "thesis": "1-2 sentences", "evidence": ["short data point", ...] },
  "quant": { "bias": "bullish|neutral|bearish", "confidence": 0-100, "thesis": "1-2 sentences", "evidence": ["short data point", ...] },
  "summary": "1 sentence committee consensus"
}

AGENT PERSONAS:
- MACRO AGENT: institutional macro strategist. Focus on rates, inflation, dollar, Fed policy, global liquidity, commodities cycle.
- MOMENTUM AGENT: tactical trader. Focus on trend, breakouts, relative strength, volume, momentum exhaustion, squeeze setups.
- QUANT AGENT: quant analyst. Focus on volatility regimes, factor performance, correlations, statistical anomalies, positioning.

RULES:
- Ground every claim in the provided context when possible. If context is missing, say so briefly.
- NEVER give direct buy/sell advice or price targets.
- NEVER say "this is financial advice".
- Thesis: 1-2 sentences max, institutional tone, no emojis, no filler.
- Evidence: 1-3 short data-driven bullets per agent.
- Confidence reflects strength of signal, not certainty of outcome.
- Agents may disagree — that's the point. Do not force consensus.
- Summary: 1 neutral sentence capturing the committee's net view.

QUERY INTERPRETATION (CRITICAL):
- Users write messy, casual, multilingual (Spanish/English) prompts. Interpret intent generously.
- Tolerate typos and partial words. Map likely company names to tickers (e.g. "nvidi"/"nvidia" -> NVDA, "tesla" -> TSLA, "apple" -> AAPL, "microsoft" -> MSFT, "amazon" -> AMZN, "google" -> GOOGL, "meta"/"facebook" -> META, "btc"/"bitcoin" -> BTC, "eth" -> ETH, "spy"/"s&p" -> SPY, "qqq"/"nasdaq" -> QQQ, "oro"/"gold" -> GLD, "dolar"/"dxy" -> DXY).
- Casual prompts like "tesla?", "nvda long term", "invertir en nvidi?", "btc sigue fuerte?", "hay riesgo de crash?", "como ven el mercado?", "qqq o spy?", "dolar?" are ALL valid — interpret them as serious market questions and analyze.
- If a ticker/topic is ambiguous, pick the most likely interpretation and proceed. You may mention the inference briefly in the thesis (e.g. "Interpreting as Nvidia (NVDA)…").
- Respond in the SAME language as the user's question (Spanish in -> Spanish out, English in -> English out).

ONLY mark as out-of-scope (all agents neutral, confidence 0, thesis "Out of scope — committee only analyzes financial markets.") when the prompt is CLEARLY unrelated to markets/finance/economy/companies/crypto/commodities (e.g. recipes, personal chat, code help, unsafe content). When in doubt, ANALYZE.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Premium gate: must have active subscription
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status, current_period_end, environment")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const now = Date.now();
    const periodEnd = sub?.current_period_end ? new Date(sub.current_period_end).getTime() : null;
    const isActive = !!sub && (
      (["active", "trialing", "past_due"].includes(sub.status) && (!periodEnd || periodEnd > now)) ||
      (sub.status === "canceled" && periodEnd && periodEnd > now)
    );

    if (!isActive) {
      return new Response(JSON.stringify({ error: "Premium subscription required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Daily rate limit: 10 queries/day
    const today = new Date().toISOString().split("T")[0];
    const { data: usage } = await supabase
      .from("user_ai_usage")
      .select("message_count")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();

    const count = usage?.message_count || 0;
    if (count >= 10) {
      return new Response(JSON.stringify({ error: "Daily limit reached (10 queries/day)" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { question, context } = parsed.data;

    const userPrompt = `MARKET CONTEXT (real-time snapshot):
${context ? JSON.stringify(context, null, 2) : "No context available."}

USER QUESTION:
${question}

Respond as the committee in the exact JSON schema specified.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      const text = await aiResp.text();
      console.error("AI gateway error", aiResp.status, text);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit, retry shortly" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const rawContent = aiJson.choices?.[0]?.message?.content;
    if (!rawContent) {
      return new Response(JSON.stringify({ error: "Empty AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let committee;
    try {
      committee = responseSchema.parse(JSON.parse(rawContent));
    } catch (err) {
      console.error("Schema validation failed", err, rawContent);
      return new Response(JSON.stringify({ error: "Invalid committee response shape" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Track usage + persist query
    await supabase.from("user_ai_usage").upsert({
      user_id: user.id,
      date: today,
      message_count: count + 1,
    });

    await supabase.from("committee_queries").insert({
      user_id: user.id,
      question,
      response: committee,
      market_context: context || null,
    });

    return new Response(JSON.stringify(committee), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("committee-analysis error", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
