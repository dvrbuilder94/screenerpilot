import { useMemo, useState } from "react";
import { Globe2, Zap, Sigma, Brain } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { ProGate } from "@/components/ProGate";
import { Seo } from "@/components/Seo";
import { useMarketSnapshots } from "@/hooks/useMarketSnapshots";
import { useCommitteeAnalysis, type MarketContext } from "@/hooks/useCommitteeAnalysis";
import { ConsensusPanel } from "@/components/committee/ConsensusPanel";
import { AgentCard, type AgentMeta } from "@/components/committee/AgentCard";
import { DebateTranscript } from "@/components/committee/DebateTranscript";
import { CommitteeInput } from "@/components/committee/CommitteeInput";
import { toast } from "sonner";

const AGENTS: AgentMeta[] = [
  {
    id: "macro",
    name: "Macro Agent",
    role: "Rates · Inflation · Liquidity",
    icon: Globe2,
    accent: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    dot: "bg-blue-500",
  },
  {
    id: "momentum",
    name: "Momentum Agent",
    role: "Trend · Breakouts · Relative Strength",
    icon: Zap,
    accent: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  {
    id: "quant",
    name: "Quant Agent",
    role: "Volatility · Factors · Positioning",
    icon: Sigma,
    accent: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    dot: "bg-purple-500",
  },
];

function CommitteeContent() {
  const { data: snapshots } = useMarketSnapshots();
  const mutation = useCommitteeAnalysis();
  const [activeQuestion, setActiveQuestion] = useState<string | undefined>();

  const marketContext: MarketContext = useMemo(() => {
    if (!snapshots) return {};
    const spy = snapshots.find((s) => s.symbol === "SPY" || s.symbol === "^GSPC");
    const btc = snapshots.find((s) => s.symbol === "BTCUSDT" || s.symbol === "BTC-USD");
    const vix = snapshots.find((s) => s.symbol === "^VIX" || s.symbol === "VIX");
    const movers = [...snapshots]
      .filter((s) => s.change_pct_1d != null)
      .sort((a, b) => Math.abs(b.change_pct_1d!) - Math.abs(a.change_pct_1d!))
      .slice(0, 6)
      .map((s) => ({ symbol: s.symbol, change_pct: Number(s.change_pct_1d!.toFixed(2)) }));

    return {
      spy_1d: spy?.change_pct_1d ?? undefined,
      btc_1d: btc?.change_pct_1d ?? undefined,
      vix: vix?.current_price ?? undefined,
      topMovers: movers,
    };
  }, [snapshots]);

  const handleAsk = (question: string) => {
    setActiveQuestion(question);
    mutation.mutate(
      { question, context: marketContext },
      {
        onError: (err) => {
          toast.error(err.message || "Committee request failed");
        },
      }
    );
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <Brain className="w-3 h-3" />
          Premium · AI Committee
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
          AI Market Intelligence Committee
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
          Three specialized AI analysts — Macro, Momentum and Quant — debate your market question in parallel, grounded in real-time data.
        </p>
      </div>

      {/* Input */}
      <CommitteeInput onSubmit={handleAsk} loading={mutation.isPending} />

      {/* Consensus */}
      <ConsensusPanel
        response={mutation.data ?? null}
        vix={marketContext.vix}
      />

      {/* Agents grid */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            The Committee
          </div>
          {mutation.isPending && (
            <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground animate-pulse">
              Analyzing…
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {AGENTS.map((meta) => (
            <AgentCard
              key={meta.id}
              meta={meta}
              data={mutation.data ? mutation.data[meta.id] : null}
              loading={mutation.isPending}
            />
          ))}
        </div>
      </div>

      {/* Debate */}
      <DebateTranscript
        response={mutation.data ?? null}
        agents={AGENTS}
        question={activeQuestion}
      />

      {/* Roadmap footer */}
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-4 text-[11px] text-muted-foreground">
        <span className="uppercase tracking-[0.12em] mr-2">Coming next</span>
        Smart Money Tracker · Unusual Options Flow · Sentiment & Bear/Bull agents — pending institutional data feeds.
      </div>
    </div>
  );
}

export default function Committee() {
  return (
    <AppLayout>
      <Seo
        title="AI Market Intelligence Committee | ScreenerPilot"
        description="A multi-agent AI committee analyzing markets across macro, momentum and quant signals in real time."
      />
      <ProGate
        title="Committee is a premium feature"
        description="Unlock the multi-agent AI market committee with your subscription."
      >
        <CommitteeContent />
      </ProGate>
    </AppLayout>
  );
}
