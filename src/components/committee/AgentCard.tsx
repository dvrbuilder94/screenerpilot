import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentResponse } from "@/hooks/useCommitteeAnalysis";

export interface AgentMeta {
  id: "macro" | "momentum" | "quant";
  name: string;
  role: string;
  icon: LucideIcon;
  accent: string; // tailwind text/border color class group
  dot: string;
}

interface AgentCardProps {
  meta: AgentMeta;
  data: AgentResponse | null;
  loading?: boolean;
}

const biasMap = {
  bullish: { label: "Bullish", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  bearish: { label: "Bearish", icon: TrendingDown, color: "text-red-600", bg: "bg-red-500/10" },
  neutral: { label: "Neutral", icon: Minus, color: "text-zinc-500", bg: "bg-zinc-500/10" },
};

export function AgentCard({ meta, data, loading }: AgentCardProps) {
  const Icon = meta.icon;
  const bias = data ? biasMap[data.bias] : null;
  const BiasIcon = bias?.icon ?? Minus;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all hover:border-foreground/20 hover:shadow-sm">
      <div className={cn("absolute top-0 left-0 h-px w-full", meta.dot)} />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg border border-border", meta.accent)}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{meta.name}</div>
            <div className="text-[11px] text-muted-foreground">{meta.role}</div>
          </div>
        </div>

        {data && (
          <div className={cn("flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-wide", bias?.bg, bias?.color)}>
            <BiasIcon className="w-3 h-3" />
            {bias?.label}
          </div>
        )}
      </div>

      <div className="mt-4 min-h-[80px]">
        {loading ? (
          <div className="space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
            <div className="h-3 w-3/5 animate-pulse rounded bg-muted" />
          </div>
        ) : data ? (
          <>
            <p className="text-sm leading-relaxed text-foreground">{data.thesis}</p>
            {data.evidence.length > 0 && (
              <ul className="mt-3 space-y-1">
                {data.evidence.map((e, i) => (
                  <li key={i} className="flex gap-2 text-[12px] text-muted-foreground">
                    <span className={cn("mt-1.5 h-1 w-1 flex-shrink-0 rounded-full", meta.dot)} />
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Awaiting committee query…</p>
        )}
      </div>

      {data && (
        <div className="mt-4 border-t border-border pt-3">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            <span>Confidence</span>
            <span className="tabular-nums text-foreground">{data.confidence}%</span>
          </div>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full transition-all duration-700 ease-out", meta.dot)}
              style={{ width: `${data.confidence}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
