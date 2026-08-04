import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, X, Send, Loader2, Globe, Bitcoin, TrendingUp, Scale, Landmark, LucideIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getFearGreedIndex, getDominanceData } from "@/lib/cryptoMetrics";
import { useWatchlist } from "@/hooks/useWatchlist";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trading-ai-chat`;

const FREE_DAILY_LIMIT = 10;
const PRO_DAILY_LIMIT = 100;
const PREMIUM_DAILY_LIMIT = 500;
const CONTEXT_CACHE_TTL = 3 * 60 * 1000; // 3 minutes

type PromptCategory = 'overview' | 'crypto' | 'stocks' | 'commodities' | 'fed';
type MarketScope = 'crypto' | 'equities' | 'commodities' | 'macro' | 'global';

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

const SCOPE_LABELS: Record<MarketScope, string> = {
  crypto: "Crypto",
  equities: "Equities",
  commodities: "Commodities",
  macro: "Macro",
  global: "Global",
};

// Infer market scope from user input
const inferScope = (text: string): MarketScope => {
  const t = text.toLowerCase();
  
  if (t.includes('btc') || t.includes('bitcoin') || t.includes('crypto') || 
      t.includes('eth') || t.includes('altcoin') || t.includes('dominance') || 
      t.includes('fear') || t.includes('greed'))
    return 'crypto';
  
  if (t.includes('s&p') || t.includes('sp500') || t.includes('equities') || 
      t.includes('stocks') || t.includes('vix') || t.includes('nasdaq'))
    return 'equities';
  
  if (t.includes('gold') || t.includes('oil') || t.includes('commodities') || 
      t.includes('copper') || t.includes('silver'))
    return 'commodities';
  
  if (t.includes('fed') || t.includes('rates') || t.includes('dollar') || 
      t.includes('dxy') || t.includes('treasury') || t.includes('yield'))
    return 'macro';
  
  return 'global';
};

export const TradingAIWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  const [marketContext, setMarketContext] = useState<string>("");
  const [promptCategory, setPromptCategory] = useState<PromptCategory>('overview');
  const [activeScope, setActiveScope] = useState<MarketScope>('global');
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [lastContextFetch, setLastContextFetch] = useState<number>(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { subscription } = useAuth();
  const { symbols: watchSymbols } = useWatchlist();
  const [searchParams, setSearchParams] = useSearchParams();
  const watchKeyRef = useRef("");
  const watchKey = watchSymbols.slice(0, 20).join(",");

  const isContextReady = marketContext.length > 0;

  // The landing hero chat routes here as /home?q=... — open QUANT with the
  // question prefilled, then strip the param so it doesn't retrigger.
  useEffect(() => {
    const q = searchParams.get("q");
    if (!q) return;
    setInput(q);
    setIsOpen(true);
    searchParams.delete("q");
    setSearchParams(searchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  /* ---------------- MARKET CONTEXT (with 3-min cache) ---------------- */

  useEffect(() => {
    const fetchFullMarketContext = async () => {
      setIsLoadingContext(true);
      const contextParts: string[] = [];

      // 1) The user's watchlist + live quotes — so QUANT reasons about what THEY
      //    actually track and can cite real prices, not generic market talk.
      const symbols = watchSymbols.slice(0, 20);
      if (symbols.length > 0) {
        try {
          const { data } = await supabase.functions.invoke("quotes", { body: { symbols } });
          const quotes = (data?.quotes ?? []) as { symbol: string; price: number | null; changePct: number | null }[];
          const lines = quotes
            .filter((q) => q.price != null)
            .map((q) => {
              const p = Number(q.price);
              const price = p.toLocaleString(undefined, { maximumFractionDigits: p < 1 ? 6 : 2 });
              const chg = q.changePct != null ? ` (${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}% 1d)` : "";
              return `- ${q.symbol}: $${price}${chg}`;
            });
          contextParts.push(
            lines.length > 0
              ? `USER WATCHLIST (they track these — prioritize them and reference the live numbers):\n${lines.join("\n")}`
              : `USER WATCHLIST: ${symbols.join(", ")}`,
          );
        } catch (err) {
          console.warn("Watchlist context failed:", err);
          contextParts.push(`USER WATCHLIST: ${symbols.join(", ")}`);
        }
      }

      // 2) Crypto sentiment.
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

      // 3) Recent signals from ScreenerPilot's own monitors (regime + squeeze).
      try {
        const { data: alerts } = await (supabase as any)
          .from("market_alerts")
          .select("alert_type, entity_label, title")
          .order("created_at", { ascending: false })
          .limit(5);
        if (alerts && alerts.length > 0) {
          const lines = alerts.map((a: any) => `- [${a.alert_type}] ${a.entity_label}: ${a.title}`);
          contextParts.push(`RECENT MARKET SIGNALS (ScreenerPilot monitors):\n${lines.join("\n")}`);
        }
      } catch (err) {
        console.warn("Alerts context failed:", err);
      }

      const fullContext = contextParts.length > 0
        ? `CURRENT MARKET DATA (real and live — use it, cite the numbers, never say data is unavailable):\n${contextParts.join('\n\n')}`
        : '';

      setMarketContext(fullContext);
      setLastContextFetch(Date.now());
      watchKeyRef.current = watchKey;
      setIsLoadingContext(false);
    };

    const shouldRefetch =
      !marketContext ||
      Date.now() - lastContextFetch > CONTEXT_CACHE_TTL ||
      watchKeyRef.current !== watchKey;

    if (isOpen && shouldRefetch) {
      fetchFullMarketContext();
    }
    // watchSymbols is tracked via watchKey (its stable string form).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, marketContext, lastContextFetch, watchKey]);

  /* ---------------- CLOSE HANDLER ---------------- */

  const handleClose = () => {
    abortControllerRef.current?.abort();
    setIsOpen(false);
  };

  /* ---------------- STREAM CHAT ---------------- */

  const streamChat = async (text: string, isFollowUp = false) => {
    // Abort any existing stream
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    // Infer scope from initial message only
    if (!isFollowUp && messages.length === 0) {
      const scope = inferScope(text);
      setActiveScope(scope);
    }

    // For follow-ups, prepend scope context
    const scopedText = isFollowUp && activeScope !== 'global'
      ? `In the context of ${activeScope} markets: ${text}`
      : text;

    const userMsg: Message = { role: "user", content: scopedText };
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

      // Clean message building: system context + conversation history
      const finalMessages: Message[] = marketContext
        ? [
            { role: "system", content: marketContext },
            ...messages,
            userMsg,
          ]
        : [...messages, userMsg];

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: finalMessages }),
        signal: abortControllerRef.current.signal,
      });

      if (!resp.ok) {
        if (resp.status === 401) {
          toast.error("Please log in to use the AI assistant");
        } else if (resp.status === 429) {
          toast.error("Daily limit reached. Upgrade to continue.");
        } else if (resp.status === 402) {
          toast.error("Payment required. Please add funds.");
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
            // ignore malformed stream data
          }
        }
      }

      setDailyCount((p) => p + 1);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Stream was intentionally aborted
        return;
      }
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

  const handleFollowUp = async (prompt: string) => {
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

    streamChat(prompt, true); // Pass isFollowUp = true
  };

  const clearScope = () => {
    setActiveScope('global');
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
          bg-primary text-primary-foreground
          shadow-lg shadow-primary/20 transition active:scale-95
          bottom-20 right-4 h-12 w-12
          lg:bottom-6 lg:right-6 lg:h-14 lg:w-14
        "
      >
        <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="
            fixed z-50 flex flex-col bg-card backdrop-blur-xl
            border border-border shadow-2xl
            inset-x-0 bottom-0 h-[85vh] rounded-t-2xl
            sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[600px] sm:w-96 sm:rounded-2xl
          "
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">QUANT</p>
                <p className="text-xs text-muted-foreground">Quantitative Analyst</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {dailyCount}/{getMessageLimit()}
              </span>
              <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Active Scope Indicator */}
          {messages.length > 0 && activeScope !== 'global' && (
            <div className="flex items-center gap-2 px-4 py-1.5 border-b border-border">
              <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                Focus: {SCOPE_LABELS[activeScope]}
              </span>
              <button
                onClick={clearScope}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            </div>
          )}

          {/* Messages */}
          <ScrollArea ref={scrollRef} className="flex-1 px-3 py-4">
            {/* Quick Prompts - Initial State with Categories */}
            {messages.length === 0 && (
              <div className="flex flex-col h-full px-1">
                {/* Header */}
                <div className="text-center mb-4">
                  <Sparkles className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">Quantitative Market Analysis</p>
                  <p className="text-xs text-muted-foreground">Select a category to explore</p>
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
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Prompts for selected category */}
                <div className="flex-1 space-y-2">
                  {isLoadingContext ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="ml-2 text-sm text-muted-foreground">Loading market data...</span>
                    </div>
                  ) : !isContextReady ? (
                    <>
                      <p className="text-center text-xs text-muted-foreground py-2">
                        Market data unavailable. You can still ask questions.
                      </p>
                      {CATEGORIZED_PROMPTS[promptCategory].prompts.map((q) => (
                        <button
                          key={q}
                          onClick={() => handleQuickPrompt(q)}
                          disabled={isLoading || !canSendMessage()}
                          className="w-full text-left px-3 py-2.5 rounded-lg bg-secondary/70 hover:bg-secondary text-sm text-foreground border border-border hover:border-primary/50 transition-all disabled:opacity-50"
                        >
                          {q}
                        </button>
                      ))}
                    </>
                  ) : (
                    CATEGORIZED_PROMPTS[promptCategory].prompts.map((q) => (
                      <button
                        key={q}
                        onClick={() => handleQuickPrompt(q)}
                        disabled={isLoading || !canSendMessage()}
                        className="w-full text-left px-3 py-2.5 rounded-lg bg-secondary/70 hover:bg-secondary text-sm text-foreground border border-border hover:border-primary/50 transition-all disabled:opacity-50"
                      >
                        {q}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Messages List */}
            {messages.length > 0 && (
              <div className="space-y-3">
                {messages.filter(m => m.role !== 'system').map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
                        m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}

                {/* Follow-up Prompts */}
                {showFollowUps && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border">
                    {FOLLOW_UP_PROMPTS.map((q) => (
                      <button
                        key={q}
                        onClick={() => handleFollowUp(q)}
                        disabled={isLoading || !canSendMessage()}
                        className="px-2.5 py-1 rounded-md text-xs bg-secondary text-muted-foreground hover:bg-secondary/70 hover:text-foreground transition-colors disabled:opacity-50"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                {isLoading && (
                  <div className="flex gap-1">
                    <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                    <div className="h-2 w-2 bg-primary rounded-full animate-pulse delay-75" />
                    <div className="h-2 w-2 bg-primary rounded-full animate-pulse delay-150" />
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="flex gap-2 p-3 border-t border-border">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a specific market question..."
              className="bg-secondary/70 border-border text-foreground text-sm placeholder:text-muted-foreground"
              disabled={isLoading}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <Button
              onClick={handleSend}
              disabled={!canSendMessage() || isLoading}
              size="icon"
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
