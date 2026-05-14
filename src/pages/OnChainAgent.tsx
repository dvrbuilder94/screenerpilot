import { Bot, Sparkles, Wallet, Activity, Network, Zap, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletComingSoon } from "@/components/WalletComingSoon";

const features = [
  {
    icon: Activity,
    title: "Smart Money Tracker",
    desc: "Live alerts on whale wallets, treasuries and curated on-chain players moving size.",
  },
  {
    icon: Network,
    title: "Wallet Intelligence",
    desc: "Connect a wallet to get a portfolio breakdown, risk concentration and rotation ideas.",
  },
  {
    icon: Sparkles,
    title: "AI Co-pilot, on-chain aware",
    desc: "Ask the agent about funding, flows, unlocks or your portfolio — context-aware answers.",
  },
  {
    icon: Zap,
    title: "Intent-based actions",
    desc: "Prepare swaps, bridges and stakes from chat. You always sign — the agent never holds funds.",
  },
];

const roadmap = [
  { phase: "Phase 1", status: "In progress", title: "Wallet connect on Base", desc: "MetaMask, Coinbase Wallet, Rainbow, WalletConnect." },
  { phase: "Phase 2", status: "Next", title: "On-chain intelligence", desc: "Smart money feed, whale alerts, on-chain signals in the terminal." },
  { phase: "Phase 3", status: "Planned", title: "Agent execution layer", desc: "Swap, bridge and stake intents from chat with user signature." },
];

export default function OnChainAgent() {
  return (
    <div className="container max-w-5xl mx-auto px-5 py-10 space-y-10">
      {/* Hero */}
      <section className="fin-card p-6 sm:p-10">
        <div className="flex items-center gap-2 mb-5">
          <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-primary/30 bg-primary/10 text-[11px] uppercase tracking-[0.12em] text-primary font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Beta · Mini Preview
          </span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center gap-8">
          <div className="flex-1">
            <h1 className="text-[28px] sm:text-[36px] font-semibold tracking-tight leading-[1.1] text-foreground">
              The on-chain AI agent for traders.
            </h1>
            <p className="mt-4 text-[14px] sm:text-[15px] text-muted-foreground leading-relaxed max-w-2xl">
              An AI co-pilot that reads the chain in real time. Track smart money, scan your wallet,
              and prepare on-chain actions from a single chat — built natively on Base.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <WalletComingSoon size="default" variant="default" />
              <Button asChild size="default" variant="outline" className="gap-2">
                <a href="#how-it-works">
                  How it works <ArrowRight className="w-4 h-4" />
                </a>
              </Button>
            </div>

            <p className="mt-4 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              Wallet connect is live · On-chain features rolling out soon
            </p>
          </div>

          <div className="flex-shrink-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent blur-2xl" />
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/40 border border-primary/30 flex items-center justify-center">
                <Bot className="w-14 h-14 sm:w-16 sm:h-16 text-primary" strokeWidth={1.5} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-4">
          What the agent will do
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {features.map((f) => (
            <div key={f.title} className="fin-card p-5">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <f.icon className="w-4 h-4 text-primary" strokeWidth={1.75} />
                </div>
                <div className="flex-1">
                  <h3 className="text-[14px] font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mock chat preview */}
      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-4">
          Preview · Agent chat
        </h2>
        <div className="fin-card p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              <span className="text-[12px] font-semibold">On-Chain Agent</span>
              <span className="text-[10px] text-muted-foreground font-mono-tabular">base · live</span>
            </div>
            <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">demo</span>
          </div>

          <div className="flex justify-end">
            <div className="max-w-[80%] px-3 py-2 rounded-xl bg-primary/15 border border-primary/20 text-[13px] text-foreground">
              What did smart money buy in the last 24h?
            </div>
          </div>

          <div className="flex justify-start">
            <div className="max-w-[85%] px-3 py-2 rounded-xl bg-secondary/40 border border-border text-[13px] text-foreground leading-relaxed">
              Top inflows on Base from tracked wallets: <span className="font-mono-tabular text-primary">$4.2M</span> into majors,
              <span className="font-mono-tabular text-primary"> $1.8M</span> into mid-cap DeFi. Two whales rotated from stables
              into a single liquid restaking name — flow is constructive, not extreme.
            </div>
          </div>

          <div className="flex justify-end">
            <div className="max-w-[80%] px-3 py-2 rounded-xl bg-primary/15 border border-primary/20 text-[13px] text-foreground">
              Scan my wallet.
            </div>
          </div>

          <div className="flex justify-start">
            <div className="max-w-[85%] px-3 py-2 rounded-xl bg-secondary/40 border border-border text-[13px] text-foreground flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Connect a wallet to unlock — coming soon.</span>
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center gap-2">
            <div className="flex-1 px-3 py-2 rounded-md border border-border bg-background/40 text-[12px] text-muted-foreground">
              Ask the on-chain agent…
            </div>
            <WalletComingSoon size="sm" variant="default" />
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-4">
          Roadmap
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {roadmap.map((r) => (
            <div key={r.phase} className="fin-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono-tabular uppercase tracking-[0.12em] text-muted-foreground">
                  {r.phase}
                </span>
                <span className="text-[10px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded bg-secondary/60 text-foreground">
                  {r.status}
                </span>
              </div>
              <h3 className="text-[14px] font-semibold text-foreground">{r.title}</h3>
              <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="fin-card p-6 sm:p-10 text-center">
        <Wallet className="w-6 h-6 text-primary mx-auto mb-3" strokeWidth={1.75} />
        <h2 className="text-[22px] sm:text-[28px] font-semibold tracking-tight text-foreground">
          Be early to the on-chain agent.
        </h2>
        <p className="mt-3 text-[13px] sm:text-[14px] text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Connect a wallet to be on the early access list. No email, no signup — just the chain.
        </p>
        <div className="mt-6 flex justify-center">
          <WalletComingSoon size="default" variant="default" />
        </div>
      </section>
    </div>
  );
}
