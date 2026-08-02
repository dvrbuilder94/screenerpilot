import { Link, Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowRight, LayoutDashboard, LineChart, Flame, Radio, ArrowUpRight } from "lucide-react";
import { Seo } from "@/components/Seo";
import { LiveTickerTape } from "@/components/LiveTickerTape";
import { Logo } from "@/components/Logo";
import { OrbHero } from "@/components/OrbHero";
import { WorkflowPipeline } from "@/components/WorkflowPipeline";
import { Reveal } from "@/components/Reveal";
import { CountUp } from "@/components/CountUp";
import { supabase } from "@/integrations/supabase/client";
import { BILLING_ENABLED } from "@/lib/billing";
import { toast } from "@/hooks/use-toast";

export default function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [ask, setAsk] = useState("");
  const [contact, setContact] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  if (!loading && user) return <Navigate to="/home" replace />;

  const submitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.email || contact.message.trim().length < 5) {
      toast({ title: "Please complete the form", description: "Email and a short message are required.", variant: "destructive" });
      return;
    }
    setSending(true);
    const { error } = await supabase.functions.invoke("send-contact-message", { body: contact });
    setSending(false);
    if (error) {
      toast({ title: "Could not send", description: "Please try again.", variant: "destructive" });
      return;
    }
    setContact({ name: "", email: "", message: "" });
    toast({ title: "Message sent", description: "Thanks — we'll get back to you shortly." });
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden antialiased selection:bg-primary selection:text-primary-foreground">
      <Seo
        title="ScreenerPilot — The intelligence core for modern markets"
        description="Live signals across stocks, crypto and on-chain — fused by an autonomous agent, scored by a self-calibrating model, proven by a real track record."
        path="/"
      />

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-5 sm:px-6">
          <Link to="/"><Logo /></Link>
          <nav className="hidden md:flex items-center gap-x-8 text-[13px] text-muted-foreground">
            <Link to="/markets" className="hover:text-foreground transition-colors">Terminal</Link>
            <Link to="/squeeze" className="hover:text-foreground transition-colors">Squeeze Radar</Link>
            <Link to="/search" className="hover:text-foreground transition-colors">Search</Link>
            {BILLING_ENABLED && <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden sm:inline text-[13px] text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">Sign in</Link>
            <Link to="/signup" className="inline-flex items-center gap-1.5 rounded-full bg-primary hover:opacity-90 text-primary-foreground text-[13px] font-medium h-9 px-4 transition-opacity">
              Start free <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative">
          <div className="max-w-6xl mx-auto px-5 sm:px-6 grid lg:grid-cols-[1.05fr_.95fr] items-center gap-10 pt-16 sm:pt-24 pb-14">
            <div>
              <Reveal>
                <div className="inline-flex items-center gap-2.5 text-[11px] uppercase tracking-[0.24em] text-primary font-mono">
                  <span className="w-6 h-px bg-primary" /> Autonomous market intelligence
                </div>
              </Reveal>
              <Reveal delay={80}>
                <h1 className="mt-6 text-[40px] sm:text-6xl font-normal tracking-[-0.02em] leading-[1.05]">
                  The intelligence core
                  <br />
                  <span className="bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">for modern markets.</span>
                </h1>
              </Reveal>
              <Reveal delay={160}>
                <p className="mt-6 text-[17px] text-muted-foreground max-w-md leading-relaxed">
                  Live signals across stocks, crypto and on-chain — fused by an agent, scored by a
                  self-calibrating model, proven by a real track record.
                </p>
              </Reveal>

              {/* QUANT chat entry */}
              <Reveal delay={220}>
                <form
                  onSubmit={(e) => { e.preventDefault(); navigate(ask.trim() ? `/home?q=${encodeURIComponent(ask.trim())}` : "/home"); }}
                  className="mt-8 flex items-center gap-2 rounded-2xl border border-border bg-secondary/40 backdrop-blur px-3.5 py-2.5 max-w-md focus-within:border-primary/50 transition-colors"
                >
                  <input
                    value={ask}
                    onChange={(e) => setAsk(e.target.value)}
                    placeholder="How can I help you read the market today?"
                    className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-muted-foreground"
                  />
                  <button type="submit" className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </form>
              </Reveal>

              <Reveal delay={300}>
                <div className="mt-6 flex items-center gap-3">
                  <Link to="/home" className="inline-flex items-center gap-2 rounded-full bg-primary hover:opacity-90 text-primary-foreground h-11 px-5 text-[14px] font-medium transition-opacity">
                    Enter the terminal <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link to="/squeeze" className="inline-flex items-center rounded-full border border-border hover:border-border-strong h-11 px-5 text-[14px] font-medium transition-colors">
                    See the model
                  </Link>
                </div>
              </Reveal>

              <Reveal delay={360}>
                <div className="mt-10 flex gap-9">
                  {[{ n: 8000, s: "+", l: "Assets" }, { n: 24, s: "/7", l: "Autonomous" }, { n: 63, s: "%", l: "Hit rate" }].map((x, i) => (
                    <div key={i}>
                      <div className="font-mono text-2xl tabular-nums tracking-tight"><CountUp end={x.n} suffix={x.s} /></div>
                      <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-mono">{x.l}</div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            <Reveal delay={200}>
              <OrbHero />
            </Reveal>
          </div>
          <LiveTickerTape />
        </section>

        {/* ── How it works ─────────────────────────────────────── */}
        <section className="border-y border-border/60 overflow-hidden">
          <div className="max-w-6xl mx-auto px-5 sm:px-6 py-20 sm:py-28">
            <Reveal>
              <div className="max-w-2xl">
                <div className="text-[11px] uppercase tracking-[0.2em] text-primary font-mono mb-3">How it works</div>
                <h2 className="text-3xl sm:text-5xl font-normal tracking-[-0.02em] leading-[1.06]">
                  From raw market data<br /><span className="text-muted-foreground">to your read — in real time.</span>
                </h2>
              </div>
            </Reveal>
            <Reveal delay={140}>
              <div className="mt-14 max-w-3xl mx-auto"><WorkflowPipeline /></div>
            </Reveal>
          </div>
        </section>

        {/* ── Feature grid ─────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-5 sm:px-6 py-20 sm:py-28">
          <Reveal>
            <h2 className="text-3xl sm:text-5xl font-normal tracking-[-0.02em] leading-[1.05] max-w-2xl">
              Everything you need.<br /><span className="text-muted-foreground">Nothing you don't.</span>
            </h2>
          </Reveal>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: LayoutDashboard, title: "Home dashboard", desc: "S&P, Nasdaq, VIX, BTC, rates and today's biggest movers at a glance.", to: "/home" },
              { icon: Flame, title: "Squeeze Radar", desc: "A multi-factor squeeze model for stocks & crypto — with a live track record.", to: "/squeeze" },
              { icon: LineChart, title: "Ticker analysis", desc: "Any stock or crypto — live chart, technicals and QUANT's daily read.", to: "/search" },
              { icon: Radio, title: "On-chain agent", desc: "Whale flows, exchange balances and momentum shifts as they happen.", to: "/agent", beta: true },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 80}>
                <Link to={item.to} className="group relative block rounded-2xl border border-border bg-card p-6 h-full transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_20px_50px_-24px_hsl(232_62%_72%/0.5)]">
                  <div className="flex items-start justify-between mb-8">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/[0.14] text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <item.icon className="w-[18px] h-[18px]" strokeWidth={2} />
                    </div>
                    {item.beta && <span className="text-[9px] uppercase tracking-[0.18em] font-mono text-primary border border-primary/30 rounded-full px-1.5 py-0.5">Beta</span>}
                  </div>
                  <h3 className="text-[17px] font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{item.desc}</p>
                  <div className="mt-6 inline-flex items-center gap-1 text-[12px] font-mono text-muted-foreground group-hover:text-primary transition-colors">Explore <ArrowRight className="w-3 h-3" /></div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Trusted data ─────────────────────────────────────── */}
        <section className="border-y border-border/60 bg-card/40">
          <div className="max-w-6xl mx-auto px-5 sm:px-6 py-14">
            <Reveal>
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-mono text-center">Trusted data sources</div>
            </Reveal>
            <Reveal delay={80}>
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 items-center">
                {["Yahoo Finance", "Binance", "CoinGecko", "FRED", "Central Banks", "On-chain"].map((n) => (
                  <div key={n} className="text-center text-[14px] font-medium tracking-tight text-muted-foreground hover:text-foreground transition-colors">{n}</div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Contact ──────────────────────────────────────────── */}
        <section id="contact" className="py-20 sm:py-28">
          <div className="max-w-5xl mx-auto px-5 sm:px-6 grid md:grid-cols-2 gap-12 md:gap-16">
            <Reveal>
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-primary font-mono mb-3">Get in touch</div>
                <h2 className="text-3xl sm:text-5xl font-normal tracking-[-0.02em] leading-[1.06]">Questions or<br />partnership ideas?</h2>
                <p className="mt-5 text-muted-foreground text-[15px] leading-relaxed max-w-sm">We usually reply within 1–2 business days.</p>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <form onSubmit={submitContact} className="space-y-3 rounded-2xl border border-border bg-card p-6">
                <Input placeholder="Your name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} className="bg-transparent h-11" />
                <Input type="email" required placeholder="you@email.com" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} className="bg-transparent h-11" />
                <Textarea required placeholder="Your message" rows={4} value={contact.message} onChange={(e) => setContact({ ...contact, message: e.target.value })} className="bg-transparent" />
                <Button type="submit" disabled={sending} className="w-full h-11">{sending ? "Sending..." : "Send message"}</Button>
              </form>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-10">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 flex flex-col md:flex-row justify-between gap-y-4 items-start md:items-center">
          <div className="flex items-center gap-3 text-[12px] text-muted-foreground font-mono">
            <Logo /> <span className="hidden sm:inline">·</span> <span>© {new Date().getFullYear()} · Read-only · No advice</span>
          </div>
          <div className="flex gap-x-6 text-[12px] text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            {BILLING_ENABLED && <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>}
          </div>
        </div>
      </footer>
    </div>
  );
}
