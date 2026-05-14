import { Link } from "react-router-dom";
import { WalletComingSoon } from "@/components/WalletComingSoon";
import { Button } from "@/components/ui/button";
import { ArrowRight, LineChart, Brain, Wallet } from "lucide-react";

const Pct = ({ v }: { v: number }) => {
  const cls = v >= 0 ? "badge-positive" : "badge-negative";
  return <span className={cls}>{v >= 0 ? "+" : ""}{v.toFixed(2)}%</span>;
};

const signals = [
  { sym: "NVDA",   name: "Nvidia",        sig: "Long",   conf: 82, chg: 2.14 },
  { sym: "BTC",    name: "Bitcoin",       sig: "Long",   conf: 74, chg: 1.08 },
  { sym: "XLE",    name: "Energy ETF",    sig: "Short",  conf: 61, chg: -0.92 },
  { sym: "EURUSD", name: "Euro / Dollar", sig: "Neutral",conf: 50, chg: -0.12 },
];

const snapshot = [
  { sym: "S&P 500",  chg: 0.34 },
  { sym: "Nasdaq",   chg: 0.71 },
  { sym: "Gold",     chg: -0.18 },
  { sym: "WTI Oil",  chg: 1.42 },
  { sym: "10Y Yield",chg: -0.05 },
  { sym: "DXY",      chg: 0.08 },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-5 gap-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/15 border border-primary/30">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[15px] font-semibold tracking-tight">ScreenerPilot</span>
              <span className="hidden sm:block text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground mt-0.5">
                Macro Intelligence Terminal
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <a href="#features" className="px-3 h-9 inline-flex items-center text-[13px] font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary/60 transition-smooth">
              Features
            </a>
            <Link to="/markets" className="px-3 h-9 inline-flex items-center text-[13px] font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary/60 transition-smooth">
              Terminal
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <WalletComingSoon />
            </div>
            <Button asChild size="sm" className="h-9 text-[13px]">
              <Link to="/markets">Open Terminal</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-14 pb-12 sm:pt-20 sm:pb-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-border bg-secondary/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-positive" />
            Live · v1.0
          </div>
          <h1 className="text-[32px] sm:text-[44px] lg:text-[52px] font-semibold tracking-tight leading-[1.05] text-foreground">
            AI agents for market intelligence.
          </h1>
          <p className="mt-5 text-[15px] sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
            Track stocks, crypto, ETFs, indices and commodities from one terminal.
            Get signals, context and cross-asset insights in a single workflow.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-11 px-5 text-sm">
              <Link to="/markets">
                Open Terminal <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <WalletComingSoon size="lg" variant="outline" className="h-11 px-5" />
          </div>
        </div>

        {/* Mockup terminal */}
        <div className="mt-12 fin-card p-3 sm:p-4">
          <div className="flex items-center justify-between px-2 pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-border" />
              <span className="w-2 h-2 rounded-full bg-border" />
              <span className="w-2 h-2 rounded-full bg-border" />
              <span className="ml-3 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                screenerpilot · workspace
              </span>
            </div>
            <span className="hidden sm:inline text-[11px] text-muted-foreground font-mono-tabular">
              Markets · Signals · Context
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3">
            {/* Signals */}
            <div className="lg:col-span-2 fin-card p-3">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Top Signals
                </h3>
                <span className="text-[11px] text-muted-foreground font-mono-tabular">15m · auto</span>
              </div>
              <table className="fin-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Signal</th>
                    <th className="text-right">Conf</th>
                    <th className="text-right">1D</th>
                  </tr>
                </thead>
                <tbody>
                  {signals.map((s) => (
                    <tr key={s.sym}>
                      <td>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{s.sym}</span>
                          <span className="text-[11px] text-muted-foreground">{s.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className={
                          s.sig === "Long" ? "badge-positive"
                          : s.sig === "Short" ? "badge-negative"
                          : "badge-neutral"
                        }>
                          {s.sig}
                        </span>
                      </td>
                      <td className="text-right font-mono-tabular text-foreground">{s.conf}</td>
                      <td className="text-right"><Pct v={s.chg} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Thesis / context */}
            <div className="fin-card p-4 flex flex-col">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">
                Macro Context
              </h3>
              <p className="text-[13px] text-foreground leading-relaxed">
                Risk-on bias holds as breadth widens across US large caps.
                Energy lags on softer crude; rates drift lower into CPI.
              </p>
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <div className="flex justify-between text-[12px]">
                  <span className="text-muted-foreground">Regime</span>
                  <span className="badge-positive">Risk-On</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-muted-foreground">Breadth</span>
                  <span className="text-foreground font-mono-tabular">68%</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-muted-foreground">Volatility</span>
                  <span className="text-foreground font-mono-tabular">14.2</span>
                </div>
              </div>
            </div>
          </div>

          {/* Snapshot */}
          <div className="fin-card p-3 mt-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3 px-1">
              Market Snapshot
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {snapshot.map((s) => (
                <div key={s.sym} className="px-3 py-2.5 rounded-md border border-border bg-background/40">
                  <div className="text-[11px] text-muted-foreground">{s.sym}</div>
                  <div className="mt-1"><Pct v={s.chg} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section id="features" className="max-w-6xl mx-auto px-5 py-14 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: LineChart, title: "Cross-asset screening", desc: "One workflow across stocks, crypto, ETFs, indices and commodities." },
            { icon: Brain,     title: "AI-generated context",  desc: "Setups explained in plain English with macro and micro evidence." },
            { icon: Wallet,    title: "Wallet-ready on Base",  desc: "Connect a Base wallet to unlock token-gated features when live." },
          ].map((f) => (
            <div key={f.title} className="fin-card p-5">
              <f.icon className="w-4 h-4 text-muted-foreground mb-4" strokeWidth={1.75} />
              <h3 className="text-[14px] font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-5 py-14 border-t border-border">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-6">
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { n: "01", t: "Scan the market",      d: "Filter setups across asset classes in seconds." },
            { n: "02", t: "Understand the signal", d: "Read context, regime and risk before acting." },
            { n: "03", t: "Act from one terminal", d: "Move from idea to execution without tab-switching." },
          ].map((s) => (
            <div key={s.n} className="fin-card p-5">
              <div className="text-[11px] font-mono-tabular text-muted-foreground">{s.n}</div>
              <h3 className="mt-3 text-[14px] font-semibold text-foreground">{s.t}</h3>
              <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-5 py-16 border-t border-border">
        <div className="fin-card p-8 sm:p-12 text-center">
          <h2 className="text-[26px] sm:text-[34px] font-semibold tracking-tight text-foreground">
            One terminal. More conviction.
          </h2>
          <p className="mt-3 text-[14px] sm:text-[15px] text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Use ScreenerPilot to filter noise, understand setups and move faster across markets.
          </p>
          <div className="mt-7">
            <Button asChild size="lg" className="h-11 px-5 text-sm">
              <Link to="/markets">
                Enter ScreenerPilot <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-5 py-8 border-t border-border">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>© {new Date().getFullYear()} ScreenerPilot</span>
          <span className="font-mono-tabular uppercase tracking-[0.12em]">Macro Intelligence Terminal</span>
        </div>
      </footer>
    </div>
  );
}
