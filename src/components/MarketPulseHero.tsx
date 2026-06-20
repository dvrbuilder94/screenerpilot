import { TrendingUp, TrendingDown, Gauge, Activity, ListChecks } from "lucide-react";
import { useMarketSnapshots } from "@/hooks/useMarketSnapshots";
import { useRatioSnapshots } from "@/hooks/useRatioSnapshots";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function regimeFromZ(z: number | null | undefined): { label: string; tone: "up" | "down" | "flat" } {
  if (z === null || z === undefined || Number.isNaN(z)) return { label: "—", tone: "flat" };
  const abs = Math.abs(z);
  if (abs >= 1) return z > 0 ? { label: "Risk-On", tone: "up" } : { label: "Risk-Off", tone: "down" };
  return { label: "Balanced", tone: "flat" };
}

export function MarketPulseHero() {
  const { data: rows = [], isLoading: snapshotsLoading } = useMarketSnapshots();
  const { data: ratios = [], isLoading: ratiosLoading } = useRatioSnapshots();

  const spy = rows.find((r) => r.symbol === "SPY");
  const vix = rows.find((r) => r.symbol === "^VIX");
  const tracked = rows.filter((r) => r.change_pct_1d !== null);
  const breadth = tracked.length
    ? Math.round((tracked.filter((r) => (r.change_pct_1d ?? 0) >= 0).length / tracked.length) * 100)
    : null;

  const spyGold = ratios.find((r) => r.ratio_id === "SPY_GLD");
  const regime = regimeFromZ(spyGold?.z_score);

  const loading = snapshotsLoading || ratiosLoading;
  const spyUp = (spy?.change_pct_1d ?? 0) >= 0;

  const stats = [
    {
      label: "Regime",
      icon: Activity,
      value: loading ? null : regime.label,
      tone: regime.tone,
    },
    {
      label: "VIX",
      icon: Gauge,
      value: loading || !vix ? null : vix.current_price?.toFixed(2) ?? "—",
      tone: "flat" as const,
    },
    {
      label: "Breadth",
      icon: ListChecks,
      value: loading || breadth === null ? null : `${breadth}%`,
      tone: breadth !== null && breadth >= 50 ? ("up" as const) : ("down" as const),
    },
    {
      label: "Tracked",
      icon: TrendingUp,
      value: loading ? null : rows.length.toString(),
      tone: "flat" as const,
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Live Market Snapshot · SPY
          </div>
          {loading || !spy ? (
            <Skeleton className="h-9 w-40 mt-2" />
          ) : (
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-semibold tabular-nums font-mono tracking-tight text-foreground">
                {spy.current_price?.toFixed(2)}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-sm font-mono tabular-nums",
                  spyUp ? "text-emerald-500" : "text-red-500"
                )}
              >
                {spyUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {spyUp ? "+" : ""}
                {spy.change_pct_1d?.toFixed(2)}%
              </span>
            </div>
          )}
          <div className="text-[11px] text-muted-foreground mt-1">
            Real-time snapshot · same data as the terminal
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Live
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-background/40 p-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              <s.icon className="w-3 h-3" />
              {s.label}
            </div>
            {s.value === null ? (
              <Skeleton className="h-5 w-14 mt-1.5" />
            ) : (
              <div
                className={cn(
                  "mt-1 text-base font-mono tabular-nums font-semibold",
                  s.tone === "up" ? "text-emerald-500" : s.tone === "down" ? "text-red-500" : "text-foreground"
                )}
              >
                {s.value}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
