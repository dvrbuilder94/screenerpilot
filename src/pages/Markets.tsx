import { LineChart, Sparkles } from "lucide-react";

export default function Markets() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-5 py-10 max-w-6xl">
        <header className="mb-10">
          <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground mb-3">
            Phase 2 · Coming next
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            Markets
          </h1>
          <p className="text-[15px] text-muted-foreground mt-2 max-w-2xl">
            Cross-asset macro snapshot. US equity, sectors, factors, global yields,
            currencies, commodities and country ETFs — all in one terminal view.
          </p>
        </header>

        <div className="fin-card p-8 flex flex-col items-start gap-4">
          <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-primary/15 border border-primary/30">
            <LineChart className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Building a real-time macro snapshot
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
              We're wiring up a server-side collector that pre-caches market data every
              15 minutes. Expect tabs for{" "}
              <span className="text-foreground">Today, Sectors, Factors, Yields,
              Currencies, Commodities and Countries</span> — with LATAM coverage prioritized
              as our differentiator.
            </p>
          </div>

          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Phase 2 of the Macro Intelligence Terminal rollout</span>
          </div>
        </div>
      </main>
    </div>
  );
}
