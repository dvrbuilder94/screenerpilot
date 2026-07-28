import { useMemo } from "react";

/**
 * Premium hero mockup — dark terminal card with a lime area chart,
 * a few ticker rows, and a compact "BEN" thesis snippet.
 * Pure vector SVG, no external images.
 */
export function HeroTerminalMock() {
  const path = useMemo(() => {
    const pts = [
      12, 18, 15, 14, 20, 22, 19, 16, 24, 21, 28, 26, 32, 30, 34, 40, 38, 46,
      52, 48, 58, 62, 60, 68, 74, 72, 80, 86, 88, 82, 90,
    ];
    const w = 560;
    const h = 160;
    const min = Math.min(...pts);
    const max = Math.max(...pts);
    const stepX = w / (pts.length - 1);
    const norm = (v: number) => h - ((v - min) / (max - min)) * h;
    const line = pts
      .map((v, i) => `${i === 0 ? "M" : "L"} ${(i * stepX).toFixed(1)} ${norm(v).toFixed(1)}`)
      .join(" ");
    const area = `${line} L ${w} ${h} L 0 ${h} Z`;
    return { line, area };
  }, []);

  const rows = [
    { sym: "SPY", name: "S&P 500", price: "588.42", chg: "+0.42%", up: true },
    { sym: "QQQ", name: "Nasdaq 100", price: "512.18", chg: "+0.71%", up: true },
    { sym: "BTC", name: "Bitcoin", price: "98,240", chg: "+1.92%", up: true },
    { sym: "VIX", name: "Volatility", price: "14.22", chg: "-2.10%", up: false },
  ];

  return (
    <div className="relative">
      {/* Soft lime glow */}
      <div
        aria-hidden
        className="absolute -inset-16 -z-10 blur-3xl opacity-40"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 40%, hsl(74 91% 61% / 0.25), transparent 70%)",
        }}
      />

      <div className="rounded-2xl border border-white/[0.08] bg-[#13161F] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-mono">
              ScreenerPilot · Terminal
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-white/50 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8E9BE3] animate-pulse-dot" />
            Live
          </div>
        </div>

        <div className="grid md:grid-cols-[1.35fr_1fr] gap-0">
          {/* Chart panel */}
          <div className="p-6 border-b md:border-b-0 md:border-r border-white/[0.06]">
            <div className="flex items-baseline justify-between mb-1">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-mono">
                  SPX · S&P 500
                </div>
                <div className="mt-1 flex items-baseline gap-3">
                  <span className="font-mono text-3xl text-white tabular-nums tracking-tight">
                    5,884.20
                  </span>
                  <span className="font-mono text-sm text-[#4ADE80]">+24.72 · +0.42%</span>
                </div>
              </div>
              <div className="hidden sm:flex gap-1">
                {["1D", "1W", "1M", "1Y"].map((t, i) => (
                  <span
                    key={t}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${
                      i === 0
                        ? "bg-[#8E9BE3] text-black"
                        : "text-white/50 border border-white/[0.06]"
                    }`}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <svg viewBox="0 0 560 160" className="w-full h-[160px] mt-4">
              <defs>
                <linearGradient id="limeArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#8E9BE3" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#8E9BE3" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Grid */}
              {[40, 80, 120].map((y) => (
                <line
                  key={y}
                  x1="0"
                  x2="560"
                  y1={y}
                  y2={y}
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth="1"
                />
              ))}
              <path d={path.area} fill="url(#limeArea)" />
              <path
                d={path.line}
                fill="none"
                stroke="#8E9BE3"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* BEN thesis snippet */}
            <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[#8E9BE3] text-black font-mono text-[10px] font-bold">
                  BEN
                </span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-mono">
                  Morning read · 08:00 UTC
                </span>
              </div>
              <p className="text-[13px] leading-relaxed text-white/70">
                Risk-on tape holding. Rates soft, dollar bid fading. Watch the semis —
                breadth is the tell.
              </p>
            </div>
          </div>

          {/* Right rail — tickers */}
          <div className="p-4 sm:p-5">
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-mono px-2 mb-2">
              Watchlist
            </div>
            <div className="flex flex-col">
              {rows.map((r) => (
                <div
                  key={r.sym}
                  className="flex items-center justify-between px-2 py-3 border-b border-white/[0.05] last:border-0"
                >
                  <div>
                    <div className="font-mono text-[13px] text-white tracking-tight">{r.sym}</div>
                    <div className="text-[11px] text-white/40">{r.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[13px] text-white tabular-nums">{r.price}</div>
                    <div
                      className={`font-mono text-[11px] tabular-nums ${
                        r.up ? "text-[#4ADE80]" : "text-[#FF5252]"
                      }`}
                    >
                      {r.chg}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-lg bg-[#8E9BE3] text-black text-center text-[11px] font-medium py-2 tracking-tight">
              Add ticker
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
