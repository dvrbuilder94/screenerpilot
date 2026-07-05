import { Link } from "react-router-dom";
import { Loader2, Star, ArrowRight } from "lucide-react";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useMarketSnapshotsBySymbols } from "@/hooks/useMarketSnapshots";
import { WatchlistStar } from "@/components/WatchlistStar";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fmt = (n: number | null | undefined, d = 2) =>
  n == null || !isFinite(n)
    ? "—"
    : new Intl.NumberFormat("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);

const Pct = ({ v }: { v: number | null | undefined }) => {
  if (v == null || !isFinite(v)) return <span className="text-muted-foreground">—</span>;
  const up = v >= 0;
  return (
    <span className={cn("font-mono tabular-nums", up ? "text-emerald-400" : "text-red-400")}>
      {up ? "+" : ""}
      {v.toFixed(2)}%
    </span>
  );
};

export default function Watchlist() {
  const { items, isLoading, isAuthed } = useWatchlist();
  const symbols = items.map((i) => i.symbol);
  const { data: snapshots = [], isLoading: loadingSnap } = useMarketSnapshotsBySymbols(symbols);

  const bySymbol = new Map(snapshots.map((s) => [s.symbol, s]));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8 pb-24 lg:pb-12">
      <Seo
        title="My Watchlist - ScreenerPilot"
        description="Track your favorite tickers with live prices, changes and quick access to intelligence."
        path="/watchlist"
      />

      <div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tighter">Watchlist</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Your tracked tickers with live prices and performance.
        </p>
      </div>

      {!isAuthed ? (
        <div className="fin-card p-8 text-center space-y-3">
          <Star className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Sign in to build your watchlist.</p>
          <Button asChild size="sm">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      ) : isLoading || loadingSnap ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="fin-card p-10 text-center space-y-4">
          <Star className="w-10 h-10 text-muted-foreground mx-auto" />
          <div>
            <p className="text-foreground font-medium">Your watchlist is empty</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tap the ⭐ on any ticker in Markets or Stock Intelligence to add it here.
            </p>
          </div>
          <div className="flex gap-2 justify-center pt-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/markets">Browse Markets</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/stock-intelligence">Find a stock</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="fin-card overflow-hidden">
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-xs uppercase tracking-widest text-muted-foreground">
                  <th className="text-left py-3 px-4 font-normal w-8"></th>
                  <th className="text-left py-3 px-4 font-normal">Ticker</th>
                  <th className="text-right py-3 px-4 font-normal">Last</th>
                  <th className="text-right py-3 px-4 font-normal">1D %</th>
                  <th className="text-right py-3 px-4 font-normal">1W %</th>
                  <th className="text-right py-3 px-4 font-normal">YTD %</th>
                  <th className="text-right py-3 px-4 font-normal w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 font-mono">
                {items.map((it) => {
                  const s = bySymbol.get(it.symbol);
                  return (
                    <tr key={it.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <WatchlistStar symbol={it.symbol} assetType={it.asset_type} />
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-foreground">{it.symbol}</div>
                        {s?.display_name && (
                          <div className="text-xs text-muted-foreground">{s.display_name}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">{fmt(s?.current_price ?? null)}</td>
                      <td className="py-3 px-4 text-right"><Pct v={s?.change_pct_1d ?? null} /></td>
                      <td className="py-3 px-4 text-right"><Pct v={s?.change_pct_1w ?? null} /></td>
                      <td className="py-3 px-4 text-right"><Pct v={s?.change_pct_ytd ?? null} /></td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/stock-intelligence?symbol=${it.symbol}`}
                          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
                        >
                          Open <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-border/30">
            {items.map((it) => {
              const s = bySymbol.get(it.symbol);
              return (
                <Link
                  key={it.id}
                  to={`/stock-intelligence?symbol=${it.symbol}`}
                  className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <WatchlistStar symbol={it.symbol} assetType={it.asset_type} />
                    <div className="min-w-0">
                      <div className="font-medium text-foreground truncate">{it.symbol}</div>
                      {s?.display_name && (
                        <div className="text-xs text-muted-foreground truncate">{s.display_name}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className="font-mono text-sm">{fmt(s?.current_price ?? null)}</div>
                    <Pct v={s?.change_pct_1d ?? null} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
