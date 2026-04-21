import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, BarChart3, Waves, TrendingUp } from "lucide-react";

type Tone = "positive" | "negative" | "neutral";

const toneClass = (t: Tone) =>
  t === "positive" ? "text-emerald-500" : t === "negative" ? "text-red-500" : "text-amber-500";

const toneBg = (t: Tone) =>
  t === "positive" ? "bg-emerald-500/10 border-emerald-500/30"
  : t === "negative" ? "bg-red-500/10 border-red-500/30"
  : "bg-amber-500/10 border-amber-500/30";

function Row({ label, value, tone = "neutral" as Tone }: { label: string; value: string; tone?: Tone }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-border/40 last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono font-medium ${toneClass(tone)}`}>{value}</span>
    </div>
  );
}

interface Indicators {
  rsi: { value: number; label: string; tone: Tone };
  macd: { macd: number; signal: number; hist: number; label: string; tone: Tone };
  bollinger: { upper: number; mid: number; lower: number; width: number; label: string; tone: Tone };
  emas: { ema20: number | null; ema50: number | null; ema200: number | null };
  range52w: { high: number; low: number; position: number };
}

export default function IndicatorPanels({ indicators, price }: { indicators: Indicators; price: number }) {
  const { rsi, macd, bollinger, emas, range52w } = indicators;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* EMAs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />Moving Averages
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {(["ema20", "ema50", "ema200"] as const).map(k => {
            const v = emas[k];
            if (v == null) return <Row key={k} label={k.toUpperCase()} value="n/a" />;
            const dist = ((price - v) / v) * 100;
            const tone: Tone = dist > 0 ? "positive" : "negative";
            return (
              <Row
                key={k}
                label={k.toUpperCase().replace("EMA", "EMA ")}
                value={`$${v.toFixed(2)} · ${dist >= 0 ? "+" : ""}${dist.toFixed(1)}%`}
                tone={tone}
              />
            );
          })}
        </CardContent>
      </Card>

      {/* RSI */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />RSI (14)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <div className={`px-3 py-2 rounded border text-sm font-medium ${toneBg(rsi.tone)} ${toneClass(rsi.tone)}`}>
            {rsi.label}
          </div>
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div className="absolute left-[30%] top-0 bottom-0 w-px bg-border" />
            <div className="absolute left-[70%] top-0 bottom-0 w-px bg-border" />
            <div
              className="absolute top-0 bottom-0 w-1 bg-foreground rounded"
              style={{ left: `${Math.max(0, Math.min(100, rsi.value))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
            <span>0</span><span>30</span><span>50</span><span>70</span><span>100</span>
          </div>
        </CardContent>
      </Card>

      {/* MACD */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />MACD (12,26,9)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className={`px-3 py-2 mb-2 rounded border text-sm font-medium ${toneBg(macd.tone)} ${toneClass(macd.tone)}`}>
            {macd.label}
          </div>
          <Row label="MACD line" value={macd.macd.toFixed(3)} />
          <Row label="Signal" value={macd.signal.toFixed(3)} />
          <Row
            label="Histogram"
            value={macd.hist.toFixed(3)}
            tone={macd.hist > 0 ? "positive" : "negative"}
          />
        </CardContent>
      </Card>

      {/* Bollinger */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Waves className="h-4 w-4 text-primary" />Bollinger Bands (20, 2σ)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className={`px-3 py-2 mb-2 rounded border text-sm font-medium ${toneBg(bollinger.tone)} ${toneClass(bollinger.tone)}`}>
            {bollinger.label}
          </div>
          <Row label="Upper" value={`$${bollinger.upper.toFixed(2)}`} />
          <Row label="Middle (SMA20)" value={`$${bollinger.mid.toFixed(2)}`} />
          <Row label="Lower" value={`$${bollinger.lower.toFixed(2)}`} />
          <Row
            label="Band width"
            value={`${bollinger.width.toFixed(2)}%`}
            tone={bollinger.width < 5 ? "positive" : "neutral"}
          />
        </CardContent>
      </Card>

      {/* 52w range */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">52-Week Range</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute top-0 bottom-0 bg-gradient-to-r from-red-500/40 via-amber-500/40 to-emerald-500/40"
              style={{ width: "100%" }}
            />
            <div
              className="absolute top-0 bottom-0 w-1 bg-foreground"
              style={{ left: `${Math.max(0, Math.min(100, range52w.position))}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-mono text-muted-foreground">
            <span>${range52w.low.toFixed(2)}</span>
            <span className="text-foreground font-semibold">${price.toFixed(2)} · {range52w.position.toFixed(0)}%</span>
            <span>${range52w.high.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
