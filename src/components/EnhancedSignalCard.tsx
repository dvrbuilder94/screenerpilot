import { EnhancedSignal } from "@/types/trading";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Target, ShieldAlert } from "lucide-react";

interface EnhancedSignalCardProps {
  title: string;
  timeframe: string;
  signal: EnhancedSignal;
  currentPrice: number;
}

export default function EnhancedSignalCard({
  title,
  timeframe,
  signal,
  currentPrice,
}: EnhancedSignalCardProps) {
  const getSignalConfig = () => {
    switch (signal.signal) {
      case 'STRONG_BUY':
        return {
          color: 'text-bullish',
          bg: 'bg-bullish/10 border-bullish/30',
          gradient: 'from-bullish to-bullish-light',
          icon: TrendingUp,
        };
      case 'BUY':
        return {
          color: 'text-bullish',
          bg: 'bg-bullish/10 border-bullish/30',
          gradient: 'from-bullish/80 to-bullish-light/80',
          icon: TrendingUp,
        };
      case 'STRONG_SELL':
        return {
          color: 'text-bearish',
          bg: 'bg-bearish/10 border-bearish/30',
          gradient: 'from-bearish to-bearish-light',
          icon: TrendingDown,
        };
      case 'SELL':
        return {
          color: 'text-bearish',
          bg: 'bg-bearish/10 border-bearish/30',
          gradient: 'from-bearish/80 to-bearish-light/80',
          icon: TrendingDown,
        };
      default:
        return {
          color: 'text-neutral',
          bg: 'bg-neutral/10 border-neutral/30',
          gradient: 'from-neutral to-neutral-light',
          icon: Minus,
        };
    }
  };

  const config = getSignalConfig();
  const Icon = config.icon;

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold">{title}</h3>
          <p className="text-sm text-muted-foreground">{timeframe}</p>
        </div>
        <div className={`px-4 py-2 rounded-xl border ${config.bg}`}>
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${config.color}`} />
            <div className={`text-xl font-bold ${config.color}`}>
              {signal.signal.replace('_', ' ')}
            </div>
          </div>
          <div className="text-xs text-muted-foreground text-center mt-1">
            Score: {signal.score > 0 ? '+' : ''}{signal.score}
          </div>
        </div>
      </div>

      {/* Confidence Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Confianza</span>
          <span className="text-sm font-bold">{signal.confidence}%</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all bg-gradient-to-r ${config.gradient}`}
            style={{ width: `${signal.confidence}%` }}
          />
        </div>
      </div>

      {/* Reasons */}
      {signal.reasons.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Razones
          </h4>
          <ul className="space-y-1">
            {signal.reasons.map((reason, idx) => (
              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {signal.warnings.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
            <AlertTriangle className="h-4 w-4" />
            Advertencias
          </h4>
          <ul className="space-y-1">
            {signal.warnings.map((warning, idx) => (
              <li key={idx} className="text-sm text-yellow-700 dark:text-yellow-400 flex items-start gap-2">
                <span className="mt-0.5">⚠️</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Entry Zone & Risk Management */}
      {(signal.entryZone || signal.stopLoss || signal.targets) && (
        <div className="pt-4 border-t border-border/50 space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            Gestión de Riesgo
          </h4>

          {signal.entryZone && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Zona de entrada:</span>
              <span className="font-mono">
                ${signal.entryZone.min.toFixed(2)} - ${signal.entryZone.max.toFixed(2)}
              </span>
            </div>
          )}

          {signal.stopLoss && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Stop Loss:</span>
              <span className="font-mono text-bearish">
                ${signal.stopLoss.toFixed(2)}
              </span>
            </div>
          )}

          {signal.targets && signal.targets.length > 0 && (
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Objetivos:</span>
              {signal.targets.map((target, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Target {idx + 1}:</span>
                  <span className="font-mono text-bullish">
                    ${target.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Trend Badge */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <Badge variant="outline" className={config.bg}>
          Tendencia: {signal.trend === 'BULLISH' ? '📈 Alcista' : signal.trend === 'BEARISH' ? '📉 Bajista' : '➡️ Neutral'}
        </Badge>
      </div>
    </Card>
  );
}
