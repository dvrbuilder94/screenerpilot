import { Link, Navigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Terminal, Users, Zap, Shield } from "lucide-react";
import { Seo } from "@/components/Seo";
import { LiveTickerTape } from "@/components/LiveTickerTape";
import { MarketPulseHero } from "@/components/MarketPulseHero";
import { BenMascot } from "@/components/BenMascot";
import { Logo } from "@/components/Logo";
import { TerminalDemo } from "@/components/TerminalDemo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function Landing() {
  const { user, loading } = useAuth();
  const [contact, setContact] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  // Logged-in users skip the marketing page and land in the terminal.
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
    <div className="min-h-screen bg-[#0A0C14] text-white overflow-x-hidden">
      <Seo
        title="ScreenerPilot — AI Agents for Serious Investors"
        description="Benjamin is your team of specialized AI agents. Professional macro intelligence and cross-asset analysis in one clean terminal."
        path="/"
      />

      {/* Header - más limpio */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0A0C14]/95 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-6">
          <Link to="/">
            <Logo />
          </Link>

          <nav className="hidden md:flex items-center gap-x-8 text-sm">
            <Link to="/pricing" className="text-zinc-400 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link to="/markets" className="text-zinc-400 hover:text-white transition-colors">
              Terminal
            </Link>
            <Link to="/squeeze-radar" className="text-zinc-400 hover:text-white transition-colors">
              Squeeze Screener
            </Link>
            <a href="#contact" className="text-zinc-400 hover:text-white transition-colors">
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="text-sm text-zinc-400 hover:text-white">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="bg-white text-black hover:bg-zinc-200 text-sm h-9 px-5">
              <Link to="/signup">Start free trial</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <LiveTickerTape />

        {/* Hero - estilo FinRobot (más limpio y AI-first) */}
        <section className="pt-20 pb-16 border-b border-white/10">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-white/10 bg-white/5 text-xs tracking-[2px] text-zinc-400 mb-6">
              POWERED BY BENJAMIN
            </div>

            <h1 className="text-6xl lg:text-7xl font-semibold tracking-tighter leading-none">
              Your team of
              <br />
              specialized AI agents.
            </h1>

            <p className="mt-6 text-xl text-zinc-400 max-w-2xl mx-auto">
              Professional macro intelligence, cross-asset analysis and intelligent agents.
              <br />
              One clean terminal. Built for serious investors.
            </p>

            <div className="flex justify-center gap-4 mt-10">
              <Button asChild size="lg" className="h-12 px-8 text-base bg-white text-black hover:bg-zinc-100">
                <Link to="/signup">Start 30-day free trial</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 px-8 text-base border-white/20 hover:bg-white/5"
              >
                <Link to="/markets">Open Terminal</Link>
              </Button>
            </div>
            <p className="mt-3 text-xs text-zinc-500">$15/month after trial. Cancel anytime.</p>
          </div>

          {/* Visual principal */}
          <div className="mt-16 max-w-5xl mx-auto px-6">
            <div className="rounded-3xl border border-white/10 bg-[#11131C] p-2 shadow-2xl">
              <TerminalDemo />
            </div>
          </div>
        </section>

        {/* Features - más limpio y pro */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <div className="text-xs tracking-[2px] text-zinc-500 mb-3">WHAT'S INSIDE</div>
            <h2 className="text-4xl font-semibold tracking-tight">
              Everything you need.
              <br />
              Nothing you don’t.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Terminal,
                title: "Professional Terminal",
                desc: "Clean command interface with live data across stocks, crypto, ETFs and macro.",
              },
              {
                icon: Users,
                title: "BEN Agents",
                desc: "Specialized AI agents that research, screen and analyze for you in seconds.",
              },
              {
                icon: Zap,
                title: "Cross-Asset Intelligence",
                desc: "Regimes, ratios, dislocations and relative value in one unified view.",
              },
              {
                icon: Shield,
                title: "Read-only & Private",
                desc: "No execution. No signals. No advice. Built for professional use.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="group rounded-3xl border border-white/10 bg-[#11131C] p-7 transition-all hover:border-white/20 hover:bg-[#161A25]"
              >
                <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors">
                  <item.icon className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="font-semibold text-xl tracking-tight mb-3">{item.title}</h3>
                <p className="text-zinc-400 leading-relaxed text-[15px]">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Trust + Data */}
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="text-center mb-10">
            <div className="text-xs tracking-[2px] text-zinc-500 mb-2">TRUSTED DATA SOURCES</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Binance & CoinGecko", desc: "Real-time crypto data" },
              { name: "Yahoo Finance", desc: "Global equities & ETFs" },
              { name: "FRED & Central Banks", desc: "Macro & rates data" },
              { name: "On-chain + News", desc: "Sentiment & structure" },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-[#11131C] p-6">
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-zinc-400 mt-1">{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="border-t border-white/10 py-20 bg-[#0A0C14]">
          <div className="max-w-4xl mx-auto px-6 grid md:grid-cols-2 gap-12">
            <div>
              <div className="text-xs tracking-[2px] text-zinc-500 mb-3">GET IN TOUCH</div>
              <h2 className="text-4xl font-semibold tracking-tight">Questions or partnership ideas?</h2>
              <p className="mt-4 text-zinc-400">We usually reply within 1–2 business days.</p>
            </div>

            <form onSubmit={submitContact} className="space-y-4">
              <Input
                placeholder="Your name"
                value={contact.name}
                onChange={(e) => setContact({ ...contact, name: e.target.value })}
              />
              <Input
                type="email"
                required
                placeholder="you@email.com"
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
              />
              <Textarea
                required
                placeholder="Your message"
                rows={5}
                value={contact.message}
                onChange={(e) => setContact({ ...contact, message: e.target.value })}
              />
              <Button type="submit" disabled={sending} className="w-full h-12 text-base">
                {sending ? "Sending..." : "Send message"}
              </Button>
            </form>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8 text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between gap-y-4">
          <div>© {new Date().getFullYear()} ScreenerPilot — Read-only · No advice</div>
          <div className="flex gap-x-6">
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/pricing">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
