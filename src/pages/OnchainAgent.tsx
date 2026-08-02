import { useState } from "react";
import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { toast } from "sonner";
import { Zap, Bell, Radio, ArrowRight, Wallet } from "lucide-react";

const FEATURES = [
  { icon: Radio, title: "24/7 monitoring", desc: "On-chain markets never close. QUANT watches your tokenized stocks and crypto around the clock." },
  { icon: Zap, title: "Thesis, live", desc: "The moment something moves, QUANT tells you what happened and whether your thesis still holds." },
  { icon: Bell, title: "Proactive alerts", desc: "Get pinged when an on-chain asset breaks a level or the story changes — before the crowd." },
];

export default function OnchainAgent() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(() => Boolean(localStorage.getItem("sp_agent_waitlist")));

  const join = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    localStorage.setItem("sp_agent_waitlist", email);
    setJoined(true);
    toast.success("You're on the beta waitlist");
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 lg:pb-12">
      <Seo title="On-chain Agent (Beta) — ScreenerPilot" description="QUANT, watching the on-chain market 24/7. Join the beta waitlist." path="/agent" />

      <div className="max-w-2xl mx-auto px-5 pt-10 sm:pt-16">
        {/* Badges */}
        <div className="flex items-center gap-2 justify-center">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-primary border border-primary/40 rounded-full px-2.5 py-1">
            Beta
          </span>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground border border-border rounded-full px-2.5 py-1">
            Upcoming
          </span>
        </div>

        {/* Hero */}
        <h1 className="mt-6 text-center text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05] text-balance">
          The market went <span className="text-primary">on-chain</span>.
          <br />Your analyst doesn't sleep.
        </h1>
        <p className="mt-5 text-center text-[15px] sm:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
          On-chain Agent is QUANT watching tokenized stocks and crypto 24/7 — telling you what moved,
          why, and whether your thesis still holds. Coming soon.
        </p>

        {/* Live pill */}
        <div className="mt-6 flex justify-center">
          <span className="inline-flex items-center gap-2 font-mono text-xs text-primary border border-primary/30 bg-primary/10 rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" /> 24/7 · always on
          </span>
        </div>

        {/* Available now: Wallet PnL */}
        <Link
          to="/wallet"
          className="group mt-8 flex items-center gap-4 fin-card p-5 transition-colors hover:border-primary/40"
        >
          <div className="w-11 h-11 rounded-xl bg-primary/[0.14] text-primary flex items-center justify-center flex-shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold tracking-tight">Wallet PnL</h3>
              <span className="text-[9px] uppercase tracking-[0.16em] font-mono text-primary border border-primary/30 rounded-full px-1.5 py-0.5">Live</span>
            </div>
            <p className="text-[13px] text-muted-foreground mt-0.5">Paste any EVM address — see net invested, in/out and gains across every chain.</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
        </Link>

        {/* Waitlist */}
        <div className="mt-9 fin-card p-6">
          {joined ? (
            <div className="text-center">
              <div className="text-primary font-semibold">You're on the list ✓</div>
              <p className="text-sm text-muted-foreground mt-1">We'll email you when the On-chain Agent beta opens.</p>
            </div>
          ) : (
            <form onSubmit={join} className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                aria-label="Email for the beta waitlist"
                className="flex-1 h-11 rounded-xl bg-secondary/50 border border-border px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                className="h-11 px-5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm inline-flex items-center justify-center gap-1.5"
              >
                Join the beta <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Features */}
        <div className="mt-10 grid sm:grid-cols-3 gap-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="fin-card p-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <f.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="text-[14px] font-semibold text-foreground">{f.title}</div>
              <p className="text-[12.5px] text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <p className="text-center mt-10 text-[11px] text-muted-foreground">
          Read-only intelligence · not investment advice.
        </p>
      </div>
    </div>
  );
}
