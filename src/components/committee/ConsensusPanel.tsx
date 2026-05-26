import { Activity, Gauge } from "lucide-react";
import type { CommitteeResponse } from "@/hooks/useCommitteeAnalysis";

interface ConsensusPanelProps {
  response: CommitteeResponse | null;
  regime?: string;
  fearGreed?: number;
  vix?: number;
}

function biasToScore(bias: string): number {
  if (bias === "bullish") return 1;
  if (bias === "bearish") return -1;
  return 0;
}

export function ConsensusPanel({ response, regime, fearGreed, vix }: ConsensusPanelProps) {
  let bullishPct = 33;
  let neutralPct = 34;
  let bearishPct = 33;
  let avgConfidence = 0;
  let consensusLabel = "Awaiting query";

  if (response) {
    const agents = [response.macro, response.momentum, response.quant];
    const bull = agents.filter((a) => a.bias === "bullish").length;
    const bear = agents.filter((a) => a.bias === "bearish").length;
    const neutral = agents.filter((a) => a.bias === "neutral").length;
    bullishPct = Math.round((bull / 3) * 100);
    bearishPct = Math.round((bear / 3) * 100);
    neutralPct = 100 - bullishPct - bearishPct;
    avgConfidence = Math.round(
      agents.reduce((sum, a) => sum + a.confidence, 0) / 3
    );
    const netScore = agents.reduce((sum, a) => sum + biasToScore(a.bias) * a.confidence, 0);
    if (netScore > 50) consensusLabel = "Risk-On Lean";
    else if (netScore < -50) consensusLabel = "Risk-Off Lean";
    else consensusLabel = "Mixed / No Edge";
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-7">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-transparent pointer-events-none" />

      <div className="relative flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <Gauge className="w-3 h-3" />
              Committee Consensus
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              {consensusLabel}
            </div>
            {response && (
              <div className="mt-1 text-sm text-muted-foreground">
                Avg. confidence {avgConfidence}%
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Live
            </div>
            {regime && <div>Regime · {regime}</div>}
          </div>
        </div>

        {/* Sentiment bar */}
        <div>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-emerald-500 transition-all duration-700 ease-out"
              style={{ width: `${bullishPct}%` }}
            />
            <div
              className="h-full bg-zinc-400 transition-all duration-700 ease-out"
              style={{ width: `${neutralPct}%` }}
            />
            <div
              className="h-full bg-red-500 transition-all duration-700 ease-out"
              style={{ width: `${bearishPct}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-muted-foreground tabular-nums">
            <span className="text-emerald-600">Bullish {bullishPct}%</span>
            <span>Neutral {neutralPct}%</span>
            <span className="text-red-600">Bearish {bearishPct}%</span>
          </div>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-3 gap-3 border-t border-border pt-4">
          <Stat label="Fear & Greed" value={fearGreed != null ? String(Math.round(fearGreed)) : "—"} />
          <Stat label="VIX" value={vix != null ? vix.toFixed(2) : "—"} />
          <Stat
            label="Confidence"
            value={response ? `${avgConfidence}%` : "—"}
            icon={<Activity className="w-3 h-3" />}
          />
        </div>

        {response?.summary && (
          <div className="rounded-lg border border-border bg-background/60 p-3 text-sm text-foreground leading-relaxed">
            {response.summary}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold tabular-nums text-foreground">{value}</div>
    </div>
  );
}
