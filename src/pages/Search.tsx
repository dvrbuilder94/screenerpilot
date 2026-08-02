import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon, Clock, TrendingUp, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Seo } from "@/components/Seo";
import { cleanTicker } from "@/lib/ticker";
import { searchTickers, type TickerEntry } from "@/lib/tickerDirectory";

const POPULAR = ["AAPL", "NVDA", "TSLA", "PLTR", "MSFT", "BTC-USD", "COIN", "AMD", "HOOD", "META"];
const RECENT_KEY = "sp_recent_searches";

const TYPE_LABEL: Record<TickerEntry["type"], string> = { stock: "Stock", crypto: "Crypto", etf: "ETF" };

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

  const query = q.trim();
  const suggestions = searchTickers(query);
  const exactInList = suggestions.some((s) => s.symbol.toUpperCase() === query.toUpperCase());

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 lg:pb-12">
      <Seo title="Search — ScreenerPilot" description="Search any ticker and get a live chart, technicals and QUANT's read." path="/search" />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Search</h1>
        <p className="text-sm text-muted-foreground mt-1">Any stock or crypto — live chart, technicals and QUANT's read.</p>

        {/* Search input */}
        <form onSubmit={(e) => { e.preventDefault(); go(q); }} className="relative mt-5">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value.toUpperCase())}
            placeholder="Apple, TSLA, BTC…"
            aria-label="Search ticker or company"
            autoFocus
            autoComplete="off"
            className="h-14 pl-12 pr-4 text-[17px] bg-secondary/40 border-border focus-visible:ring-primary/50"
          />
        </form>

        {/* Live suggestions */}
        {query.length > 0 ? (
          <div className="fin-card divide-y divide-border/40 mt-4 overflow-hidden">
            {suggestions.map((t) => (
              <button
                key={t.symbol}
                onClick={() => go(t.symbol)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors text-left"
              >
                <SearchIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="font-mono font-semibold text-[15px]">{cleanTicker(t.symbol)}</span>
                  <span className="text-[13px] text-muted-foreground ml-2">{t.name}</span>
                </div>
                <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5 flex-shrink-0">
                  {TYPE_LABEL[t.type]}
                </span>
              </button>
            ))}
            {/* Always allow going straight to the typed ticker */}
            {!exactInList && (
              <button
                onClick={() => go(query)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors text-left"
              >
                <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-[14px]">
                  Open <span className="font-mono font-semibold">{cleanTicker(query)}</span>
                </span>
              </button>
            )}
          </div>
        ) : (
          <>
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
                      <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
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
          </>
        )}
      </div>
    </div>
  );
}
