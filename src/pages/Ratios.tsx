import { GitCompareArrows, Sparkles } from "lucide-react";

export default function Ratios() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-5 py-10 max-w-6xl">
        <header className="mb-10">
          <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground mb-3">
            Phase 4 · Coming soon
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            Cross-Asset Ratio Monitor
          </h1>
          <p className="text-[15px] text-muted-foreground mt-2 max-w-2xl">
            Historical ratios with rolling Z-scores to identify market extremes and
            capital rotation between asset classes.
          </p>
        </header>

        <div className="fin-card p-8 flex flex-col items-start gap-4">
          <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-primary/15 border border-primary/30">
            <GitCompareArrows className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Commodity, equity, crypto and LATAM FX ratios
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
              Examples in development:{" "}
              <span className="text-foreground">Gold/Silver, Copper/Gold, SPY/GLD,
              IWM/SPY, HYG/LQD, ETH/BTC, MSTR/BTC, CLP/Copper, BRL/Oil</span> — each with
              5Y average, current Z-score and a clear RISK-ON / RISK-OFF / EXTREME signal.
            </p>
          </div>

          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Phase 4 of the Macro Intelligence Terminal rollout</span>
          </div>
        </div>
      </main>
    </div>
  );
}
