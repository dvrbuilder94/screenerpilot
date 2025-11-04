import { Card } from "@/components/ui/card";
import { IndicatorData, Signal } from "@/lib/indicators";
import { TrendingUp, TrendingDown, Activity, BarChart3, Zap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";

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
  const { language } = useLanguage();
  const t = translations[language];

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

  const lastEma20 = indicators.ema20[indicators.ema20.length - 1] || 0;
  const lastEma50 = indicators.ema50[indicators.ema50.length - 1] || 0;
  const lastRsi = indicators.rsi[indicators.rsi.length - 1] || 0;
  const lastMacd = indicators.macd.macd[indicators.macd.macd.length - 1] || 0;
  const lastSignal = indicators.macd.signal[indicators.macd.signal.length - 1] || 0;
  const lastAtr = indicators.atr[indicators.atr.length - 1] || 0;
  const atrPercent = currentPrice > 0 ? (lastAtr / currentPrice) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">{title}</h3>
          <p className="text-sm text-muted-foreground">{timeframe}</p>
        </div>
        <div className={`px-4 py-2 rounded-xl border ${getSignalBg()}`}>
          <div className="text-xs text-muted-foreground mb-1">{t.signalLabel}</div>
          <div className={`text-2xl font-bold ${getSignalColor()}`}>{signal}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {t.score}: {score > 0 ? '+' : ''}{score}
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
                <p className="text-xs text-muted-foreground">{t.ema}</p>
                <p className="text-sm font-semibold">{t.trend}</p>
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
                {lastEma20 > lastEma50 ? t.bullishTrend : t.bearishTrend}
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
                <p className="text-xs text-muted-foreground">{t.rsi}</p>
                <p className="text-sm font-semibold">{t.momentum}</p>
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
              {lastRsi > 70 ? t.overbought : lastRsi < 30 ? t.oversold : t.neutral}
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
                <p className="text-xs text-muted-foreground">{t.macd}</p>
                <p className="text-sm font-semibold">{t.convergence}</p>
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
                {lastMacd > lastSignal ? t.positive : t.negative}
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
                <p className="text-xs text-muted-foreground">{t.atr}</p>
                <p className="text-sm font-semibold">{t.volatility}</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-mono font-bold">${lastAtr.toFixed(2)}</div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">{t.percentage}</span>
              <span className="font-mono font-semibold">{atrPercent.toFixed(2)}%</span>
            </div>
            <div className="pt-2 border-t border-border/50">
              <div className="text-xs text-muted-foreground">
                {atrPercent > 3 ? t.highVolatility : atrPercent > 1.5 ? t.mediumVolatility : t.lowVolatility}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
