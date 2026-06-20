import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Seo } from "@/components/Seo";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, ChevronRight, Flame, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Candidate {
  symbol: string;
  companyName: string;
  price: number;
  marketCapLabel: string;
  squeezeScore: number;
  volumeRatio: number;
  change5d: number;
  rsi: number;
}

interface ScanResult {
  scannedAt: string;
  scanned: number;
  valid: number;
  candidates: Candidate[];
}

function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 75
      ? "bg-red-500/15 text-red-600 border-red-500/30"
      : score >= 60
      ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
      : score >= 45
      ? "bg-blue-500/15 text-blue-600 border-blue-500/30"
      : "bg-muted text-muted-foreground border-border";
  return (
    <span className={cn("inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-semibold tabular-nums", tone)}>
      {score}
    </span>
  );
}

function PctCell({ value }: { value: number }) {
  const tone = value > 0 ? "text-emerald-600" : value < 0 ? "text-red-600" : "text-muted-foreground";
  const sign = value > 0 ? "+" : "";
  return <span className={cn("font-medium tabular-nums", tone)}>{sign}{value.toFixed(1)}%</span>;
}

export default function SqueezeRadarPublic() {
  const [data, setData] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: res, error: fnError } = await supabase.functions.invoke("squeeze-radar", { body: {} });
      if (cancelled) return;
      if (fnError || res?.error) {
        setError("Scan temporarily unavailable. Please check back shortly.");
      } else {
        setData(res as ScanResult);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="landing-light min-h-screen bg-background text-foreground">
      <Seo
        title="Short Squeeze Screener — Top Squeeze Setups Today | ScreenerPilot"
        description="Free daily short squeeze screener. We scan ~150 small/mid cap US stocks and rank them by a 0-100 Squeeze Score built from volume spikes, RSI recovery, drawdown depth and momentum."
        path="/squeeze-radar"
      />

      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex h-16 items-center justify-between px-5 gap-4">
          <Link to="/">
            <Logo />
          </Link>
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

      <main className="max-w-5xl mx-auto px-5 py-12">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-cyan-500/25 bg-cyan-50 text-[11px] uppercase tracking-[0.12em] text-cyan-700 mb-5">
          <Flame className="w-3 h-3" />
          Updated daily · {today}
        </div>
        <h1 className="text-[28px] sm:text-[38px] font-semibold tracking-tight leading-[1.1] text-foreground max-w-2xl">
          Today's top short squeeze setups, ranked by Squeeze Score
        </h1>
        <p className="mt-4 text-[15px] text-muted-foreground max-w-2xl leading-relaxed">
          We scan ~150 small and mid cap US tickers every day and rank them on a free 0-100 Squeeze
          Score built from technical heuristics: volume spikes, Bollinger compression, RSI recovery,
          drawdown depth, market cap bias and short-term momentum. No real short-interest data
          (days-to-cover, % float shorted) is used — this is a technical screener, not a guarantee.
        </p>

        <div className="mt-8 fin-card">
          <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-[0.08em] text-muted-foreground font-medium">
              Top Squeeze Candidates
            </h2>
            {data && (
              <span className="text-[11px] text-muted-foreground">
                {data.valid} / {data.scanned} scanned · {new Date(data.scannedAt).toLocaleTimeString()}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-10 justify-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Scanning for setups…
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-muted-foreground">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-xs uppercase tracking-widest text-muted-foreground">
                    <th className="text-left py-3 px-4 font-normal">Symbol</th>
                    <th className="text-left py-3 px-4 font-normal hidden md:table-cell">Company</th>
                    <th className="text-right py-3 px-4 font-normal">Score</th>
                    <th className="text-right py-3 px-4 font-normal">Price</th>
                    <th className="text-right py-3 px-4 font-normal hidden sm:table-cell">Vol×</th>
                    <th className="text-right py-3 px-4 font-normal">5d %</th>
                    <th className="text-right py-3 px-4 font-normal hidden lg:table-cell">Mkt Cap</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 font-mono">
                  {data?.candidates.slice(0, 15).map((c) => (
                    <tr key={c.symbol} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-foreground">
                        <Link to={`/squeeze-radar/${c.symbol}`} className="hover:text-primary transition-colors">
                          {c.symbol}
                        </Link>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell text-muted-foreground truncate max-w-[200px]">
                        {c.companyName}
                      </td>
                      <td className="py-3 px-4 text-right"><ScoreBadge score={c.squeezeScore} /></td>
                      <td className="py-3 px-4 text-right tabular-nums">${c.price.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right tabular-nums hidden sm:table-cell">{c.volumeRatio.toFixed(1)}x</td>
                      <td className="py-3 px-4 text-right"><PctCell value={c.change5d} /></td>
                      <td className="py-3 px-4 text-right text-xs text-muted-foreground hidden lg:table-cell">{c.marketCapLabel}</td>
                      <td className="py-3 px-4 text-right">
                        <Link to={`/squeeze-radar/${c.symbol}`}>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 mt-4">
          <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>
            The Squeeze Score is a technical heuristic, not investment advice. Past patterns do not
            guarantee future squeezes. Always do your own research.
          </p>
        </div>

        <div className="mt-10 fin-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-[18px] font-semibold text-foreground">Want full analysis on any ticker?</h3>
            <p className="mt-1.5 text-[13px] text-muted-foreground max-w-md">
              Stock Intelligence gives you AI-powered breakdowns, quant fund holdings and this same
              squeeze radar — on demand, for any symbol.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="h-11 px-5 text-sm bg-gradient-to-r from-cyan-400 to-blue-500 text-white hover:opacity-90 border-0 flex-shrink-0"
          >
            <Link to="/signup">
              Start free trial <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-5 py-8 border-t border-border">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-[11px] text-muted-foreground">
          <span>© {new Date().getFullYear()} ScreenerPilot</span>
          <nav className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          </nav>
          <span className="font-mono-tabular uppercase tracking-[0.12em]">Read-only · no advice</span>
        </div>
      </footer>
    </div>
  );
}
