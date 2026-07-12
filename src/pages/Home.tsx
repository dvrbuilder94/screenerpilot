import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Star, ArrowRight, TrendingUp, TrendingDown, Loader2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useQuotes } from "@/hooks/useQuotes";
import { useMarketSnapshots } from "@/hooks/useMarketSnapshots";
import { Seo } from "@/components/Seo";
import { cn } from "@/lib/utils";

const TAPE_SYMBOLS: { symbol: string; label: string }[] = [
  { symbol: "^GSPC", label: "S&P 500" },
  { symbol: "^IXIC", label: "Nasdaq" },
  { symbol: "^VIX", label: "VIX" },
  { symbol: "BTC-USD", label: "Bitcoin" },
  { symbol: "DX-Y.NYB", label: "Dollar Index" },
  { symbol: "^TNX", label: "10Y Yield" },
  { symbol: "GC=F", label: "Gold" },
  { symbol: "CL=F", label: "WTI Crude" },
];

function greeting(name?: string) {
  const h = new Date().getHours();
  const g = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return name ? `${g}, ${name}` : g;
}

function Pct({ v, size = "sm" }: { v: number | null | undefined; size?: "sm" | "lg" }) {
  if (v == null || !isFinite(v))
    return <span className="text-muted-foreground font-mono">—</span>;
  const up = v >= 0;
  return (
    <span
      className={cn(
        "font-mono tabular-nums font-medium inline-flex items-center gap-0.5",
        size === "lg" ? "text-[15px]" : "text-[12px]",
        up ? "text-emerald-500" : "text-red-500"
      )}
    >
      {up ? "+" : ""}
      {v.toFixed(2)}%
    </span>
  );
}

function TapeCard({
  label,
  symbol,
  price,
  changePct,
}: {
  label: string;
  symbol: string;
  price: number | null | undefined;
  changePct: number | null | undefined;
}) {
  const up = (changePct ?? 0) >= 0;
  return (
    <div className="min-w-[150px] snap-start fin-card p-3 sm:p-4">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground truncate">
        {label}
      </div>
      <div className="mt-1.5 font-mono text-[17px] tabular-nums text-foreground font-semibold">
        {price != null
          ? price.toLocaleString("en-US", { maximumFractionDigits: 2 })
          : "—"}
      </div>
      <div className="mt-1 flex items-center gap-1">
        {changePct != null &&
          (up ? (
            <TrendingUp className="w-3 h-3 text-emerald-500" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-500" />
          ))}
        <Pct v={changePct} />
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const name = useMemo(() => {
    const meta = (user as any)?.user_metadata?.display_name;
    if (meta) return meta;
    if (user?.email) return user.email.split("@")[0];
    return undefined;
  }, [user]);

  const { items } = useWatchlist();
  const wlSymbols = items.slice(0, 6).map((i) => i.symbol);

  const tapeSymbols = TAPE_SYMBOLS.map((t) => t.symbol);
  const { data: tape = {}, isLoading: tapeLoading } = useQuotes(tapeSymbols);
  const { data: wlQuotes = {} } = useQuotes(wlSymbols);
  const { data: snapshots = [], isLoading: snapLoading } = useMarketSnapshots();

  const { gainers, losers } = useMemo(() => {
    const withChange = snapshots
      .filter((s) => s.change_pct_1d != null && isFinite(s.change_pct_1d as number))
      .sort((a, b) => (b.change_pct_1d! - a.change_pct_1d!));
    return { gainers: withChange.slice(0, 5), losers: withChange.slice(-5).reverse() };
  }, [snapshots]);

  const [tab, setTab] = useState<"gainers" | "losers">("gainers");
  const movers = tab === "gainers" ? gainers : losers;

  // Simple market bias line based on S&P
  const spx = tape["^GSPC"];
  const bias =
    spx?.changePct == null
      ? "Markets are opening."
      : spx.changePct > 0.3
      ? "Markets are in the green today."
      : spx.changePct < -0.3
      ? "Markets are under pressure today."
      : "Markets are flat today.";

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = q.trim().toUpperCase();
    if (!sym) return;
    navigate(`/asset/${encodeURIComponent(sym)}`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 pb-24 lg:pb-12">
      <Seo
        title="Home — ScreenerPilot"
        description="Live market pulse, movers, and your watchlist in one professional terminal."
        path="/home"
      />

      {/* Greeting */}
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          {greeting(name)}
        </h1>
        <p className="text-sm text-muted-foreground">{bias}</p>
      </header>

      {/* Search — big, unmistakable */}
      <form onSubmit={onSearch} className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search any ticker — AAPL, TSLA, BTC-USD, SPY..."
          className="h-12 pl-10 pr-24 text-[15px] bg-secondary/40 border-border focus-visible:ring-primary/40"
        />
        <Button
          type="submit"
          size="sm"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 px-4 text-[13px]"
        >
          Analyze
        </Button>
      </form>

      {/* On-chain Agent — beta teaser */}
      <Link
        to="/agent"
        className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/[0.06] hover:bg-primary/[0.1] transition-colors px-4 py-3"
      >
        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-primary border border-primary/40 rounded-full px-2 py-0.5 flex-shrink-0">
          Beta
        </span>
        <span className="text-[13px] text-foreground flex-1 min-w-0">
          <span className="font-semibold">On-chain Agent</span>
          <span className="text-muted-foreground"> — BEN watching the on-chain market 24/7. Join the waitlist.</span>
        </span>
        <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
      </Link>

      {/* Today's tape — horizontal scroll on mobile, grid on desktop */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Today's Tape
          </h2>
          {tapeLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
        </div>
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-2.5 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 sm:gap-3 scrollbar-none">
          {TAPE_SYMBOLS.map((t) => {
            const quote = tape[t.symbol];
            return (
              <TapeCard
                key={t.symbol}
                label={t.label}
                symbol={t.symbol}
                price={quote?.price}
                changePct={quote?.changePct}
              />
            );
          })}
        </div>
      </section>

      {/* Movers today */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Movers Today
          </h2>
          <div className="inline-flex rounded-md border border-border p-0.5 bg-secondary/30">
            <button
              onClick={() => setTab("gainers")}
              className={cn(
                "px-2.5 py-1 text-[11px] font-medium rounded-sm transition-colors",
                tab === "gainers" ? "bg-background text-foreground" : "text-muted-foreground"
              )}
            >
              Gainers
            </button>
            <button
              onClick={() => setTab("losers")}
              className={cn(
                "px-2.5 py-1 text-[11px] font-medium rounded-sm transition-colors",
                tab === "losers" ? "bg-background text-foreground" : "text-muted-foreground"
              )}
            >
              Losers
            </button>
          </div>
        </div>
        <div className="fin-card divide-y divide-border/40">
          {snapLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : movers.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No data available yet. Check back shortly.
            </div>
          ) : (
            movers.map((s) => (
              <Link
                key={s.id}
                to={`/asset/${encodeURIComponent(s.symbol)}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-secondary/40 transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-medium text-foreground text-sm truncate">
                    {s.symbol}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {s.display_name}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <div className="font-mono text-[13px] tabular-nums text-foreground">
                    {s.current_price != null
                      ? s.current_price.toLocaleString("en-US", { maximumFractionDigits: 2 })
                      : "—"}
                  </div>
                  <Pct v={s.change_pct_1d} />
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Watchlist */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground inline-flex items-center gap-1.5">
            <Star className="w-3 h-3" /> Your Watchlist
          </h2>
          <Link
            to="/watchlist"
            className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="fin-card p-6 sm:p-8 text-center space-y-3">
            <Star className="w-7 h-7 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Your watchlist is empty. Add any ticker to follow it here.
            </p>
            <Button asChild size="sm" variant="outline" className="h-9">
              <Link to="/watchlist" className="inline-flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add ticker
              </Link>
            </Button>
          </div>
        ) : (
          <div className="fin-card divide-y divide-border/40">
            {items.slice(0, 6).map((it) => {
              const quote = wlQuotes[it.symbol];
              return (
                <Link
                  key={it.id}
                  to={`/asset/${encodeURIComponent(it.symbol)}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-secondary/40 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-foreground text-sm">{it.symbol}</div>
                    {quote?.name && quote.name !== it.symbol && (
                      <div className="text-[11px] text-muted-foreground truncate">
                        {quote.name}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className="font-mono text-[13px] tabular-nums text-foreground">
                      {quote?.price != null
                        ? quote.price.toLocaleString("en-US", { maximumFractionDigits: 2 })
                        : "—"}
                    </div>
                    <Pct v={quote?.changePct ?? null} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
