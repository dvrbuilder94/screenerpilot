import { Signal } from "@/lib/indicators";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface CombinedSignalProps {
  macroSignal: Signal;
  microSignal: Signal;
  macroScore: number;
  microScore: number;
}

export default function CombinedSignal({
  macroSignal,
  microSignal,
  macroScore,
  microScore,
}: CombinedSignalProps) {
  const getCombinedSignal = () => {
    if (macroSignal === 'BUY' && microSignal === 'BUY') {
      return {
        text: 'STRONG BUY 🔥',
        color: 'bullish',
        gradient: 'from-bullish to-bullish-light',
        icon: TrendingUp,
        description: 'Tendencia macro y señal micro alcistas. Alto potencial.',
      };
    }
    if (macroSignal === 'SELL' && microSignal === 'SELL') {
      return {
        text: 'STRONG SELL ⚠️',
        color: 'bearish',
        gradient: 'from-bearish to-bearish-light',
        icon: TrendingDown,
        description: 'Tendencia macro y señal micro bajistas. Evitar posiciones largas.',
      };
    }
    if (macroSignal === 'BUY' && microSignal === 'HOLD') {
      return {
        text: 'TENDENCIA ALCISTA - Esperar entrada 📊',
        color: 'neutral',
        gradient: 'from-neutral to-neutral-light',
        icon: TrendingUp,
        description: 'Macro alcista pero micro neutral. Buscar mejores puntos de entrada.',
      };
    }
    if (macroSignal === 'SELL' && microSignal === 'HOLD') {
      return {
        text: 'TENDENCIA BAJISTA - Evitar largos 📉',
        color: 'neutral',
        gradient: 'from-neutral to-bearish-light',
        icon: TrendingDown,
        description: 'Macro bajista. Esperar cambio de tendencia para comprar.',
      };
    }
    if (macroSignal === 'BUY' && microSignal === 'SELL') {
      return {
        text: 'SEÑALES MIXTAS - Retroceso en tendencia alcista 🤔',
        color: 'muted',
        gradient: 'from-muted to-accent',
        icon: Minus,
        description: 'Macro alcista pero micro bajista. Posible corrección a corto plazo.',
      };
    }
    if (macroSignal === 'SELL' && microSignal === 'BUY') {
      return {
        text: 'SEÑALES MIXTAS - Rebote en tendencia bajista 🤔',
        color: 'muted',
        gradient: 'from-muted to-accent',
        icon: Minus,
        description: 'Macro bajista pero micro alcista. Posible rebote temporal.',
      };
    }
    return {
      text: 'NEUTRAL - Sin señal clara 💤',
      color: 'muted',
      gradient: 'from-muted to-muted-foreground',
      icon: Minus,
      description: 'Sin señales claras. Esperar confirmación de tendencia.',
    };
  };

  const signal = getCombinedSignal();
  const Icon = signal.icon;

  return (
    <div className={`bg-gradient-to-r ${signal.gradient} rounded-2xl p-8 shadow-xl border border-border/50`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-background/20 backdrop-blur-sm rounded-xl p-3">
            <Icon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">{signal.text}</h2>
            <p className="text-white/90 text-sm">{signal.description}</p>
          </div>
        </div>
        <div className="text-right bg-background/20 backdrop-blur-sm rounded-xl p-4">
          <div className="text-white/70 text-xs mb-1">Scores</div>
          <div className="text-2xl font-mono font-bold text-white">
            {macroScore > 0 ? '+' : ''}{macroScore} / {microScore > 0 ? '+' : ''}{microScore}
          </div>
          <div className="text-white/70 text-xs mt-1">Macro / Micro</div>
        </div>
      </div>
    </div>
  );
}
