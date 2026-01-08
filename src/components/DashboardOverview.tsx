import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { TradingSetup, SignalType } from "@/types/trading";
import { MarketSummaryCards } from "@/components/MarketSummaryCards";
import { Sparkline } from "@/components/Sparkline";
import { getAssetName } from "@/lib/assetNames";
import { cn } from "@/lib/utils";

interface DashboardOverviewProps {
  allSignals: TradingSetup[];
  onSelectSymbol: (symbol: string) => void;
  isLoading: boolean;
}

type AssetCategory = "ALL" | "crypto" | "stock" | "etf" | "index" | "commodity";

export function DashboardOverview({
  allSignals,
  onSelectSymbol,
  isLoading,
}: DashboardOverviewProps) {
  const [category, setCategory] = useState<AssetCategory>("ALL");

  const filteredSignals = useMemo(() => {
    if (category === "ALL") return allSignals;
    return allSignals.filter((s) => s.assetType === category);
  }, [allSignals, category]);

  const topBullish = useMemo(() => {
    return [...filteredSignals]
      .filter((s) => ["STRONG_BUY", "BUY"].includes(s.macroSignal.signal))
      .sort((a, b) => b.combinedConfidence - a.combinedConfidence)
      .slice(0, 6);
  }, [filteredSignals]);

  const topBearish = useMemo(() => {
    return [...filteredSignals]
      .filter((s) => ["STRONG_SELL", "SELL"].includes(s.macroSignal.signal))
      .sort((a, b) => b.combinedConfidence - a.combinedConfidence)
      .slice(0, 6);
  }, [filteredSignals]);

  const categories: { value: AssetCategory; label: string }[] = [
    { value: "ALL", label: "All" },
    { value: "stock", label: "Stocks" },
    { value: "crypto", label: "Crypto" },
    { value: "etf", label: "ETFs" },
    { value: "index", label: "Indices" },
    { value: "commodity", label: "Commodities" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Market Overview</h1>
        <p className="text-muted-foreground">
          Daily signals across all tracked assets
        </p>
      </div>

      {/* Market Summary Cards */}
      <MarketSummaryCards signals={allSignals} isLoading={isLoading} />

      {/* Category Tabs */}
      <Tabs value={category} onValueChange={(v) => setCategory(v as AssetCategory)}>
        <TabsList className="grid w-full grid-cols-6">
          {categories.map((cat) => (
            <TabsTrigger key={cat.value} value={cat.value}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={category} className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Bullish */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-bullish" />
                  Top Bullish Signals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {topBullish.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No bullish signals in this category
                  </p>
                ) : (
                  topBullish.map((setup) => (
                    <SignalRow
                      key={setup.symbol}
                      setup={setup}
                      onClick={() => onSelectSymbol(setup.symbol)}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Top Bearish */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-bearish" />
                  Top Bearish Signals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {topBearish.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No bearish signals in this category
                  </p>
                ) : (
                  topBearish.map((setup) => (
                    <SignalRow
                      key={setup.symbol}
                      setup={setup}
                      onClick={() => onSelectSymbol(setup.symbol)}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SignalRow({
  setup,
  onClick,
}: {
  setup: TradingSetup;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent hover:border-primary/50 transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{setup.symbol}</span>
            <Badge variant="outline" className="text-xs">
              {setup.assetType}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{getAssetName(setup.symbol)}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {setup.recentPrices && setup.recentPrices.length > 1 && (
          <Sparkline data={setup.recentPrices} width={50} height={16} />
        )}
        
        <div className="text-right">
          <p className="text-sm font-medium">${setup.currentPrice.toFixed(2)}</p>
          {setup.priceChange24h !== undefined && (
            <p className={cn(
              "text-xs",
              setup.priceChange24h >= 0 ? "text-bullish" : "text-bearish"
            )}>
              {setup.priceChange24h >= 0 ? "+" : ""}{setup.priceChange24h.toFixed(2)}%
            </p>
          )}
        </div>

        <Badge className={getSignalBadgeClass(setup.macroSignal.signal)}>
          {setup.macroSignal.signal.replace("_", " ")}
        </Badge>

        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </button>
  );
}

function getSignalBadgeClass(signal: SignalType): string {
  switch (signal) {
    case "STRONG_BUY":
      return "bg-bullish hover:bg-bullish/90 text-white";
    case "BUY":
      return "bg-bullish/80 hover:bg-bullish/70 text-white";
    case "HOLD":
      return "bg-neutral hover:bg-neutral/90 text-white";
    case "SELL":
      return "bg-bearish/80 hover:bg-bearish/70 text-white";
    case "STRONG_SELL":
      return "bg-bearish hover:bg-bearish/90 text-white";
    default:
      return "bg-secondary hover:bg-secondary/80";
  }
}
