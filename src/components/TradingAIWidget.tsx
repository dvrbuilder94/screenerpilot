import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, X, Send, Loader2, Globe, Bitcoin, TrendingUp, Scale, Landmark, LucideIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getFearGreedIndex, getDominanceData } from "@/lib/cryptoMetrics";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trading-ai-chat`;

const FREE_DAILY_LIMIT = 10;
const PRO_DAILY_LIMIT = 100;
const PREMIUM_DAILY_LIMIT = 500;

type PromptCategory = 'overview' | 'crypto' | 'stocks' | 'commodities' | 'fed';

const CATEGORIZED_PROMPTS: Record<PromptCategory, { icon: LucideIcon; label: string; prompts: string[] }> = {
  overview: {
    icon: Globe,
    label: "Overview",
    prompts: [
      "Why is the market up today?",
      "Market sentiment overview",
      "Key macro drivers this week",
      "Risk appetite across markets",
    ],
  },
  crypto: {
    icon: Bitcoin,
    label: "Crypto",
    prompts: [
      "BTC trend and momentum",
      "Are altcoins outperforming Bitcoin?",
      "Fear & Greed interpretation",
      "Dominance implications",
    ],
  },
  stocks: {
    icon: TrendingUp,
    label: "Stocks",
    prompts: [
      "S&P 500 current trend",
      "VIX and volatility outlook",
      "Sector rotation signals",
      "Risk-on or risk-off?",
    ],
  },
  commodities: {
    icon: Scale,
    label: "Commodities",
    prompts: [
      "Gold trend and drivers",
      "Oil market outlook",
      "Gold vs equities ratio",
      "Copper demand signal",
    ],
  },
  fed: {
    icon: Landmark,
    label: "Fed & Macro",
    prompts: [
      "Dollar strength impact",
      "Treasury yield curve status",
      "What events matter this week?",
      "Fed policy implications",
    ],
  },
};

const FOLLOW_UP_PROMPTS = [
  "What does this mean for crypto?",
  "How about equities?",
  "Risk levels right now?",
  "Key events this week?",
];

export const TradingAIWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  const [marketContext, setMarketContext] = useState<string>("");
  const [promptCategory, setPromptCategory] = useState<PromptCategory>('overview');

  const scrollRef = useRef<HTMLDivElement>(null);
  const { subscription } = useAuth();

  /* ---------------- LIMITS ---------------- */

  const getMessageLimit = () => {
    switch (subscription?.tier) {
      case "premium":
        return PREMIUM_DAILY_LIMIT;
      case "pro":
        return PRO_DAILY_LIMIT;
      default:
        return FREE_DAILY_LIMIT;
    }
  };

  const canSendMessage = () => dailyCount < getMessageLimit();

  /* ---------------- AUTOSCROLL ---------------- */

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  /* ---------------- USAGE ---------------- */

  useEffect(() => {
    const fetchUsage = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("user_ai_usage")
        .select("message_count")
        .eq("user_id", session.user.id)
        .eq("date", today)
        .single();

      setDailyCount(data?.message_count || 0);
    };

    fetchUsage();
  }, []);

  /* ---------------- MARKET CONTEXT ---------------- */

  useEffect(() => {
    const fetchFullMarketContext = async () => {
      const contextParts: string[] = [];
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const fetchStock = async (symbol: string) => {
        try {
          const res = await fetch(`${supabaseUrl}/functions/v1/fetch-stock-data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey },
            body: JSON.stringify({ symbol, interval: '1d' }),
          });
          if (!res.ok) return null;
          const data = await res.json();
          return data.candles?.[data.candles.length - 1]?.close || data[data.length - 1]?.close;
        } catch {
          return null;
        }
      };

      // Crypto
      try {
        const [fearGreed, dominance] = await Promise.all([
          getFearGreedIndex(),
          getDominanceData(),
        ]);
        contextParts.push(`CRYPTO:
- Fear & Greed: ${fearGreed.value} (${fearGreed.category})
- BTC Dominance: ${dominance.dominance.toFixed(1)}% (7d: ${dominance.change7d > 0 ? '+' : ''}${dominance.change7d.toFixed(2)}%)`);
      } catch (err) {
        console.warn("Crypto context failed:", err);
      }

      // Stocks
      try {
        const [vix, sp500] = await Promise.all([
          fetchStock('^VIX'),
          fetchStock('^GSPC'),
        ]);
        if (vix && sp500) {
          const vixLevel = vix < 15 ? 'Complacency' : vix < 20 ? 'Low' : vix < 25 ? 'Normal' : vix < 30 ? 'Elevated' : 'Extreme';
          contextParts.push(`EQUITIES:
- VIX: ${vix.toFixed(1)} (${vixLevel})
- S&P 500: ${sp500.toLocaleString()}`);
        }
      } catch (err) {
        console.warn("Stocks context failed:", err);
      }

      // Commodities
      try {
        const [gold, oil] = await Promise.all([
          fetchStock('GC=F'),
          fetchStock('CL=F'),
        ]);
        if (gold && oil) {
          contextParts.push(`COMMODITIES:
- Gold: $${gold.toFixed(2)}
- Oil (WTI): $${oil.toFixed(2)}`);
        }
      } catch (err) {
        console.warn("Commodities context failed:", err);
      }

      // Macro
      try {
        const dxy = await fetchStock('DX-Y.NYB');
        if (dxy) {
          const status = dxy > 105 ? 'Strong' : dxy > 100 ? 'Neutral' : 'Weak';
          contextParts.push(`MACRO:
- DXY: ${dxy.toFixed(2)} (${status} Dollar)`);
        }
      } catch (err) {
        console.warn("Macro context failed:", err);
      }

      const fullContext = contextParts.length > 0
        ? `CURRENT MARKET DATA (use this to inform your responses):\n${contextParts.join('\n\n')}`
        : '';

      setMarketContext(fullContext);
    };

    if (isOpen) {
      fetchFullMarketContext();
    }
  }, [isOpen]);

  /* ---------------- STREAM CHAT ---------------- */

  const streamChat = async (text: string) => {
    const userMsg: Message = { role: "user", content: text };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantText = "";

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Please log in to use the AI assistant");
        setMessages((p) => p.slice(0, -1));
        return;
      }

      // Prepend market context to the first user message
      const messagesWithContext = [...messages, userMsg].map((m, i) => {
        if (i === 0 && m.role === "user" && marketContext) {
          return { ...m, content: `${marketContext}\n\nUser question: ${m.content}` };
        }
        return m;
      });

      // If this is the first message, add context
      const finalMessages = messages.length === 0 && marketContext
        ? [{ role: "user" as const, content: `${marketContext}\n\nUser question: ${text}` }]
        : messagesWithContext;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: finalMessages }),
      });

      if (!resp.ok) {
        if (resp.status === 401) {
          toast.error("Please log in to use the AI assistant");
        } else if (resp.status === 429) {
          toast.error("Daily limit reached. Upgrade to continue.");
        } else {
          toast.error("AI service error");
        }

        setMessages((p) => p.slice(0, -1));
        return;
      }

      setMessages((p) => [...p, { role: "assistant", content: "" }]);

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          const payload = line.replace("data: ", "").trim();
          if (payload === "[DONE]") break;

          try {
            const json = JSON.parse(payload);
            const token = json.choices?.[0]?.delta?.content;

            if (token) {
              assistantText += token;
              setMessages((p) => {
                const copy = [...p];
                copy[copy.length - 1] = {
                  role: "assistant",
                  content: assistantText,
                };
                return copy;
              });
            }
          } catch {
            // ignora basura del stream
          }
        }
      }

      setDailyCount((p) => p + 1);
    } catch (err) {
      toast.error("Failed to get AI response");
      setMessages((p) => p.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------------- SEND ---------------- */

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      toast.error("Please log in to use the AI assistant");
      return;
    }

    if (!canSendMessage()) {
      toast.error("Daily limit reached. Upgrade to continue.");
      return;
    }

    streamChat(input.trim());
  };

  const handleQuickPrompt = async (prompt: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      toast.error("Please log in to use the AI assistant");
      return;
    }

    if (!canSendMessage()) {
      toast.error("Daily limit reached. Upgrade to continue.");
      return;
    }

    streamChat(prompt);
  };

  /* ---------------- UI ---------------- */

  const showFollowUps = messages.length > 0 && 
    messages[messages.length - 1].role === "assistant" && 
    !isLoading;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="
          fixed z-50 flex items-center justify-center rounded-full
          bg-gradient-to-br from-emerald-500 to-cyan-500 text-white
          shadow-lg transition active:scale-95
          bottom-4 right-4 h-12 w-12
          sm:bottom-6 sm:right-6 sm:h-14 sm:w-14
        "
      >
        <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="
            fixed z-50 flex flex-col bg-slate-950/95 backdrop-blur-xl
            border border-slate-700 shadow-2xl
            inset-x-0 bottom-0 h-[85vh] rounded-t-2xl
            sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[600px] sm:w-96 sm:rounded-2xl
          "
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-white">AlexIA</p>
                <p className="text-xs text-slate-400">Market Intelligence</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                {dailyCount}/{getMessageLimit()}
              </span>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea ref={scrollRef} className="flex-1 px-3 py-4">
            {/* Quick Prompts - Initial State with Categories */}
            {messages.length === 0 && (
              <div className="flex flex-col h-full px-1">
                {/* Header */}
                <div className="text-center mb-4">
                  <Sparkles className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-white">Market Intelligence</p>
                  <p className="text-xs text-slate-400">Select a category to explore</p>
                </div>

                {/* Category Pills */}
                <div className="flex flex-wrap gap-1.5 justify-center mb-4">
                  {Object.entries(CATEGORIZED_PROMPTS).map(([key, { icon: Icon, label }]) => (
                    <button
                      key={key}
                      onClick={() => setPromptCategory(key as PromptCategory)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                        promptCategory === key
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Prompts for selected category */}
                <div className="flex-1 space-y-2">
                  {CATEGORIZED_PROMPTS[promptCategory].prompts.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleQuickPrompt(q)}
                      disabled={isLoading || !canSendMessage()}
                      className="w-full text-left px-3 py-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-sm text-white border border-slate-700 hover:border-emerald-500/50 transition-all disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages List */}
            {messages.length > 0 && (
              <div className="space-y-3">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
                        m.role === "user" ? "bg-emerald-500 text-white" : "bg-slate-800 text-white"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}

                {/* Follow-up Prompts */}
                {showFollowUps && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-800">
                    {FOLLOW_UP_PROMPTS.map((q) => (
                      <button
                        key={q}
                        onClick={() => handleQuickPrompt(q)}
                        disabled={isLoading || !canSendMessage()}
                        className="px-2.5 py-1 rounded-md text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                {isLoading && (
                  <div className="flex gap-1">
                    <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse" />
                    <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse delay-75" />
                    <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse delay-150" />
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="flex gap-2 p-3 border-t border-slate-700">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a specific market question..."
              className="bg-slate-800 border-slate-600 text-white text-sm placeholder:text-slate-500"
              disabled={isLoading}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <Button
              onClick={handleSend}
              disabled={!canSendMessage() || isLoading}
              size="icon"
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
