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
const [dailyLimit, setDailyLimit] = useState(FREE_DAILY_LIMIT);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { subscription } = useAuth();

  const getMessageLimit = () => {
    const tier = subscription?.tier || "free";
    switch (tier) {
      case "premium": return PREMIUM_DAILY_LIMIT;
      case "pro": return PRO_DAILY_LIMIT;
      default: return FREE_DAILY_LIMIT;
    }
  };

  const canSendMessage = () => {
    return dailyCount < getMessageLimit();
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const fetchUsage = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const today = new Date().toISOString().split('T')[0];
      const { data: usage } = await supabase
        .from('user_ai_usage')
        .select('message_count')
        .eq('user_id', session.user.id)
        .eq('date', today)
        .single();

      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('tier')
        .eq('user_id', session.user.id)
        .single();

      const tier = subscription?.tier || 'free';
      const limit = tier === 'premium' ? PREMIUM_DAILY_LIMIT : 
                    tier === 'pro' ? PRO_DAILY_LIMIT : FREE_DAILY_LIMIT;

      setDailyLimit(limit);
      setDailyCount(usage?.message_count || 0);
    };

    fetchUsage();
  }, []);

  const streamChat = async (userMessage: string) => {
    const newUserMsg: Message = { role: "user", content: userMessage };
    setMessages(prev => [...prev, newUserMsg]);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to use the AI assistant.");
        setMessages(prev => prev.slice(0, -1));
        setIsLoading(false);
        return;
      }

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: [...messages, newUserMsg] }),
      });

      if (!resp.ok) {
        const error = await resp.json();
        
        if (resp.status === 429) {
          const tier = subscription?.tier || 'free';
          const upgradeMsg = tier === 'free' 
            ? 'Upgrade to Pro for unlimited AI access!' 
            : 'Rate limit reached. Please wait a moment.';
          toast.error(upgradeMsg);
          setMessages(prev => prev.slice(0, -1));
          setIsLoading(false);
          return;
        }
        
        throw new Error(error.error || "Failed to get AI response");
      }

      // Update rate limit info from headers
      const remaining = resp.headers.get('X-Rate-Limit-Remaining');
      if (remaining) {
        setDailyCount(getMessageLimit() - parseInt(remaining));
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;

        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: assistantContent,
                };
                return newMessages;
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Update count after successful message
      setDailyCount(prev => prev + 1);
    } catch (error) {
      console.error("AI chat error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to get response");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    streamChat(input.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-110 hover:shadow-emerald-500/50 active:scale-95 flex items-center justify-center group"
      >
        <Sparkles className="h-6 w-6 text-white transition-transform group-hover:rotate-12" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 opacity-0 blur-xl transition-opacity group-hover:opacity-50" />
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[600px] animate-in slide-in-from-bottom-4 duration-300">
          <div className="h-full rounded-2xl border border-slate-700/70 bg-slate-950/90 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-400" />
                <div>
                  <h3 className="font-semibold text-foreground">AlexIA Trading Assistant</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400">
                      Beta
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {dailyCount}/{getMessageLimit()} today
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm space-y-2 mt-8">
                  <Sparkles className="h-12 w-12 mx-auto text-emerald-400/50" />
                  <p>Hello! I'm AlexIA, your trading assistant.</p>
                  <p className="text-xs">Ask me about technical analysis, indicators, or any asset.</p>
                </div>
              )}
              
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                        msg.role === "user"
                          ? "bg-gradient-to-br from-emerald-500 to-cyan-500 text-white"
                          : "bg-slate-700 text-white border border-slate-600"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800/80 rounded-2xl px-4 py-3 border border-slate-700/50">
                      <div className="flex gap-1">
                        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse delay-75" />
                        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse delay-150" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about markets..."
                  disabled={isLoading}
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus-visible:ring-emerald-500/50"
                />
                <Button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim() || !canSendMessage()}
                  size="icon"
                  className="bg-gradient-to-br from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
