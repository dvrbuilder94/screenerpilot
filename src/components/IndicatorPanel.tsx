import { Card } from "@/components/ui/card";
import { IndicatorData, Signal } from "@/lib/indicators";
import { TrendingUp, TrendingDown, Activity, BarChart3, Zap } from "lucide-react";

interface IndicatorPanelProps {
  title: string;
  timeframe: string;
  indicators: IndicatorData;
  signal: Signal;
  score: number;
  currentPrice: number;
}

export default function IndicatorPanel({
  title,
  timeframe,
  indicators,
  signal,
  score,
  currentPrice,
}: IndicatorPanelProps) {
  const getSignalColor = () => {
    if (signal === 'BUY') return 'text-bullish';
    if (signal === 'SELL') return 'text-bearish';
    return 'text-neutral';
  };

  const getSignalBg = () => {
    if (signal === 'BUY') return 'bg-bullish/10 border-bullish/30';
    if (signal === 'SELL') return 'bg-bearish/10 border-bearish/30';
    return 'bg-neutral/10 border-neutral/30';
  };

  const lastEma20 = indicators.ema20[indicators.ema20.length - 1];
  const lastEma50 = indicators.ema50[indicators.ema50.length - 1];
  const lastRsi = indicators.rsi[indicators.rsi.length - 1];
  const lastMacd = indicators.macd.macd[indicators.macd.macd.length - 1];
  const lastSignal = indicators.macd.signal[indicators.macd.signal.length - 1];
  const lastAtr = indicators.atr[indicators.atr.length - 1];
  const atrPercent = (lastAtr / currentPrice) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">{title}</h3>
          <p className="text-sm text-muted-foreground">{timeframe}</p>
        </div>
        <div className={`px-4 py-2 rounded-xl border ${getSignalBg()}`}>
          <div className="text-xs text-muted-foreground mb-1">Señal</div>
          <div className={`text-2xl font-bold ${getSignalColor()}`}>{signal}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Score: {score > 0 ? '+' : ''}{score}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* EMA Card */}
        <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">EMA</p>
                <p className="text-sm font-semibold">Tendencia</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">EMA 20</span>
              <span className="font-mono font-semibold">${lastEma20.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">EMA 50</span>
              <span className="font-mono font-semibold">${lastEma50.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-border/50">
              <div className={`text-xs font-semibold ${lastEma20 > lastEma50 ? 'text-bullish' : 'text-bearish'}`}>
                {lastEma20 > lastEma50 ? '↑ Alcista' : '↓ Bajista'}
              </div>
            </div>
          </div>
        </Card>

        {/* RSI Card */}
        <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">RSI</p>
                <p className="text-sm font-semibold">Momentum</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-mono font-bold">{lastRsi.toFixed(1)}</div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  lastRsi > 70 ? 'bg-bearish' : lastRsi < 30 ? 'bg-bullish' : 'bg-primary'
                }`}
                style={{ width: `${Math.min(lastRsi, 100)}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {lastRsi > 70 ? 'Sobrecomprado' : lastRsi < 30 ? 'Sobrevendido' : 'Neutral'}
            </div>
          </div>
        </Card>

        {/* MACD Card */}
        <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">MACD</p>
                <p className="text-sm font-semibold">Convergencia</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">MACD</span>
              <span className="font-mono font-semibold">{lastMacd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Signal</span>
              <span className="font-mono font-semibold">{lastSignal.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-border/50">
              <div className={`text-xs font-semibold ${lastMacd > lastSignal ? 'text-bullish' : 'text-bearish'}`}>
                {lastMacd > lastSignal ? '↑ Positivo' : '↓ Negativo'}
              </div>
            </div>
          </div>
        </Card>

        {/* ATR Card */}
        <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ATR</p>
                <p className="text-sm font-semibold">Volatilidad</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-mono font-bold">${lastAtr.toFixed(2)}</div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Porcentaje</span>
              <span className="font-mono font-semibold">{atrPercent.toFixed(2)}%</span>
            </div>
            <div className="pt-2 border-t border-border/50">
              <div className="text-xs text-muted-foreground">
                {atrPercent > 3 ? 'Alta volatilidad' : atrPercent > 1.5 ? 'Volatilidad media' : 'Baja volatilidad'}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
