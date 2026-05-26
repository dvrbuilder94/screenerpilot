import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommitteeResponse } from "@/hooks/useCommitteeAnalysis";
import type { AgentMeta } from "./AgentCard";

interface DebateTranscriptProps {
  response: CommitteeResponse | null;
  agents: AgentMeta[];
  question?: string;
}

export function DebateTranscript({ response, agents, question }: DebateTranscriptProps) {
  // Reveal messages sequentially for "debate" feel
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    if (!response) {
      setRevealed(0);
      return;
    }
    setRevealed(0);
    const timers: number[] = [];
    [600, 1500, 2400].forEach((ms, i) => {
      timers.push(window.setTimeout(() => setRevealed((r) => Math.max(r, i + 1)), ms));
    });
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [response]);

  const messages = response
    ? agents.map((a, i) => ({ meta: a, data: response[a.id], idx: i }))
    : [];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <MessageSquare className="w-3 h-3" />
          Committee Debate
        </div>
        <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      <div className="divide-y divide-border">
        {question && (
          <div className="px-5 py-3 bg-muted/40">
            <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-1">Query</div>
            <div className="text-sm text-foreground">{question}</div>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            Ask the committee a question to see the debate unfold.
          </div>
        ) : (
          messages.map((m) => {
            const visible = m.idx < revealed;
            const Icon = m.meta.icon;
            return (
              <div
                key={m.meta.id}
                className={cn(
                  "flex gap-3 px-5 py-4 transition-all duration-500",
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                )}
              >
                <div className={cn("flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-border", m.meta.accent)}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="font-semibold text-foreground">{m.meta.name}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="uppercase tracking-wide text-muted-foreground">{m.data.bias}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="tabular-nums text-muted-foreground">{m.data.confidence}%</span>
                  </div>
                  {visible ? (
                    <p className="mt-1 text-sm leading-relaxed text-foreground">{m.data.thesis}</p>
                  ) : (
                    <div className="mt-2 flex gap-1">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:120ms]" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:240ms]" />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
