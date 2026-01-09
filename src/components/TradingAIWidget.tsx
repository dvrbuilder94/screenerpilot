import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trading-ai-chat`;

const FREE_DAILY_LIMIT = 10;
const PRO_DAILY_LIMIT = 100;
const PREMIUM_DAILY_LIMIT = 500;

export const TradingAIWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { subscription } = useAuth();

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

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

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
      if (!session) throw new Error("Not authenticated");

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (!resp.ok) {
        if (resp.status === 429) {
          toast.error("Daily limit reached. Upgrade to continue.");
          setMessages((p) => p.slice(0, -1));
          return;
        }
        throw new Error("AI error");
      }

      setMessages((p) => [...p, { role: "assistant", content: "" }]);

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        assistantText += decoder.decode(value, { stream: true });

        setMessages((p) => {
          const copy = [...p];
          copy[copy.length - 1] = {
            role: "assistant",
            content: assistantText,
          };
          return copy;
        });
      }

      setDailyCount((p) => p + 1);
    } catch (err) {
      toast.error("Failed to get response");
      setMessages((p) => p.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    streamChat(input.trim());
  };

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
                <p className="text-sm font-semibold">AlexIA</p>
                <p className="text-xs text-slate-400">
                  {dailyCount}/{getMessageLimit()} today
                </p>
              </div>
            </div>

            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea ref={scrollRef} className="flex-1 px-3 py-4">
            {messages.length === 0 && (
              <div className="text-center text-slate-400 text-sm mt-10">
                Ask me about markets, crypto or indicators.
              </div>
            )}

            <div className="space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                      m.role === "user" ? "bg-emerald-500 text-white" : "bg-slate-800 text-white"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-1">
                  <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse" />
                  <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse delay-75" />
                  <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse delay-150" />
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="flex gap-2 p-3 border-t border-slate-700">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about BTC, ETH, indicators..."
              className="bg-slate-800 border-slate-600 text-white"
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
