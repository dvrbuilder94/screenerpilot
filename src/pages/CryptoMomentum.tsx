import { useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useCryptoMomentum, TrackedCryptoMetric } from "@/hooks/useCryptoMomentum";

const fmt = (value: number | null | undefined, digits = 2) => {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
};

const fmtPrice = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(value)) return "—";
  const digits = value >= 100 ? 2 : value >= 1 ? 3 : 5;
  return `$${fmt(value, digits)}`;
};

const fmtCap = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(value)) return "—";
  if (value >= 1e9) return `$${fmt(value / 1e9, 1)}B`;
  if (value >= 1e6) return `$${fmt(value / 1e6, 1)}M`;
  return `$${fmt(value, 0)}`;
};

const Percent = ({ value }: { value: number | null | undefined }) => {
  if (value == null || !Number.isFinite(value)) return <span className="text-muted-foreground">—</span>;
  return (
    <span className={cn("font-mono tabular-nums", value >= 0 ? "text-emerald-400" : "text-red-400")}>
      {value >= 0 ? "+" : ""}{value.toFixed(1)}%
    </span>
  );
};

function RsiBadge({ value }: { value: number | null }) {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  const tone = value >= 70
    ? "border-red-500/40 bg-red-500/10 text-red-300"
    : value <= 30
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
      : value >= 60
        ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
        : "border-border bg-secondary/50 text-foreground";
  return <span className={cn("inline-flex min-w-14 justify-center rounded-md border px-2 py-1 font-mono text-xs", tone)}>{value.toFixed(1)}</span>;
}

function RegimeBadge({ regime }: { regime: TrackedCryptoMetric["regime"] }) {
  const style = {
    overbought: "text-red-300 border-red-500/30 bg-red-500/10",
    oversold: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10",
    bullish: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10",
    bearish: "text-red-300 border-red-500/30 bg-red-500/10",
    neutral: "text-muted-foreground border-border bg-secondary/40",
    unknown: "text-muted-foreground border-border bg-secondary/40",
  }[regime];
  return <span className={cn("rounded-full border px-2 py-1 text-[11px] capitalize", style)}>{regime}</span>;
}

function MomentumBar({ value }: { value: number | null }) {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex items-center justify-end gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-foreground" style={{ width: `${Math.max(3, value)}%` }} />
      </div>
      <span className="w-8 text-right font-mono text-xs">{value}</span>
    </div>
  );
}

const CryptoMomentum = () => {
  const { data, isLoading, isFetching, error, refetch } = useCryptoMomentum();
  const [group, setGroup] = useState("all");

  const rows = useMemo(() => {
    const all = data?.tracked ?? [];
    const filtered = group === "all" ? all : all.filter((x) => x.group === group);
    return [...filtered].sort((a, b) => (b.momentum_score ?? -1) - (a.momentum_score ?? -1));
  }, [data, group]);

  const hot = rows.filter((x) => (x.rsi_14 ?? 0) >= 70).length;
  const bullish = rows.filter((x) => x.regime === "bullish").length;
  const avgRsi = rows.filter((x) => x.rsi_14 != null).reduce((sum, x) => sum + (x.rsi_14 ?? 0), 0) / Math.max(1, rows.filter((x) => x.rsi_14 != null).length);

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <Seo
        title="Crypto Momentum - ScreenerPilot"
        description="RSI, momentum, trend and volatility for tracked crypto assets."
        path="/crypto"
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">Crypto dashboard</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">RSI & Momentum</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            One screen for trend, overbought/oversold risk and relative momentum across the crypto names you actually follow.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2 self-start sm:self-auto">
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="fin-card p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Average RSI 14</div>
          <div className="mt-2 font-mono text-3xl">{Number.isFinite(avgRsi) ? avgRsi.toFixed(1) : "—"}</div>
        </div>
        <div className="fin-card p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">RSI ≥ 70</div>
          <div className="mt-2 font-mono text-3xl">{hot}</div>
        </div>
        <div className="fin-card p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Bullish trend</div>
          <div className="mt-2 font-mono text-3xl">{bullish}</div>
        </div>
      </div>

      <Tabs value={group} onValueChange={setGroup}>
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="core">Core</TabsTrigger>
          <TabsTrigger value="defi">DeFi</TabsTrigger>
          <TabsTrigger value="high-beta">High beta</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="fin-card flex min-h-[320px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="fin-card p-6 text-sm text-red-300">
          Could not load crypto momentum data. The edge function may need to be deployed before this page goes live.
        </div>
      ) : (
        <div className="fin-card overflow-hidden">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 text-left font-normal">Asset</th>
                  <th className="px-3 py-3 text-right font-normal">Price</th>
                  <th className="px-3 py-3 text-right font-normal">24h</th>
                  <th className="px-3 py-3 text-right font-normal">7d</th>
                  <th className="px-3 py-3 text-right font-normal">30d</th>
                  <th className="px-3 py-3 text-right font-normal">RSI 14</th>
                  <th className="px-3 py-3 text-right font-normal">EMA20 dist.</th>
                  <th className="px-3 py-3 text-right font-normal">Vol 30d</th>
                  <th className="px-3 py-3 text-right font-normal">Momentum</th>
                  <th className="px-4 py-3 text-right font-normal">Regime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="font-medium">{row.name}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{row.symbol}</span><span>·</span><span className="capitalize">{row.group}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-mono">{fmtPrice(row.price)}</td>
                    <td className="px-3 py-3 text-right"><Percent value={row.change_24h} /></td>
                    <td className="px-3 py-3 text-right"><Percent value={row.change_7d} /></td>
                    <td className="px-3 py-3 text-right"><Percent value={row.change_30d} /></td>
                    <td className="px-3 py-3 text-right"><RsiBadge value={row.rsi_14} /></td>
                    <td className="px-3 py-3 text-right"><Percent value={row.distance_ema20_pct} /></td>
                    <td className="px-3 py-3 text-right font-mono text-xs">{row.volatility_30d_ann == null ? "—" : `${row.volatility_30d_ann.toFixed(0)}%`}</td>
                    <td className="px-3 py-3"><MomentumBar value={row.momentum_score} /></td>
                    <td className="px-4 py-3 text-right"><RegimeBadge regime={row.regime} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-border/30 md:hidden">
            {rows.map((row) => (
              <div key={row.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{row.name} <span className="ml-1 text-xs text-muted-foreground">{row.symbol}</span></div>
                    <div className="mt-1 font-mono text-sm">{fmtPrice(row.price)}</div>
                  </div>
                  <RegimeBadge regime={row.regime} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><div className="text-muted-foreground">RSI 14</div><div className="mt-1"><RsiBadge value={row.rsi_14} /></div></div>
                  <div><div className="text-muted-foreground">7d</div><div className="mt-2"><Percent value={row.change_7d} /></div></div>
                  <div><div className="text-muted-foreground">30d</div><div className="mt-2"><Percent value={row.change_30d} /></div></div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Momentum score</span>
                  <MomentumBar value={row.momentum_score} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Market cap</span>
                  <span className="font-mono">{fmtCap(row.market_cap)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        RSI is calculated from daily CoinGecko history. Momentum combines RSI, 7d/30d returns and EMA20 vs EMA50; it is a ranking signal, not a standalone buy/sell recommendation.
      </p>
    </div>
  );
};

export default CryptoMomentum;
