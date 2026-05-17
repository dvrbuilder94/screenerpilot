import { Signal } from "@/lib/indicators";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";

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
  const { language } = useLanguage();
  const t = translations[language];

  const getCombinedSignal = () => {
    if (macroSignal === 'BULLISH' && microSignal === 'BULLISH') {
      return {
        text: t.strongBuy,
        color: 'bullish',
        gradient: 'from-bullish to-bullish-light',
        icon: TrendingUp,
        description: t.strongBuyDesc,
      };
    }
    if (macroSignal === 'BEARISH' && microSignal === 'BEARISH') {
      return {
        text: t.strongSell,
        color: 'bearish',
        gradient: 'from-bearish to-bearish-light',
        icon: TrendingDown,
        description: t.strongSellDesc,
      };
    }
    if (macroSignal === 'BULLISH' && microSignal === 'NEUTRAL_BIAS') {
      return {
        text: t.bullishTrendWaitEntry,
        color: 'neutral',
        gradient: 'from-neutral to-neutral-light',
        icon: TrendingUp,
        description: t.bullishTrendDesc,
      };
    }
    if (macroSignal === 'BEARISH' && microSignal === 'NEUTRAL_BIAS') {
      return {
        text: t.bearishTrendAvoidLongs,
        color: 'neutral',
        gradient: 'from-neutral to-bearish-light',
        icon: TrendingDown,
        description: t.bearishTrendDesc,
      };
    }
    if (macroSignal === 'BULLISH' && microSignal === 'BEARISH') {
      return {
        text: t.mixedSignalsPullback,
        color: 'muted',
        gradient: 'from-muted to-accent',
        icon: Minus,
        description: t.mixedSignalsPullbackDesc,
      };
    }
    if (macroSignal === 'BEARISH' && microSignal === 'BULLISH') {
      return {
        text: t.mixedSignalsBounce,
        color: 'muted',
        gradient: 'from-muted to-accent',
        icon: Minus,
        description: t.mixedSignalsBounceDesc,
      };
    }
    return {
      text: t.neutralNoSignal,
      color: 'muted',
      gradient: 'from-muted to-muted-foreground',
      icon: Minus,
      description: t.neutralNoSignalDesc,
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
          <div className="text-white/70 text-xs mb-1">{t.scores}</div>
          <div className="text-2xl font-mono font-bold text-white">
            {macroScore > 0 ? '+' : ''}{macroScore} / {microScore > 0 ? '+' : ''}{microScore}
          </div>
          <div className="text-white/70 text-xs mt-1">{t.macro} / {t.micro}</div>
        </div>
      </div>
    </div>
  );
}
