import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TradingSetup } from "@/types/trading";
import { TrendingUp, TrendingDown } from "lucide-react";

interface SignalsListProps {
  setups: TradingSetup[];
  onSelectSetup: (symbol: string) => void;
}

export default function SignalsList({ setups, onSelectSetup }: SignalsListProps) {
  const macroBuySignals = setups.filter(s => 
    s.macroSignal.signal === 'BULLISH' || s.macroSignal.signal === 'STRONG_BULLISH'
  );
  const macroSellSignals = setups.filter(s => 
    s.macroSignal.signal === 'BEARISH' || s.macroSignal.signal === 'STRONG_BEARISH'
  );
  const microBuySignals = setups.filter(s => 
    s.microSignal.signal === 'BULLISH' || s.microSignal.signal === 'STRONG_BULLISH'
  );
  const microSellSignals = setups.filter(s => 
    s.microSignal.signal === 'BEARISH' || s.microSignal.signal === 'STRONG_BEARISH'
  );

  const renderSignalGroup = (title: string, signals: TradingSetup[], isBuy: boolean) => (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        {isBuy ? (
          <TrendingUp className="h-5 w-5 text-green-500" />
        ) : (
          <TrendingDown className="h-5 w-5 text-red-500" />
        )}
        <h3 className="text-lg font-semibold">{title}</h3>
        <Badge variant={isBuy ? "default" : "destructive"}>{signals.length}</Badge>
      </div>
      <div className="space-y-2">
        {signals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No setups</p>
        ) : (
          signals.map((setup) => (
            <button
              key={setup.symbol}
              onClick={() => onSelectSetup(setup.symbol)}
              className="w-full text-left p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono font-semibold">{setup.symbol}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {setup.assetType}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono">${setup.currentPrice.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">
                    {setup.combinedConfidence.toFixed(0)}% score
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {renderSignalGroup("Macro Bullish Setups", macroBuySignals, true)}
      {renderSignalGroup("Macro Bearish Setups", macroSellSignals, false)}
      {renderSignalGroup("Micro Bullish Setups", microBuySignals, true)}
      {renderSignalGroup("Micro Bearish Setups", microSellSignals, false)}
    </div>
  );
}
