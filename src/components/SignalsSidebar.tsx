import { useState, useMemo } from "react";
import { Search, TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TradingSetup, SignalType } from "@/types/trading";
import { cn } from "@/lib/utils";
import { getAssetName } from "@/lib/assetNames";
import { Sparkline } from "@/components/Sparkline";

interface SignalsSidebarProps {
  allSignals: TradingSetup[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  isLoading: boolean;
  lastUpdate?: number;
}

type SortOption = "confidence" | "signal" | "alphabetical" | "price";
type FilterAssetType = "ALL" | "crypto" | "stock" | "index" | "etf" | "commodity";

export function SignalsSidebar({
  allSignals,
  selectedSymbol,
  onSelectSymbol,
  isLoading,
  lastUpdate,
}: SignalsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("confidence");
  const [filterAsset, setFilterAsset] = useState<FilterAssetType>("ALL");

  const filteredAndSorted = useMemo(() => {
    let filtered = allSignals;

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter((setup) =>
        setup.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by asset type
    if (filterAsset !== "ALL") {
      filtered = filtered.filter((setup) => setup.assetType === filterAsset);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "confidence":
          return b.combinedConfidence - a.combinedConfidence;
        case "signal":
          return getSignalPriority(b.macroSignal.signal) - getSignalPriority(a.macroSignal.signal);
        case "alphabetical":
          return a.symbol.localeCompare(b.symbol);
        case "price":
          return b.currentPrice - a.currentPrice;
        default:
          return 0;
      }
    });

    return sorted;
  }, [allSignals, searchQuery, filterAsset, sortBy]);

  const stats = useMemo(() => {
    const strongBuy = allSignals.filter(s => s.macroSignal.signal === "STRONG_BUY").length;
    const buy = allSignals.filter(s => s.macroSignal.signal === "BUY").length;
    const sell = allSignals.filter(s => s.macroSignal.signal === "SELL").length;
    const strongSell = allSignals.filter(s => s.macroSignal.signal === "STRONG_SELL").length;
    const bullish = strongBuy + buy;
    const bearish = sell + strongSell;

    return { strongBuy, buy, sell, strongSell, bullish, bearish, total: allSignals.length };
  }, [allSignals]);

  return (
    <div className="flex flex-col h-full border-r border-border bg-background">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <h2 className="text-sm font-semibold mb-2 text-foreground">Daily Signals</h2>
        
        {/* Stats */}
        <div className="flex gap-2 mb-3 text-xs">
          <Badge variant="outline" className="flex gap-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            {stats.bullish}
          </Badge>
          <Badge variant="outline" className="flex gap-1">
            <TrendingDown className="h-3 w-3 text-red-500" />
            {stats.bearish}
          </Badge>
          <Badge variant="secondary">{stats.total} total</Badge>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-1">
          <Select value={filterAsset} onValueChange={(v) => setFilterAsset(v as FilterAssetType)}>
            <SelectTrigger className="flex-1 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="crypto">Crypto</SelectItem>
              <SelectItem value="stock">Stocks</SelectItem>
              <SelectItem value="commodity">Commodities</SelectItem>
              <SelectItem value="index">Indices</SelectItem>
              <SelectItem value="etf">ETFs</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="flex-1 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="confidence">Confidence</SelectItem>
              <SelectItem value="signal">Signal</SelectItem>
              <SelectItem value="alphabetical">A-Z</SelectItem>
              <SelectItem value="price">Price</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {lastUpdate && (
          <p className="text-xs text-muted-foreground mt-2">
            Last update: {new Date(lastUpdate).toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Signals List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading && allSignals.length === 0 ? (
            <>
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-20 mb-2" />
              ))}
            </>
          ) : (
            filteredAndSorted.map((setup) => (
              <button
                key={setup.symbol}
                onClick={() => onSelectSymbol(setup.symbol)}
                className={cn(
                  "w-full p-2 mb-1 rounded-lg border border-border/50",
                  "hover:bg-accent hover:border-primary/50 transition-colors",
                  "text-left",
                  selectedSymbol === setup.symbol && "bg-accent border-primary"
                )}
              >
              <div className="flex items-start justify-between mb-1">
                  <div>
                    <span className="font-semibold text-foreground">{setup.symbol}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {setup.assetType}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-foreground">
                      ${setup.currentPrice.toFixed(2)}
                    </span>
                    {setup.priceChange24h !== undefined && (
                      <span className={cn(
                        "block text-xs font-medium",
                        setup.priceChange24h >= 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {setup.priceChange24h >= 0 ? "+" : ""}{setup.priceChange24h.toFixed(2)}%
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-1">{getAssetName(setup.symbol)}</p>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className={getSignalBadgeClass(setup.macroSignal.signal)}>
                      {setup.macroSignal.signal.replace("_", " ")}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {setup.combinedConfidence}%
                    </span>
                  </div>
                  {setup.recentPrices && setup.recentPrices.length > 1 && (
                    <Sparkline data={setup.recentPrices} width={50} height={16} />
                  )}
                </div>

                <div className="flex items-center gap-1 mt-1">
                  {setup.macroSignal.trend === "BULLISH" ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : setup.macroSignal.trend === "BEARISH" ? (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span className="text-xs text-muted-foreground">{setup.macroSignal.trend}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function getSignalPriority(signal: SignalType): number {
  const priorities: Record<SignalType, number> = {
    STRONG_BUY: 5,
    BUY: 4,
    HOLD: 3,
    SELL: 2,
    STRONG_SELL: 1,
  };
  return priorities[signal] || 0;
}

function getSignalBadgeClass(signal: SignalType): string {
  switch (signal) {
    case "STRONG_BUY":
      return "bg-green-500 hover:bg-green-600 text-white";
    case "BUY":
      return "bg-green-400 hover:bg-green-500 text-white";
    case "HOLD":
      return "bg-yellow-500 hover:bg-yellow-600 text-white";
    case "SELL":
      return "bg-red-400 hover:bg-red-500 text-white";
    case "STRONG_SELL":
      return "bg-red-500 hover:bg-red-600 text-white";
    default:
      return "bg-secondary hover:bg-secondary/80";
  }
}

function getSignalLabel(signal: SignalType): string {
  switch (signal) {
    case "STRONG_BUY": return "High-conviction Bullish";
    case "BUY": return "Bullish";
    case "STRONG_SELL": return "High-conviction Bearish";
    case "SELL": return "Bearish";
    case "HOLD": return "Mixed";
    default: return String(signal).replace("_", " ");
  }
}
