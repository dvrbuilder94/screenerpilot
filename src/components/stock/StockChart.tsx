import { useMemo } from "react";

interface ChartData {
  timestamps: number[];
  close: number[];
  ema20: (number | null)[];
  ema50: (number | null)[];
  ema200: (number | null)[];
  bbUpper: (number | null)[];
  bbLower: (number | null)[];
}

interface Props {
  data: ChartData;
  height?: number;
}

export default function StockChart({ data, height = 320 }: Props) {
  const view = useMemo(() => {
    const n = data.close.length;
    if (!n) return null;
    const width = 1000;
    const padL = 50, padR = 20, padT = 10, padB = 24;
    const innerW = width - padL - padR;
    const innerH = height - padT - padB;

    const allVals: number[] = [];
    for (let i = 0; i < n; i++) {
      allVals.push(data.close[i]);
      if (data.bbUpper[i] != null) allVals.push(data.bbUpper[i]!);
      if (data.bbLower[i] != null) allVals.push(data.bbLower[i]!);
    }
    const min = Math.min(...allVals);
    const max = Math.max(...allVals);
    const range = max - min || 1;

    const x = (i: number) => padL + (i / (n - 1)) * innerW;
    const y = (v: number) => padT + ((max - v) / range) * innerH;

    const linePath = (arr: (number | null)[]) => {
      let d = "";
      let started = false;
      for (let i = 0; i < arr.length; i++) {
        const v = arr[i];
        if (v == null) { started = false; continue; }
        d += (started ? " L" : "M") + x(i).toFixed(1) + "," + y(v).toFixed(1);
        started = true;
      }
      return d;
    };

    // BB area
    let bbArea = "";
    let openArea = false;
    for (let i = 0; i < n; i++) {
      const u = data.bbUpper[i];
      if (u == null) { openArea = false; continue; }
      bbArea += (openArea ? " L" : "M") + x(i).toFixed(1) + "," + y(u).toFixed(1);
      openArea = true;
    }
    for (let i = n - 1; i >= 0; i--) {
      const l = data.bbLower[i];
      if (l != null) bbArea += " L" + x(i).toFixed(1) + "," + y(l).toFixed(1);
    }
    if (bbArea) bbArea += " Z";

    // Y-axis ticks
    const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => {
      const val = max - t * range;
      return { y: padT + t * innerH, val };
    });

    // X-axis date labels (4)
    const dateLabels = [0, 0.33, 0.66, 1].map(t => {
      const idx = Math.floor(t * (n - 1));
      const d = new Date(data.timestamps[idx] * 1000);
      return {
        x: x(idx),
        label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      };
    });

    return {
      width,
      paths: {
        close: linePath(data.close.map(v => v ?? null)),
        ema20: linePath(data.ema20),
        ema50: linePath(data.ema50),
        ema200: linePath(data.ema200),
        bbUpper: linePath(data.bbUpper),
        bbLower: linePath(data.bbLower),
        bbArea,
      },
      ticks,
      dateLabels,
      padB,
      height,
    };
  }, [data, height]);

  if (!view) return null;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${view.width} ${view.height}`} className="w-full h-auto">
        {/* Grid */}
        {view.ticks.map((t, i) => (
          <g key={i}>
            <line x1={50} x2={view.width - 20} y1={t.y} y2={t.y} stroke="hsl(var(--border))" strokeDasharray="3 3" opacity="0.4" />
            <text x={44} y={t.y + 3} fontSize="10" fill="hsl(var(--muted-foreground))" textAnchor="end">
              ${t.val.toFixed(2)}
            </text>
          </g>
        ))}

        {/* Bollinger band fill */}
        <path d={view.paths.bbArea} fill="hsl(var(--primary) / 0.06)" />
        <path d={view.paths.bbUpper} fill="none" stroke="hsl(var(--primary) / 0.4)" strokeWidth="1" strokeDasharray="3 3" />
        <path d={view.paths.bbLower} fill="none" stroke="hsl(var(--primary) / 0.4)" strokeWidth="1" strokeDasharray="3 3" />

        {/* EMAs */}
        <path d={view.paths.ema200} fill="none" stroke="hsl(0 70% 55%)" strokeWidth="1.5" opacity="0.85" />
        <path d={view.paths.ema50} fill="none" stroke="hsl(38 92% 50%)" strokeWidth="1.5" opacity="0.9" />
        <path d={view.paths.ema20} fill="none" stroke="hsl(142 70% 45%)" strokeWidth="1.5" opacity="0.9" />

        {/* Price */}
        <path d={view.paths.close} fill="none" stroke="hsl(var(--foreground))" strokeWidth="1.8" />

        {/* X-axis */}
        {view.dateLabels.map((d, i) => (
          <text key={i} x={d.x} y={view.height - 6} fontSize="10" fill="hsl(var(--muted-foreground))" textAnchor="middle">
            {d.label}
          </text>
        ))}
      </svg>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground justify-center">
        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-foreground" />Price</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5" style={{ background: "hsl(142 70% 45%)" }} />EMA 20</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5" style={{ background: "hsl(38 92% 50%)" }} />EMA 50</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5" style={{ background: "hsl(0 70% 55%)" }} />EMA 200</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-primary/40" style={{ borderTop: "1px dashed" }} />BB ±2σ</span>
      </div>
    </div>
  );
}
