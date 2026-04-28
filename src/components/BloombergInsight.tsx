import { useState, useRef, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Zap, Sparkles, Send, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';

export type InsightTone = 'bullish' | 'bearish' | 'neutral' | 'caution';

export interface BloombergInsightData {
  signal: string;
  implication: string;
  action: string;
  tone?: InsightTone;
}

interface Props {
  insight: BloombergInsightData | null | undefined;
  /** Short panel name for AI context, e.g. "BTC Dominance" */
  panel: string;
  /** Underlying data snapshot the AI can reason about (will be JSON-stringified) */
  data?: unknown;
  className?: string;
  /** Disable Ask AI button */
  noAi?: boolean;
}

const toneClasses: Record<InsightTone, { border: string; bg: string; accent: string; icon: typeof TrendingUp }> = {
  bullish:  { border: 'border-l-emerald-500', bg: 'bg-emerald-500/5',  accent: 'text-emerald-500', icon: TrendingUp },
  bearish:  { border: 'border-l-red-500',     bg: 'bg-red-500/5',      accent: 'text-red-500',     icon: TrendingDown },
  caution:  { border: 'border-l-amber-500',   bg: 'bg-amber-500/5',    accent: 'text-amber-500',   icon: Zap },
  neutral:  { border: 'border-l-muted-foreground', bg: 'bg-muted/30',  accent: 'text-muted-foreground', icon: Minus },
};

type ChatMsg = { role: 'user' | 'assistant'; content: string };

const SUGGESTED = [
  'Why is this happening?',
  'What should I watch next?',
  'Historical context?',
];

export const BloombergInsight = ({ insight, panel, data, className, noAi }: Props) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streaming]);

  if (!insight) return null;
  const tone = toneClasses[insight.tone ?? 'neutral'];
  const Icon = tone.icon;

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || streaming) return;

    const next: ChatMsg[] = [...messages, { role: 'user', content: q }];
    setMessages(next);
    setInput('');
    setStreaming(true);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/insight-chat`;
      const resp = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          panel,
          insight,
          data,
          messages: next,
        }),
      });

      if (resp.status === 429) {
        setError('Rate limit reached. Try again in a moment.');
        setStreaming(false);
        return;
      }
      if (resp.status === 402) {
        setError('AI credits exhausted.');
        setStreaming(false);
        return;
      }
      if (!resp.ok || !resp.body) {
        setError('AI request failed.');
        setStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let assistantSoFar = '';
      let done = false;

      // Add empty assistant placeholder
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (!done) {
        const { done: rDone, value } = await reader.read();
        if (rDone) break;
        textBuffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, idx);
          textBuffer = textBuffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              assistantSoFar += delta;
              setMessages((prev) => {
                const out = [...prev];
                out[out.length - 1] = { role: 'assistant', content: assistantSoFar };
                return out;
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') setError(e?.message ?? 'Stream failed');
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'border-l-2 rounded-sm px-3 py-2 text-[12px] leading-snug font-mono flex items-start gap-2',
          tone.border,
          tone.bg,
        )}
        role="note"
      >
        <Icon className={cn('w-3.5 h-3.5 mt-0.5 flex-shrink-0', tone.accent)} />
        <div className="flex-1 min-w-0">
          <span className={cn('font-semibold', tone.accent)}>{insight.signal}</span>
          <span className="text-muted-foreground"> — {insight.implication}.</span>
          <span className="text-foreground font-medium"> {insight.action}.</span>
        </div>
        {!noAi && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className={cn(
              'flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border transition-colors flex-shrink-0',
              open
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border/60 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-primary'
            )}
            aria-label={open ? 'Close AI chat' : 'Ask AI'}
          >
            {open ? <X className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
            {open ? 'Close' : 'Ask AI'}
          </button>
        )}
      </div>

      {open && !noAi && (
        <div className="border border-border/60 rounded-md bg-card/40 backdrop-blur-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Messages */}
          <div ref={scrollRef} className="max-h-72 overflow-y-auto px-3 py-3 space-y-3 text-sm">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Ask about <span className="font-medium text-foreground">{panel}</span>. The AI sees the current insight and the underlying data.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="text-[11px] px-2 py-1 rounded-full border border-border/60 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-md px-3 py-2 text-sm leading-relaxed',
                  m.role === 'user'
                    ? 'bg-muted/60 text-foreground ml-6'
                    : 'bg-primary/5 border border-primary/10 text-foreground mr-6'
                )}
              >
                {m.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                    {m.content ? (
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    ) : (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                    )}
                  </div>
                ) : (
                  m.content
                )}
              </div>
            ))}
            {error && (
              <div className="text-xs text-red-500 px-3 py-2 border border-red-500/30 bg-red-500/5 rounded">
                {error}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t border-border/60 p-2 flex gap-2 bg-background/50"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this panel..."
              disabled={streaming}
              className="flex-1 bg-transparent text-sm px-2 py-1.5 outline-none placeholder:text-muted-foreground disabled:opacity-50"
            />
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              disabled={streaming || !input.trim()}
              className="h-8 px-2"
            >
              {streaming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};
