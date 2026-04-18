import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, ArrowLeft, Clock } from "lucide-react";
import { EnhancedSignal } from "@/types/trading";
import { IndicatorData } from "@/lib/indicators";
import { Candle } from "@/lib/binanceApi";
import { TrackRecordContext } from "@/components/TrackRecordContext";
import MiniChart from "@/components/MiniChart";
import { getAssetName } from "@/lib/assetNames";

interface AssetIntelligencePageProps {
  symbol: string;
  currentPrice: number;
  macroSignal: EnhancedSignal;
  microSignal: EnhancedSignal;
  candles: Candle[];
  indicators: IndicatorData;
  onBack: () => void;
}

export function AssetIntelligencePage({
  symbol,
  currentPrice,
  macroSignal,
  microSignal,
  candles,
  indicators,
  onBack,
}: AssetIntelligencePageProps) {
  const getSignalConfig = (signal: EnhancedSignal) => {
    switch (signal.signal) {
      case "STRONG_BUY":
        return { color: "text-bullish", bg: "bg-bullish/10 border-bullish/30", icon: TrendingUp };
      case "BUY":
        return { color: "text-bullish", bg: "bg-bullish/10 border-bullish/30", icon: TrendingUp };
      case "STRONG_SELL":
        return { color: "text-bearish", bg: "bg-bearish/10 border-bearish/30", icon: TrendingDown };
      case "SELL":
        return { color: "text-bearish", bg: "bg-bearish/10 border-bearish/30", icon: TrendingDown };
      default:
        return { color: "text-neutral", bg: "bg-neutral/10 border-neutral/30", icon: Minus };
    }
  };

  const macroConfig = getSignalConfig(macroSignal);
  const MacroIcon = macroConfig.icon;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Overview
      </Button>

      {/* Decision Header - Above the Fold */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Asset Info */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{symbol}</h1>
                <Badge variant="outline">{getAssetName(symbol)}</Badge>
              </div>
              <p className="text-3xl font-bold">${currentPrice.toFixed(2)}</p>
            </div>

            {/* System Signal - The Verdict */}
            <div className={`px-6 py-4 rounded-xl border ${macroConfig.bg}`}>
              <p className="text-xs text-muted-foreground mb-1">System Signal (Daily)</p>
              <div className="flex items-center gap-3">
                <MacroIcon className={`h-6 w-6 ${macroConfig.color}`} />
                <span className={`text-2xl font-bold ${macroConfig.color}`}>
                  {macroSignal.signal.replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="text-muted-foreground">
                  Confidence: <span className="font-medium text-foreground">{macroSignal.confidence}%</span>
                </span>
                <Badge variant="outline" className="text-xs">
                  {macroSignal.trend === "BULLISH" ? "📈 Bullish" : macroSignal.trend === "BEARISH" ? "📉 Bearish" : "➡️ Neutral"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Signal Reasons */}
          {macroSignal.reasons.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border/50">
              <p className="text-sm font-medium mb-2">Signal Reasons:</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
                {macroSignal.reasons.map((reason, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Credibility */}
      <TrackRecordContext signalType={macroSignal.signal} />

      {/* Visual Context - Daily Chart */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Daily Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <MiniChart
            candles={candles}
            ema20={indicators.ema20}
            ema50={indicators.ema50}
          />
        </CardContent>
      </Card>

      {/* Execution Timing - Clearly Secondary */}
      <Card className="bg-muted/30 border-border/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              Execution Timing (1H)
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              Not Tracked
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground italic">
            For real-time context only — not part of system performance tracking
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-muted-foreground">Micro Signal: </span>
              <span className={`font-medium ${getSignalConfig(microSignal).color}`}>
                {microSignal.signal.replace("_", " ")}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              Confidence: {microSignal.confidence}%
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
