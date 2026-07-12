import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon, X, Clock, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Seo } from "@/components/Seo";
import { cleanTicker } from "@/lib/ticker";

const POPULAR = ["AAPL", "NVDA", "TSLA", "PLTR", "MSFT", "AMZN", "META", "BTC-USD", "COIN", "AMD"];
const RECENT_KEY = "sp_recent_searches";

function readRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function Search() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => setRecent(readRecent()), []);

  const go = (raw: string) => {
    const sym = raw.trim().toUpperCase();
    if (!sym) return;
    const next = [sym, ...readRecent().filter((s) => s !== sym)].slice(0, 8);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    navigate(`/asset/${encodeURIComponent(sym)}`);
  };

  const clearRecent = () => {
    localStorage.removeItem(RECENT_KEY);
    setRecent([]);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 lg:pb-12">
      <Seo title="Search — ScreenerPilot" description="Search any ticker and get a live chart, technicals and BEN's read." path="/search" />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Search</h1>
        <p className="text-sm text-muted-foreground mt-1">Any stock or crypto — live chart, technicals and BEN's read.</p>

        {/* Search input */}
        <form onSubmit={(e) => { e.preventDefault(); go(q); }} className="relative mt-5">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value.toUpperCase())}
            placeholder="AAPL, TSLA, BTC-USD…"
            aria-label="Search ticker"
            autoFocus
            className="h-14 pl-12 pr-4 text-[17px] bg-secondary/40 border-border focus-visible:ring-primary/50"
          />
        </form>

        {/* Recent */}
        {recent.length > 0 && (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground inline-flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Recent
              </h2>
              <button onClick={clearRecent} className="text-[12px] text-muted-foreground hover:text-foreground">Clear</button>
            </div>
            <div className="fin-card divide-y divide-border/40">
              {recent.map((sym) => (
                <button
                  key={sym}
                  onClick={() => go(sym)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors text-left"
                >
                  <SearchIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-mono font-medium text-[15px]">{cleanTicker(sym)}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Popular */}
        <section className="mt-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground inline-flex items-center gap-1.5 mb-3">
            <TrendingUp className="w-3 h-3" /> Popular
          </h2>
          <div className="flex flex-wrap gap-2">
            {POPULAR.map((sym) => (
              <button
                key={sym}
                onClick={() => go(sym)}
                className="font-mono text-[13px] font-medium px-3.5 py-2 rounded-xl border border-border bg-secondary/30 hover:border-primary/50 hover:text-primary transition-colors"
              >
                {cleanTicker(sym)}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
