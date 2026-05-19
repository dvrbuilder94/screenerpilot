import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are BEN, a hedge-fund-style market analyst embedded in a Bloomberg-like terminal.
The user is looking at a specific market panel and clicked an inline "Ask AI" chip on a one-line insight.
You receive the panel context (panel name, the insight, and the underlying data snapshot) and a short conversation.

CORE RULES
- Lead with the answer. Be decisive and contextual.
- Maximum 3-4 short sentences per response.
- Reference the actual numbers in the context when relevant.
- Explain WHAT IT IMPLIES for positioning, not just what it is.
- Neutral institutional tone. No emojis. English only.
- NEVER give explicit buy/sell recommendations or price targets.
- NEVER say "this is financial advice".
- If the user asks something unrelated to financial markets, reply EXACTLY:
  "I only discuss financial markets and market indicators."
- If the user gives a short input ("more?", "why?", "and now?"), interpret it as
  "elaborate on the current panel insight and what to watch next".
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const panel = body?.panel ?? "Unknown panel";
    const insight = body?.insight ?? null;
    const data = body?.data ?? null;

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY missing" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const contextBlock = [
      `PANEL: ${panel}`,
      insight
        ? `CURRENT INSIGHT: ${insight.signal} — ${insight.implication}. Suggested action: ${insight.action}.`
        : "",
      data ? `DATA SNAPSHOT (JSON): ${JSON.stringify(data).slice(0, 1500)}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          stream: true,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "system", content: contextBlock },
            ...messages.slice(-10).map((m: any) => ({
              role: m.role === "assistant" ? "assistant" : "user",
              content: String(m.content ?? "").slice(0, 1500),
            })),
          ],
        }),
      },
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add funds in workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("AI gateway error", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("insight-chat error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
