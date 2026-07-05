import { Link } from "react-router-dom";
import { LineChart, Flame, Search, Layers, Star, ArrowRight, Loader2 } from "lucide-react";
import { MarketPulseHero } from "@/components/MarketPulseHero";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useMarketSnapshotsBySymbols } from "@/hooks/useMarketSnapshots";
import { Seo } from "@/components/Seo";
import { cn } from "@/lib/utils";

const MODULES = [
  { title: "Markets", desc: "Live cross-asset snapshot", url: "/markets", icon: LineChart },
  { title: "Stock Intelligence", desc: "Deep dive on any ticker", url: "/stock-intelligence", icon: Search },
  { title: "Squeeze Radar", desc: "Today's squeeze setups", url: "/squeeze-radar", icon: Flame },
  { title: "Macro", desc: "Regime, rates & calendar", url: "/macro", icon: Layers },
];

const Pct = ({ v }: { v: number | null | undefined }) => {
  if (v == null || !isFinite(v)) return <span className="text-muted-foreground">—</span>;
  const up = v >= 0;
  return (
    <span className={cn("font-mono tabular-nums text-[13px]", up ? "text-emerald-400" : "text-red-400")}>
      {up ? "+" : ""}{v.toFixed(2)}%
    </span>
  );
};

export default function Home() {
  const { items, isAuthed } = useWatchlist();
  const symbols = items.slice(0, 6).map((i) => i.symbol);
  const { data: snapshots = [], isLoading } = useMarketSnapshotsBySymbols(symbols);
  const bySymbol = new Map(snapshots.map((s) => [s.symbol, s]));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8 pb-24 lg:pb-12">
      <Seo title="Home — ScreenerPilot" description="Your market intelligence terminal: live pulse, watchlist and quick access to every module." path="/home" />

      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Terminal</h1>
        <p className="text-muted-foreground mt-1 text-sm">Live market pulse, your watchlist and every module in one place.</p>
      </div>

      {/* Live pulse */}
      <MarketPulseHero />

      {/* Quick access modules */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {MODULES.map((m) => (
          <Link
            key={m.url}
            to={m.url}
            className="fin-card p-4 sm:p-5 group hover:border-primary/40 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <m.icon className="w-4 h-4 text-primary" />
            </div>
            <div className="text-[14px] font-semibold text-foreground flex items-center gap-1">
              {m.title}
              <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </div>
            <div className="text-[12px] text-muted-foreground mt-0.5">{m.desc}</div>
          </Link>
        ))}
      </div>

      {/* Watchlist preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-2">
            <Star className="w-3.5 h-3.5" /> Your Watchlist
          </h2>
          <Link to="/watchlist" className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {!isAuthed ? (
          <div className="fin-card p-6 text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary hover:underline">Sign in</Link> to build your watchlist.
          </div>
        ) : items.length === 0 ? (
          <div className="fin-card p-8 text-center space-y-3">
            <Star className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              Your watchlist is empty. Tap the ⭐ on any ticker in Markets or Stock Intelligence.
            </p>
            <Link to="/stock-intelligence" className="text-primary text-sm hover:underline inline-flex items-center gap-1">
              Find a stock <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : isLoading ? (
          <div className="fin-card p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="fin-card divide-y divide-border/40">
            {items.slice(0, 6).map((it) => {
              const s = bySymbol.get(it.symbol);
              return (
                <Link
                  key={it.id}
                  to={`/stock-intelligence?symbol=${it.symbol}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-secondary/40 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-foreground text-sm">{it.symbol}</div>
                    {s?.display_name && <div className="text-[11px] text-muted-foreground truncate">{s.display_name}</div>}
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className="font-mono text-[13px] tabular-nums text-foreground">
                      {s?.current_price != null ? s.current_price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—"}
                    </div>
                    <Pct v={s?.change_pct_1d ?? null} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
