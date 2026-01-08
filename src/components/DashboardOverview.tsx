import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, ArrowRight, BarChart3, Activity, Target } from "lucide-react";
import { TradingSetup, SignalType } from "@/types/trading";
import { Sparkline } from "@/components/Sparkline";
import { getAssetName } from "@/lib/assetNames";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DashboardOverviewProps {
  allSignals: TradingSetup[];
  onSelectSymbol: (symbol: string) => void;
  isLoading: boolean;
  searchQuery: string;
  category: string;
}

export function DashboardOverview({
  allSignals,
  onSelectSymbol,
  isLoading,
  searchQuery,
  category,
}: DashboardOverviewProps) {
  // Filter signals by category and search
  const filteredSignals = useMemo(() => {
    let signals = allSignals;
    
    if (category !== "ALL") {
      signals = signals.filter((s) => s.assetType === category);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      signals = signals.filter(
        (s) =>
          s.symbol.toLowerCase().includes(query) ||
          getAssetName(s.symbol).toLowerCase().includes(query)
      );
    }
    
    return signals;
  }, [allSignals, category, searchQuery]);

  // Market summary stats (daily signals only)
  const stats = useMemo(() => {
    const total = filteredSignals.length;
    const bullish = filteredSignals.filter((s) =>
      ["STRONG_BUY", "BUY"].includes(s.macroSignal.signal)
    ).length;
    const bearish = filteredSignals.filter((s) =>
      ["STRONG_SELL", "SELL"].includes(s.macroSignal.signal)
    ).length;
    const strongSignals = filteredSignals.filter((s) =>
      ["STRONG_BUY", "STRONG_SELL"].includes(s.macroSignal.signal)
    ).length;

    return {
      total,
      bullishPct: total > 0 ? Math.round((bullish / total) * 100) : 0,
      bearishPct: total > 0 ? Math.round((bearish / total) * 100) : 0,
      strongSignals,
    };
  }, [filteredSignals]);

  // Sort by combined confidence descending
  const sortedSignals = useMemo(() => {
    return [...filteredSignals].sort((a, b) => b.combinedConfidence - a.combinedConfidence);
  }, [filteredSignals]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Market Overview</h1>
        <p className="text-muted-foreground mt-1">
          Daily signals across all tracked assets
        </p>
      </div>

      {/* Market Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          icon={<BarChart3 className="h-4 w-4" />}
          label="Total Assets"
          value={stats.total.toString()}
          isLoading={isLoading}
        />
        <SummaryCard
          icon={<TrendingUp className="h-4 w-4 text-bullish" />}
          label="Bullish"
          value={`${stats.bullishPct}%`}
          valueClass="text-bullish"
          isLoading={isLoading}
        />
        <SummaryCard
          icon={<TrendingDown className="h-4 w-4 text-bearish" />}
          label="Bearish"
          value={`${stats.bearishPct}%`}
          valueClass="text-bearish"
          isLoading={isLoading}
        />
        <SummaryCard
          icon={<Target className="h-4 w-4 text-primary" />}
          label="Strong Signals"
          value={stats.strongSignals.toString()}
          isLoading={isLoading}
        />
      </div>

      {/* Asset Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            {category === "ALL" ? "All Assets" : getCategoryLabel(category)}
            <Badge variant="secondary" className="ml-2 font-normal">
              {filteredSignals.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Scanning assets...
            </div>
          ) : filteredSignals.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No assets found
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/50">
                      <TableHead className="w-[200px]">Asset</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">24h %</TableHead>
                      <TableHead className="w-[80px]">Chart</TableHead>
                      <TableHead className="text-center">Signal</TableHead>
                      <TableHead className="text-center">Confidence</TableHead>
                      <TableHead className="text-center">Trend</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedSignals.map((setup) => (
                      <TableRow
                        key={setup.symbol}
                        onClick={() => onSelectSymbol(setup.symbol)}
                        className="cursor-pointer hover:bg-muted/50 transition-colors border-border/30"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{setup.symbol}</span>
                                <Badge variant="outline" className="text-xs font-normal">
                                  {setup.assetType}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {getAssetName(setup.symbol)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${formatPrice(setup.currentPrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          {setup.priceChange24h !== undefined && (
                            <span
                              className={cn(
                                "font-medium",
                                setup.priceChange24h >= 0 ? "text-bullish" : "text-bearish"
                              )}
                            >
                              {setup.priceChange24h >= 0 ? "+" : ""}
                              {setup.priceChange24h.toFixed(2)}%
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {setup.recentPrices && setup.recentPrices.length > 1 && (
                            <Sparkline data={setup.recentPrices} width={60} height={20} />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={getSignalBadgeClass(setup.macroSignal.signal)}>
                            {setup.macroSignal.signal.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm font-medium">
                            {setup.macroSignal.confidence}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={cn(
                              "text-sm",
                              setup.macroSignal.trend === "BULLISH"
                                ? "text-bullish"
                                : setup.macroSignal.trend === "BEARISH"
                                ? "text-bearish"
                                : "text-muted-foreground"
                            )}
                          >
                            {setup.macroSignal.trend.charAt(0) +
                              setup.macroSignal.trend.slice(1).toLowerCase()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-border/30">
                {sortedSignals.map((setup) => (
                  <button
                    key={setup.symbol}
                    onClick={() => onSelectSymbol(setup.symbol)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{setup.symbol}</span>
                          <Badge variant="outline" className="text-xs font-normal">
                            {setup.assetType}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {getAssetName(setup.symbol)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          ${formatPrice(setup.currentPrice)}
                        </p>
                        {setup.priceChange24h !== undefined && (
                          <p
                            className={cn(
                              "text-xs",
                              setup.priceChange24h >= 0 ? "text-bullish" : "text-bearish"
                            )}
                          >
                            {setup.priceChange24h >= 0 ? "+" : ""}
                            {setup.priceChange24h.toFixed(2)}%
                          </p>
                        )}
                      </div>

                      <Badge className={getSignalBadgeClass(setup.macroSignal.signal)}>
                        {setup.macroSignal.signal.replace("_", " ")}
                      </Badge>

                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  valueClass,
  isLoading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
  isLoading?: boolean;
}) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          {icon}
          <span className="text-sm">{label}</span>
        </div>
        {isLoading ? (
          <div className="h-8 w-16 bg-muted/50 rounded animate-pulse" />
        ) : (
          <p className={cn("text-2xl font-semibold", valueClass)}>{value}</p>
        )}
      </CardContent>
    </Card>
  );
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    stock: "Stocks",
    crypto: "Crypto",
    etf: "ETFs",
    index: "Indices",
    commodity: "Commodities",
  };
  return labels[category] || category;
}

function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
  } else if (price >= 1) {
    return price.toFixed(2);
  } else {
    return price.toPrecision(4);
  }
}

function getSignalBadgeClass(signal: SignalType): string {
  switch (signal) {
    case "STRONG_BUY":
      return "bg-bullish hover:bg-bullish/90 text-bullish-foreground";
    case "BUY":
      return "bg-bullish/80 hover:bg-bullish/70 text-bullish-foreground";
    case "HOLD":
      return "bg-neutral hover:bg-neutral/90 text-neutral-foreground";
    case "SELL":
      return "bg-bearish/80 hover:bg-bearish/70 text-bearish-foreground";
    case "STRONG_SELL":
      return "bg-bearish hover:bg-bearish/90 text-bearish-foreground";
    default:
      return "bg-secondary hover:bg-secondary/80";
  }
}
