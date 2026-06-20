import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Flame, TrendingUp, ArrowUp, ArrowDown, RefreshCw, Search } from "lucide-react";
import { useTierLimit } from "@/hooks/useTierLimit";
import { UpgradeTease } from "@/components/UpgradeTease";

interface Coin {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  rank: number;
  price: number;
  volume_24h: number;
  market_cap: number;
  change_1h: number;
  change_24h: number;
  change_7d: number;
  change_30d: number;
  change_60d: number;
  change_90d: number;
}

type Timeframe = "change_24h" | "change_7d" | "change_30d";
type Threshold = 0 | 5 | 10 | 20 | 50;

const TF_LABEL: Record<Timeframe, string> = {
  change_24h: "24h",
  change_7d: "7d",
  change_30d: "30d",
};

function fmtPct(n: number | null | undefined) {
  if (n == null || !isFinite(n)) return "—";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function fmtPrice(n: number) {
  if (n >= 1000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toPrecision(3)}`;
}

function fmtBig(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(0)}`;
}

export default function CryptoMomentum() {
  const [timeframe, setTimeframe] = useState<Timeframe>("change_7d");
  const [threshold, setThreshold] = useState<Threshold>(10);
  const [search, setSearch] = useState("");
  const { limit } = useTierLimit();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["crypto-momentum"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("crypto-momentum", { body: {} });
      if (error) throw error;
      return data as { coins: Coin[]; fetched_at: string; cached: boolean };
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 4 * 60 * 1000,
  });

  const coins = data?.coins ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    return coins
      .filter((c) => c[timeframe] != null && c[timeframe] >= threshold)
      .filter((c) =>
        q ? c.symbol.toUpperCase().includes(q) || c.name.toUpperCase().includes(q) : true
      )
      .sort((a, b) => (b[timeframe] ?? 0) - (a[timeframe] ?? 0));
  }, [coins, timeframe, threshold, search]);

  const visibleCoins = filtered.slice(0, limit);
  const hiddenCoinCount = Math.max(0, filtered.length - limit);

  const stats = useMemo(() => {
    const gainers = coins.filter((c) => (c[timeframe] ?? 0) > 0).length;
    const losers = coins.filter((c) => (c[timeframe] ?? 0) < 0).length;
    const above10 = coins.filter((c) => (c[timeframe] ?? 0) >= 10).length;
    const extreme = coins.filter((c) => (c[timeframe] ?? 0) >= 20).length;
    return { gainers, losers, above10, extreme, total: coins.length };
  }, [coins, timeframe]);

  return (
    <div className="px-3 sm:px-6 py-6 max-w-[1400px] mx-auto">
      <Seo
        title="Crypto Momentum Scanner — ScreenerPilot"
        description="Real-time crypto momentum scanner. Filter top gaining cryptocurrencies by 24h, 7d, and 30d performance powered by CoinMarketCap."
        path="/crypto-momentum"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-primary" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
              Momentum Scanner
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wider text-primary border border-primary/40 rounded px-1.5 py-px">
              Beta
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mt-1">
            Crypto Momentum
          </h1>
          <p className="text-[12px] text-muted-foreground mt-1">
            Top 250 cryptos by market cap. Filter coins gaining momentum over 24h, 7d, or 30d.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-9"
        >
          <RefreshCw className={cn("w-3.5 h-3.5 mr-2", isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5">
        <StatCard label="Coins tracked" value={stats.total.toString()} />
        <StatCard
          label={`Gainers ${TF_LABEL[timeframe]}`}
          value={stats.gainers.toString()}
          accent="up"
        />
        <StatCard label={`>10% ${TF_LABEL[timeframe]}`} value={stats.above10.toString()} accent="up" />
        <StatCard
          label={`>20% extreme`}
          value={stats.extreme.toString()}
          accent="flame"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mr-1">
            Timeframe
          </span>
          {(Object.keys(TF_LABEL) as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={cn(
                "px-3 h-7 text-[12px] font-medium rounded border transition-colors",
                timeframe === tf
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-muted-foreground border-border hover:text-foreground"
              )}
            >
              {TF_LABEL[tf]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mr-1">
            Min gain
          </span>
          {([0, 5, 10, 20, 50] as Threshold[]).map((t) => (
            <button
              key={t}
              onClick={() => setThreshold(t)}
              className={cn(
                "px-3 h-7 text-[12px] font-medium rounded border transition-colors",
                threshold === t
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:text-foreground"
              )}
            >
              {t === 0 ? "All" : `≥${t}%`}
            </button>
          ))}

          <div className="relative ml-auto w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search BTC, ETH..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-[12px]"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium w-10">#</th>
                <th className="px-3 py-2 font-medium">Coin</th>
                <th className="px-3 py-2 font-medium text-right">Price</th>
                <th className="px-3 py-2 font-medium text-right">1h</th>
                <th className="px-3 py-2 font-medium text-right">24h</th>
                <th className="px-3 py-2 font-medium text-right">7d</th>
                <th className="px-3 py-2 font-medium text-right hidden sm:table-cell">30d</th>
                <th className="px-3 py-2 font-medium text-right hidden md:table-cell">Volume 24h</th>
                <th className="px-3 py-2 font-medium text-right hidden lg:table-cell">Market Cap</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={9} className="px-3 py-10 text-center text-muted-foreground">
                    Loading crypto momentum data...
                  </td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-10 text-center text-muted-foreground">
                    No coins match the current filters.
                  </td>
                </tr>
              )}
              {visibleCoins.map((c) => {
                const tfVal = c[timeframe];
                const extreme = tfVal >= 20;
                return (
                  <tr
                    key={c.id}
                    className="border-t border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-3 py-2.5 text-muted-foreground">{c.rank}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <img
                          src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${c.id}.png`}
                          alt={c.symbol}
                          className="w-5 h-5 rounded-full"
                          loading="lazy"
                        />
                        <div className="flex flex-col leading-tight">
                          <span className="font-medium text-foreground">{c.symbol}</span>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                            {c.name}
                          </span>
                        </div>
                        {extreme && (
                          <span className="ml-1 inline-flex items-center text-[9px] font-semibold uppercase text-primary border border-primary/40 rounded px-1 py-px">
                            <Flame className="w-2.5 h-2.5 mr-0.5" />
                            Hot
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right text-foreground tabular-nums">
                      {fmtPrice(c.price)}
                    </td>
                    <PctCell value={c.change_1h} />
                    <PctCell value={c.change_24h} />
                    <PctCell value={c.change_7d} />
                    <PctCell value={c.change_30d} hideOnMobile />
                    <td className="px-3 py-2.5 text-right text-muted-foreground tabular-nums hidden md:table-cell">
                      {fmtBig(c.volume_24h)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground tabular-nums hidden lg:table-cell">
                      {fmtBig(c.market_cap)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <UpgradeTease hiddenCount={hiddenCoinCount} label="coins" />

      <p className="text-[10px] text-muted-foreground mt-3 text-center">
        Data: CoinMarketCap · refreshed every 5 minutes · {visibleCoins.length} coins shown
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "up" | "down" | "flame";
}) {
  return (
    <div className="border border-border rounded-lg p-3 bg-card">
      <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
      <div
        className={cn(
          "text-xl font-semibold tracking-tight mt-1 tabular-nums",
          accent === "up" && "text-emerald-600",
          accent === "down" && "text-red-600",
          accent === "flame" && "text-primary"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function PctCell({ value, hideOnMobile }: { value: number | null; hideOnMobile?: boolean }) {
  const pos = (value ?? 0) >= 0;
  return (
    <td
      className={cn(
        "px-3 py-2.5 text-right tabular-nums font-medium",
        pos ? "text-emerald-600" : "text-red-600",
        hideOnMobile && "hidden sm:table-cell"
      )}
    >
      <span className="inline-flex items-center justify-end gap-0.5">
        {value != null && (pos ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
        {fmtPct(value)}
      </span>
    </td>
  );
}
