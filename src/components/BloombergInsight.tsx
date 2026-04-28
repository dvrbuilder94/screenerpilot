import { TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export type InsightTone = 'bullish' | 'bearish' | 'neutral' | 'caution';

export interface BloombergInsightData {
  /** 2-5 word headline. e.g. "BTC.D ↑ 2.1% (7d)" */
  signal: string;
  /** What it means in market terms. 1 short clause. */
  implication: string;
  /** Suggested action. 1 short clause prefixed with verb. */
  action: string;
  tone?: InsightTone;
}

interface Props {
  insight: BloombergInsightData | null | undefined;
  className?: string;
}

const toneClasses: Record<InsightTone, { border: string; bg: string; accent: string; icon: typeof TrendingUp }> = {
  bullish:  { border: 'border-l-emerald-500', bg: 'bg-emerald-500/5',  accent: 'text-emerald-500', icon: TrendingUp },
  bearish:  { border: 'border-l-red-500',     bg: 'bg-red-500/5',      accent: 'text-red-500',     icon: TrendingDown },
  caution:  { border: 'border-l-amber-500',   bg: 'bg-amber-500/5',    accent: 'text-amber-500',   icon: Zap },
  neutral:  { border: 'border-l-muted-foreground', bg: 'bg-muted/30',  accent: 'text-muted-foreground', icon: Minus },
};

/**
 * Bloomberg-terminal style 1-line insight: signal · implication · action.
 * Designed to sit at the top of any analytical panel.
 */
export const BloombergInsight = ({ insight, className }: Props) => {
  if (!insight) return null;
  const tone = toneClasses[insight.tone ?? 'neutral'];
  const Icon = tone.icon;

  return (
    <div
      className={cn(
        'border-l-2 rounded-sm px-3 py-2 text-[12px] leading-snug font-mono flex items-start gap-2',
        tone.border,
        tone.bg,
        className
      )}
      role="note"
      aria-label="Insight"
    >
      <Icon className={cn('w-3.5 h-3.5 mt-0.5 flex-shrink-0', tone.accent)} />
      <div className="flex-1 min-w-0">
        <span className={cn('font-semibold', tone.accent)}>{insight.signal}</span>
        <span className="text-muted-foreground"> — {insight.implication}.</span>
        <span className="text-foreground font-medium"> {insight.action}.</span>
      </div>
    </div>
  );
};
