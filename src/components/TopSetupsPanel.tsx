import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TradingSetup } from "@/types/trading";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";

interface TopSetupsPanelProps {
  setups: TradingSetup[];
  onSelectSetup: (symbol: string) => void;
}

export default function TopSetupsPanel({ setups, onSelectSetup }: TopSetupsPanelProps) {
  const { language } = useLanguage();
  const t = translations[language];

  // Ordenar por confidence combinada
  const topSetups = [...setups]
    .sort((a, b) => b.combinedConfidence - a.combinedConfidence)
    .slice(0, 10);

  const getSignalColor = (signal: string) => {
    if (signal.includes('BULLISH')) return 'text-bullish';
    if (signal.includes('BEARISH')) return 'text-bearish';
    return 'text-neutral';
  };

  const getSignalBg = (signal: string) => {
    if (signal.includes('BULLISH')) return 'bg-bullish/10 border-bullish/30';
    if (signal.includes('BEARISH')) return 'bg-bearish/10 border-bearish/30';
    return 'bg-neutral/10 border-neutral/30';
  };

  const getSignalLabel = (signal: string) => {
    switch (signal) {
      case 'STRONG_BULLISH': return 'High-conviction Bullish';
      case 'BULLISH': return 'Bullish';
      case 'STRONG_BEARISH': return 'High-conviction Bearish';
      case 'BEARISH': return 'Bearish';
      case 'NEUTRAL_BIAS': return 'Mixed';
      default: return signal.replace('_', ' ');
    }
  };

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-6 w-6 text-yellow-500" />
        <h2 className="text-2xl font-bold">{t.topSetupsTitle}</h2>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        {t.topSetupsDesc}
      </p>

      <div className="space-y-3">
        {topSetups.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {t.noSetupsAvailable}
          </p>
        ) : (
          topSetups.map((setup, index) => (
            <button
              key={setup.symbol}
              onClick={() => onSelectSetup(setup.symbol)}
              className="w-full text-left"
            >
              <div className="flex items-center gap-4 p-4 bg-secondary/30 hover:bg-secondary/50 rounded-lg transition-all border border-border/50 hover:border-primary/50">
                {/* Rank */}
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-500 text-black' :
                    index === 1 ? 'bg-gray-400 text-black' :
                    index === 2 ? 'bg-orange-600 text-white' :
                    'bg-secondary text-foreground'
                  }`}>
                    {index + 1}
                  </div>
                </div>

                {/* Symbol & Asset Type */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-lg">{setup.symbol}</span>
                    <Badge variant="outline" className="text-xs">
                      {setup.assetType}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ${setup.currentPrice.toFixed(2)}
                  </div>
                </div>

                {/* Signals */}
                <div className="flex gap-2">
                  <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${getSignalBg(setup.macroSignal.signal)} ${getSignalColor(setup.macroSignal.signal)}`}>
                    {getSignalLabel(setup.macroSignal.signal)}
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${getSignalBg(setup.microSignal.signal)} ${getSignalColor(setup.microSignal.signal)}`}>
                    {getSignalLabel(setup.microSignal.signal)}
                  </div>
                </div>

                {/* Confidence */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-2xl font-bold text-primary">
                    {setup.combinedConfidence.toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t.confidence}
                  </div>
                </div>

                {/* Trend Icon */}
                <div className="flex-shrink-0">
                  {setup.macroSignal.trend === 'BULLISH' ? (
                    <TrendingUp className="h-6 w-6 text-bullish" />
                  ) : setup.macroSignal.trend === 'BEARISH' ? (
                    <TrendingDown className="h-6 w-6 text-bearish" />
                  ) : (
                    <div className="h-6 w-6" />
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </Card>
  );
}
