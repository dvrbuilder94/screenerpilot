import { useMarketSnapshots } from "@/hooks/useMarketSnapshots";
import { cn } from "@/lib/utils";

const TRACKED_SYMBOLS = ["SPY", "QQQ", "BTCUSDT", "^VIX", "GLD"];

export function TerminalDemo() {
  const { data: rows = [], isLoading } = useMarketSnapshots();

  const lines = TRACKED_SYMBOLS.map((symbol) => rows.find((r) => r.symbol === symbol)).filter(
    (r): r is NonNullable<typeof r> => Boolean(r)
  );

  return (
    <div className="rounded-2xl bg-[#0A0C14] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        <span className="w-3 h-3 rounded-full bg-red-500/70" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
        <span className="w-3 h-3 rounded-full bg-green-500/70" />
        <span className="ml-3 text-xs text-zinc-500 font-mono">ben@screenerpilot — scan --markets</span>
      </div>

      <div className="p-5 font-mono text-[13px] leading-relaxed">
        <div className="text-zinc-500">
          <span className="text-cyan-400">$</span> ben scan --cross-asset
        </div>

        {isLoading ? (
          <div className="mt-2 text-zinc-500">Fetching live snapshot...</div>
        ) : (
          <div className="mt-2 space-y-1">
            {lines.map((row) => {
              const up = (row.change_pct_1d ?? 0) >= 0;
              return (
                <div key={row.symbol} className="flex items-center gap-4 text-zinc-300">
                  <span className="w-20 text-zinc-400">{row.symbol}</span>
                  <span className="w-24 tabular-nums">{row.current_price?.toFixed(2) ?? "—"}</span>
                  <span
                    className={cn(
                      "w-20 tabular-nums",
                      up ? "text-emerald-400" : "text-red-400"
                    )}
                  >
                    {row.change_pct_1d != null ? `${up ? "+" : ""}${row.change_pct_1d.toFixed(2)}%` : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-3 text-zinc-500">
          <span className="text-cyan-400">$</span> <span className="animate-pulse">▍</span>
        </div>
      </div>
    </div>
  );
}
