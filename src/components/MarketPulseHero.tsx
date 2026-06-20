import { Activity } from "lucide-react";
import { useMarketSnapshots } from "@/hooks/useMarketSnapshots";
import { useRatioSnapshots } from "@/hooks/useRatioSnapshots";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Real-data hero widget — every number here comes from market_snapshots /
// ratio_snapshots, the same tables the actual terminal renders from. No
// synthetic/random values: if data isn't loaded yet we show a skeleton,
// never a placeholder figure.
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

  const bars = tracked.slice(0, 36);
  const maxMove = Math.max(1, ...bars.map((r) => Math.abs(r.change_pct_1d ?? 0)));

  const loading = snapshotsLoading || ratiosLoading;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-sm">
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      <div className="relative p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <Activity className="w-3 h-3" />
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
                    "text-sm font-mono tabular-nums",
                    (spy.change_pct_1d ?? 0) >= 0 ? "text-emerald-500" : "text-red-500"
                  )}
                >
                  {(spy.change_pct_1d ?? 0) >= 0 ? "+" : ""}
                  {spy.change_pct_1d?.toFixed(2)}%
                </span>
              </div>
            )}
            <div className="text-[11px] text-muted-foreground mt-1">
              Real-time snapshot · same data as the terminal
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Live
            </div>
          </div>
        </div>

        {/* Real per-symbol daily move magnitudes — not synthetic */}
        <div className="flex items-end gap-[3px] h-32 sm:h-40">
          {loading || bars.length === 0
            ? Array.from({ length: 24 }).map((_, i) => (
                <Skeleton key={i} className="flex-1 rounded-t-sm" style={{ height: `${20 + (i % 5) * 10}%` }} />
              ))
            : bars.map((r, i) => {
                const pct = r.change_pct_1d ?? 0;
                const h = Math.min(100, (Math.abs(pct) / maxMove) * 100);
                const up = pct >= 0;
                return (
                  <div
                    key={r.symbol}
                    title={`${r.symbol} ${up ? "+" : ""}${pct.toFixed(2)}%`}
                    className={cn(
                      "flex-1 rounded-t-sm transition-all duration-500 ease-out",
                      up
                        ? "bg-gradient-to-t from-emerald-500 to-emerald-300"
                        : "bg-gradient-to-t from-red-500 to-red-300"
                    )}
                    style={{ height: `${Math.max(h, 6)}%` }}
                  />
                );
              })}
        </div>

        <div className="mt-5 grid grid-cols-4 gap-3 border-t border-border pt-4">
          {[
            { label: "Regime", value: loading ? null : regime.label },
            { label: "VIX", value: loading || !vix ? null : vix.current_price?.toFixed(2) ?? "—" },
            { label: "Breadth", value: loading || breadth === null ? null : `${breadth}%` },
            { label: "Tracked", value: loading ? null : rows.length.toString() },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{s.label}</div>
              {s.value === null ? (
                <Skeleton className="h-4 w-12 mt-1" />
              ) : (
                <div className="mt-0.5 text-sm font-mono tabular-nums font-semibold text-foreground">{s.value}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
