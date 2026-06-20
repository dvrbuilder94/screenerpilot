import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, LineChart, Layers, Activity, MessageSquare } from "lucide-react";
import { Seo } from "@/components/Seo";
import { LiveTickerTape } from "@/components/LiveTickerTape";
import { MarketPulseHero } from "@/components/MarketPulseHero";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function Landing() {
  const [contact, setContact] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

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
      toast({ title: "Could not send", description: "Please try again in a moment.", variant: "destructive" });
      return;
    }
    setContact({ name: "", email: "", message: "" });
    toast({ title: "Message sent", description: "Thanks — we'll get back to you shortly." });
  };

  return (
    <div className="landing-light min-h-screen bg-background text-foreground overflow-x-hidden">
      <Seo
        title="ScreenerPilot — Macro Intelligence Terminal"
        description="A read-only market intelligence terminal. Monitor regimes, relative value and price dislocations across stocks, ETFs, indices, crypto and commodities."
        path="/"
      />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-5 gap-4">
          <Link to="/">
            <Logo />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link to="/pricing" className="px-3 h-9 inline-flex items-center text-[13px] font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary/60 transition-smooth">
              Pricing
            </Link>
            <Link to="/markets" className="px-3 h-9 inline-flex items-center text-[13px] font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary/60 transition-smooth">
              Terminal
            </Link>
            <a href="#contact" className="px-3 h-9 inline-flex items-center text-[13px] font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary/60 transition-smooth">
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="ghost" className="h-9 text-[13px] hidden sm:inline-flex">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="h-9 text-[13px]">
              <Link to="/signup">Start free trial</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
      {/* Live ticker tape — premium fintech motion */}
      <LiveTickerTape />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 w-[900px] h-[460px] opacity-70 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(34,211,238,0.16), rgba(59,130,246,0.08), transparent)",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-5 pt-14 pb-10 sm:pt-20 sm:pb-14">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-cyan-500/25 bg-cyan-50 text-[11px] uppercase tracking-[0.12em] text-cyan-700 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse-dot" />
              Live cross-asset data
            </div>
            <h1 className="text-[32px] sm:text-[44px] lg:text-[52px] font-semibold tracking-tight leading-[1.05] text-foreground">
              A macro intelligence terminal for cross-asset monitoring.
            </h1>
            <p className="mt-5 text-[15px] sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
              Snapshots, regimes and cross-asset ratios across stocks, crypto, ETFs, indices and commodities —
              in one read-only terminal. No execution, no signals, no advice.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="h-11 px-5 text-sm bg-gradient-to-r from-cyan-400 to-blue-500 text-white hover:opacity-90 border-0"
              >
                <Link to="/signup">
                  Start 30-day free trial <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 px-5 text-sm">
                <Link to="/markets">Open Terminal</Link>
              </Button>
            </div>
            <p className="mt-3 text-[12px] text-muted-foreground">
              $15/month after trial. Cancel anytime.
            </p>
          </div>

          {/* Real-data pulse hero */}
          <div className="mt-12">
            <MarketPulseHero />
          </div>
        </div>
      </section>

      {/* What's inside — matches actual terminal pages */}
      <section className="max-w-6xl mx-auto px-5 py-12 border-t border-border">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-6">
          What's inside
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: LineChart, title: "Markets",     desc: "Live snapshots and sparklines across stocks, crypto, ETFs, indices and commodities." },
            { icon: Activity,  title: "Macro",       desc: "Fed, LatAm, crypto macro, commodities and an economic calendar in one view." },
            { icon: Layers,    title: "Ratios",      desc: "Cross-asset ratio charts with 5y mean, z-score and percentile context." },
            { icon: MessageSquare, title: "BEN copilot", desc: "Ask about regimes, momentum or relative value. Answers in two sentences, no advice." },
          ].map((f) => (
            <div key={f.title} className="fin-card p-5 transition-smooth hover:bg-secondary/30 hover:border-primary/30">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="w-4 h-4 text-primary" strokeWidth={1.75} />
              </div>
              <h3 className="text-[14px] font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust / data sources */}
      <section className="max-w-6xl mx-auto px-5 py-12 border-t border-border">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-6">
          Data you can trust
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { src: "Binance", desc: "Real-time crypto pricing" },
            { src: "Yahoo Finance", desc: "Equities, ETFs & indices" },
            { src: "FRED / Federal Reserve", desc: "Macro & rates data" },
            { src: "CoinGecko & CMC", desc: "Crypto market structure" },
          ].map((d) => (
            <div key={d.src} className="fin-card p-4">
              <div className="text-[13px] font-semibold text-foreground">{d.src}</div>
              <div className="mt-1 text-[12px] text-muted-foreground">{d.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="max-w-6xl mx-auto px-5 py-12 border-t border-border">
        <div className="grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">Contact</h2>
            <h3 className="text-[22px] sm:text-[26px] font-semibold tracking-tight leading-tight">
              Questions, feedback or partnership ideas?
            </h3>
            <p className="mt-3 text-[14px] text-muted-foreground leading-relaxed max-w-md">
              Send a message and we'll get back to you. We typically reply within 1–2 business days.
            </p>
          </div>
          <form onSubmit={submitContact} className="fin-card p-5 space-y-3">
            <Input
              placeholder="Your name (optional)"
              value={contact.name}
              onChange={(e) => setContact({ ...contact, name: e.target.value })}
              maxLength={100}
            />
            <Input
              type="email"
              required
              placeholder="you@email.com"
              value={contact.email}
              onChange={(e) => setContact({ ...contact, email: e.target.value })}
              maxLength={255}
            />
            <Textarea
              required
              placeholder="Your message"
              rows={5}
              value={contact.message}
              onChange={(e) => setContact({ ...contact, message: e.target.value })}
              maxLength={2000}
            />
            <Button type="submit" disabled={sending} className="w-full">
              {sending ? "Sending…" : "Send message"}
            </Button>
          </form>
        </div>
      </section>
      </main>

      <footer className="max-w-6xl mx-auto px-5 py-8 border-t border-border">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-[11px] text-muted-foreground">
          <span>© {new Date().getFullYear()} ScreenerPilot</span>
          <nav className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/refund-policy" className="hover:text-foreground transition-colors">Refunds</Link>
            <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          </nav>
          <span className="font-mono-tabular uppercase tracking-[0.12em]">Read-only · no advice</span>
        </div>
      </footer>
    </div>
  );
}
