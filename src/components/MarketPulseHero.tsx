import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

// Premium animated "market pulse" — institutional fintech style.
// Pure CSS animation, no external libs, no fake data implications.
function generateBars(count = 40) {
  return Array.from({ length: count }, () => Math.random() * 0.6 + 0.2);
}

export function MarketPulseHero() {
  const [bars, setBars] = useState(() => generateBars());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setBars((prev) => {
        const next = [...prev.slice(1), Math.random() * 0.7 + 0.2];
        return next;
      });
      setTick((t) => t + 1);
    }, 400);
    return () => clearInterval(id);
  }, []);

  // Pseudo metrics that drift
  const value = 4832.14 + Math.sin(tick / 6) * 12.4;
  const delta = Math.sin(tick / 8) * 0.42;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-sm">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      {/* Glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      <div className="relative p-5 sm:p-7">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <Activity className="w-3 h-3" />
              Live Market Pulse
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-semibold tabular-nums font-mono tracking-tight text-foreground">
                {value.toFixed(2)}
              </span>
              <span
                className={`text-sm font-mono tabular-nums ${
                  delta >= 0 ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {delta >= 0 ? "+" : ""}{delta.toFixed(2)}%
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Synthetic preview · powered by the ScreenerPilot engine
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Streaming
            </div>
            </div>
          </div>
        </div>

        {/* Animated bar chart */}
        <div className="flex items-end gap-[3px] h-32 sm:h-40">
          {bars.map((h, i) => {
            const isLast = i === bars.length - 1;
            return (
              <div
                key={`${i}-${tick}`}
                className={`flex-1 rounded-t-sm transition-all duration-500 ease-out ${
                  isLast
                    ? "bg-gradient-to-t from-emerald-500 to-emerald-300 shadow-[0_0_12px_hsl(142_71%_45%/0.6)]"
                    : "bg-gradient-to-t from-foreground/30 to-foreground/10"
                }`}
                style={{ height: `${h * 100}%` }}
              />
            );
          })}
        </div>

        {/* Stat strip */}
        <div className="mt-5 grid grid-cols-4 gap-3 border-t border-border pt-4">
          {[
            { label: "Regime", value: "Risk-On" },
            { label: "VIX", value: "14.82" },
            { label: "F&G", value: "68" },
            { label: "Breadth", value: "72%" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                {s.label}
              </div>
              <div className="mt-0.5 text-sm font-mono tabular-nums font-semibold text-foreground">
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
