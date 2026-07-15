import { Link, Navigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, LayoutDashboard, LineChart, Star, Radio } from "lucide-react";
import { Seo } from "@/components/Seo";
import { LiveTickerTape } from "@/components/LiveTickerTape";
import { Logo } from "@/components/Logo";
import { HeroTerminalMock } from "@/components/HeroTerminalMock";
import { Reveal } from "@/components/Reveal";
import { CountUp } from "@/components/CountUp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const LIME = "#C9F73F";

export default function Landing() {
  const { user, loading } = useAuth();
  const [contact, setContact] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  if (!loading && user) return <Navigate to="/home" replace />;

  const submitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.email || contact.message.trim().length < 5) {
      toast({
        title: "Please complete the form",
        description: "Email and a short message are required.",
        variant: "destructive",
      });
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
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden antialiased selection:bg-[#C9F73F] selection:text-black">
      <Seo
        title="ScreenerPilot — The market terminal for independent investors"
        description="Live prices, movers, macro regime and deep ticker analysis. One clean terminal built for serious investors. No fluff."
        path="/"
      />

      {/* ── Sticky header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0A0A0A]/85 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-5 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-white">
            <Logo wordmarkClassName="text-white" />
          </Link>

          <nav className="hidden md:flex items-center gap-x-8 text-[13px] text-white/60">
            <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link to="/markets" className="hover:text-white transition-colors">Terminal</Link>
            <Link to="/search" className="hover:text-white transition-colors">Search</Link>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="hidden sm:inline text-[13px] text-white/60 hover:text-white transition-colors px-3 py-1.5"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#C9F73F] hover:bg-[#d5ff4a] text-black text-[13px] font-medium h-9 px-4 transition-colors"
            >
              Start free
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ───────────────────────────────────────────────── */}
        <section className="relative pt-16 sm:pt-24 pb-16 sm:pb-20">
          {/* Very subtle top glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-20 h-[420px] -z-10 opacity-60"
            style={{
              background:
                "radial-gradient(60% 40% at 50% 0%, rgba(201,247,63,0.10), transparent 70%)",
            }}
          />

          <div className="max-w-6xl mx-auto px-5 sm:px-6">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/60 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9F73F] animate-pulse-dot" />
                Live market terminal
              </div>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="mt-6 text-[44px] sm:text-6xl lg:text-7xl font-semibold tracking-[-0.03em] leading-[1.02] max-w-4xl">
                <span style={{ color: LIME }}>The market terminal</span>
                <br />
                <span className="text-white">for independent investors.</span>
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-6 text-[17px] sm:text-lg text-white/60 max-w-xl leading-relaxed">
                Live prices, macro regime, deep ticker analysis and BEN's daily read.
                One clean terminal. No fluff.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-9 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#C9F73F] hover:bg-[#d5ff4a] text-black h-12 px-6 text-[15px] font-medium tracking-tight transition-colors"
                >
                  Start free trial
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/home"
                  className="inline-flex items-center justify-center rounded-full border border-white/[0.12] hover:border-white/25 hover:bg-white/[0.03] text-white h-12 px-6 text-[15px] font-medium tracking-tight transition-all"
                >
                  Open terminal
                </Link>
              </div>
              <p className="mt-3 text-[12px] text-white/40 font-mono">
                $15/mo after trial · Cancel anytime
              </p>
            </Reveal>

            {/* Product mockup */}
            <Reveal delay={320} className="mt-16 sm:mt-20">
              <HeroTerminalMock />
            </Reveal>
          </div>
        </section>

        {/* ── Live ticker tape ───────────────────────────────────── */}
        <LiveTickerTape />

        {/* ── Stats strip ────────────────────────────────────────── */}
        <section className="border-b border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-5 sm:px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-y-8">
            {[
              { n: 8000, suffix: "+", label: "Tickers tracked" },
              { n: 24, suffix: "/7", label: "Live market data" },
              { n: 6, suffix: "", label: "Asset classes" },
              { n: 15, prefix: "$", suffix: "/mo", label: "Flat pricing" },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="text-center md:text-left">
                  <div className="font-mono text-3xl sm:text-4xl text-white tabular-nums tracking-tight">
                    <CountUp end={s.n} prefix={s.prefix ?? ""} suffix={s.suffix} />
                  </div>
                  <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/40 font-mono">
                    {s.label}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Feature grid ───────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-5 sm:px-6 py-20 sm:py-28">
          <Reveal>
            <div className="max-w-2xl">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[#C9F73F] font-mono mb-3">
                What's inside
              </div>
              <h2 className="text-3xl sm:text-5xl font-semibold tracking-[-0.02em] leading-[1.05]">
                Everything you need.
                <br />
                <span className="text-white/40">Nothing you don't.</span>
              </h2>
            </div>
          </Reveal>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                icon: LayoutDashboard,
                title: "Home dashboard",
                desc: "S&P, Nasdaq, VIX, BTC, rates and today's biggest movers in a single glance.",
                to: "/home",
              },
              {
                icon: LineChart,
                title: "Ticker analysis",
                desc: "Search any stock or crypto — live chart, technicals and BEN's daily read.",
                to: "/search",
              },
              {
                icon: Star,
                title: "Watchlist",
                desc: "Track any ticker with live quotes. Organized by your own sectors.",
                to: "/watchlist",
              },
              {
                icon: Radio,
                title: "On-chain agent",
                desc: "Whale flows, exchange balances and momentum shifts as they happen.",
                to: "/agent",
                beta: true,
              },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 80}>
                <Link
                  to={item.to}
                  className="group relative block rounded-2xl border border-white/[0.08] bg-[#141414] p-6 h-full transition-all duration-300 hover:-translate-y-1 hover:border-[#C9F73F]/40 hover:shadow-[0_0_0_1px_rgba(201,247,63,0.15),0_20px_40px_-20px_rgba(201,247,63,0.25)]"
                >
                  <div className="flex items-start justify-between mb-8">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#C9F73F]/[0.12] text-[#C9F73F] transition-colors group-hover:bg-[#C9F73F] group-hover:text-black">
                      <item.icon className="w-4.5 h-4.5" strokeWidth={2} />
                    </div>
                    {item.beta && (
                      <span className="text-[9px] uppercase tracking-[0.18em] font-mono text-[#C9F73F] border border-[#C9F73F]/30 rounded-full px-1.5 py-0.5">
                        Beta
                      </span>
                    )}
                  </div>
                  <h3 className="text-[17px] font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-white/50">{item.desc}</p>
                  <div className="mt-6 inline-flex items-center gap-1 text-[12px] font-mono text-white/40 group-hover:text-[#C9F73F] transition-colors">
                    Explore <ArrowRight className="w-3 h-3" />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Trusted data sources ──────────────────────────────── */}
        <section className="border-y border-white/[0.06] bg-[#0C0C0C]">
          <div className="max-w-6xl mx-auto px-5 sm:px-6 py-14">
            <Reveal>
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/40 font-mono text-center">
                Trusted data sources
              </div>
            </Reveal>
            <Reveal delay={80}>
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-x-6 gap-y-6 items-center">
                {[
                  "Yahoo Finance",
                  "Binance",
                  "CoinGecko",
                  "FRED",
                  "Central Banks",
                  "On-chain",
                ].map((name) => (
                  <div
                    key={name}
                    className="text-center text-[14px] font-medium tracking-tight text-white/50 hover:text-white transition-colors"
                  >
                    {name}
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Contact ───────────────────────────────────────────── */}
        <section id="contact" className="py-20 sm:py-28">
          <div className="max-w-5xl mx-auto px-5 sm:px-6 grid md:grid-cols-2 gap-12 md:gap-16">
            <Reveal>
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#C9F73F] font-mono mb-3">
                  Get in touch
                </div>
                <h2 className="text-3xl sm:text-5xl font-semibold tracking-[-0.02em] leading-[1.05]">
                  Questions or
                  <br />
                  partnership ideas?
                </h2>
                <p className="mt-5 text-white/50 text-[15px] leading-relaxed max-w-sm">
                  We usually reply within 1–2 business days. Serious investors only.
                </p>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <form
                onSubmit={submitContact}
                className="space-y-3 rounded-2xl border border-white/[0.08] bg-[#141414] p-6"
              >
                <Input
                  placeholder="Your name"
                  value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  className="bg-transparent border-white/[0.08] focus-visible:ring-[#C9F73F] focus-visible:ring-offset-0 h-11"
                />
                <Input
                  type="email"
                  required
                  placeholder="you@email.com"
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  className="bg-transparent border-white/[0.08] focus-visible:ring-[#C9F73F] focus-visible:ring-offset-0 h-11"
                />
                <Textarea
                  required
                  placeholder="Your message"
                  rows={4}
                  value={contact.message}
                  onChange={(e) => setContact({ ...contact, message: e.target.value })}
                  className="bg-transparent border-white/[0.08] focus-visible:ring-[#C9F73F] focus-visible:ring-offset-0"
                />
                <Button
                  type="submit"
                  disabled={sending}
                  className="w-full h-11 rounded-lg bg-[#C9F73F] hover:bg-[#d5ff4a] text-black font-medium text-[14px]"
                >
                  {sending ? "Sending..." : "Send message"}
                </Button>
              </form>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-10">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 flex flex-col md:flex-row justify-between gap-y-4 items-start md:items-center">
          <div className="flex items-center gap-3 text-[12px] text-white/40 font-mono">
            <Logo wordmarkClassName="text-white/70" />
            <span className="hidden sm:inline">·</span>
            <span>© {new Date().getFullYear()} · Read-only · No advice</span>
          </div>
          <div className="flex gap-x-6 text-[12px] text-white/50">
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
