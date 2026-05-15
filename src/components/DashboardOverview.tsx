import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, ArrowRight, BarChart3, Activity, Target, ChevronUp, ChevronDown, Search, RefreshCw, Percent } from "lucide-react";
import { TradingSetup, SignalType } from "@/types/trading";
import { Sparkline } from "@/components/Sparkline";
import { getAssetName } from "@/lib/assetNames";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { CategoryFilterTabs } from "@/components/CategoryFilterTabs";
import { MarketRegimeBadges } from "@/components/MarketRegimeBadges";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type SortField = "symbol" | "category" | "price" | "change" | "signal" | "confidence" | "trend" | "volume";
type SortDirection = "asc" | "desc";

const ITEMS_PER_PAGE = 25;

interface DashboardOverviewProps {
  allSignals: TradingSetup[];
  onSelectSymbol: (symbol: string) => void;
  isLoading: boolean;
  searchQuery: string;
  category: string;
  onSearchChange?: (query: string) => void;
  onCategoryChange?: (category: string) => void;
  onRefresh?: () => void;
}

const signalOrder: Record<SignalType, number> = {
  STRONG_BUY: 5,
  BUY: 4,
  HOLD: 3,
  SELL: 2,
  STRONG_SELL: 1,
};

export function DashboardOverview({
  allSignals,
  onSelectSymbol,
  isLoading,
  searchQuery,
  category,
  onSearchChange,
  onCategoryChange,
  onRefresh,
}: DashboardOverviewProps) {
  const [sortField, setSortField] = useState<SortField>("volume");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter signals by category and search
  const filteredSignals = useMemo(() => {
    let signals = allSignals;
    
    // Filter by category
    if (category !== "ALL") {
      signals = signals.filter((s) => s.assetType === category);
    }
    
    // Filter by search query
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

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [category, searchQuery]);

  // Market summary stats
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
    const avgConfidence = total > 0 
      ? Math.round(filteredSignals.reduce((sum, s) => sum + s.macroSignal.confidence, 0) / total)
      : 0;

    return {
      total,
      bullishPct: total > 0 ? Math.round((bullish / total) * 100) : 0,
      bearishPct: total > 0 ? Math.round((bearish / total) * 100) : 0,
      strongSignals,
      avgConfidence,
    };
  }, [filteredSignals]);

  // Sort signals
  const sortedSignals = useMemo(() => {
    return [...filteredSignals].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "symbol":
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case "category":
          comparison = a.assetType.localeCompare(b.assetType);
          break;
        case "price":
          comparison = a.currentPrice - b.currentPrice;
          break;
        case "change":
          comparison = (a.priceChange24h || 0) - (b.priceChange24h || 0);
          break;
        case "signal":
          comparison = signalOrder[a.macroSignal.signal] - signalOrder[b.macroSignal.signal];
          break;
        case "confidence":
          comparison = a.macroSignal.confidence - b.macroSignal.confidence;
          break;
        case "trend":
          comparison = a.macroSignal.trend.localeCompare(b.macroSignal.trend);
          break;
        case "volume":
          comparison = (a.volume24h || 0) - (b.volume24h || 0);
          break;
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredSignals, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedSignals.length / ITEMS_PER_PAGE);
  const paginatedSignals = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedSignals.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedSignals, currentPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-3 w-3 inline ml-1" />
    ) : (
      <ChevronDown className="h-3 w-3 inline ml-1" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Market Overview</h1>
          <p className="text-muted-foreground mt-1">
            Daily signals across all tracked assets
          </p>
        </div>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
        )}
      </div>

      {/* Market Regime Badges - Always visible, independent of tab */}
      <MarketRegimeBadges />

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

      {/* Quick Metrics Row (Coinglass style) */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-muted/30 border border-border/50 rounded-lg text-sm">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span><strong>{stats.total}</strong> assets in view</span>
        </div>
        <span className="text-border">|</span>
        <span className="text-bullish"><strong>{stats.bullishPct}%</strong> bullish</span>
        <span className="text-border">|</span>
        <span className="text-bearish"><strong>{stats.bearishPct}%</strong> bearish</span>
        <span className="text-border">|</span>
        <span><strong>{stats.strongSignals}</strong> strong signals</span>
        <span className="text-border">|</span>
        <div className="flex items-center gap-1">
          <Percent className="h-3 w-3 text-muted-foreground" />
          <span><strong>{stats.avgConfidence}%</strong> avg confidence</span>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {onCategoryChange && (
          <CategoryFilterTabs
            category={category}
            onCategoryChange={onCategoryChange}
          />
        )}

        {onSearchChange && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9 bg-muted/50 border-border/50 rounded-lg"
            />
          </div>
        )}
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
              {/* Desktop Table with sticky header */}
              <div className="hidden md:block overflow-x-auto max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow className="hover:bg-transparent border-border/50">
                      <TableHead 
                        className="w-[180px] cursor-pointer hover:text-foreground"
                        onClick={() => handleSort("symbol")}
                      >
                        Asset <SortIcon field="symbol" />
                      </TableHead>
                      <TableHead 
                        className="w-[100px] cursor-pointer hover:text-foreground"
                        onClick={() => handleSort("category")}
                      >
                        Category <SortIcon field="category" />
                      </TableHead>
                      <TableHead 
                        className="text-right cursor-pointer hover:text-foreground"
                        onClick={() => handleSort("price")}
                      >
                        Price <SortIcon field="price" />
                      </TableHead>
                      <TableHead 
                        className="text-right cursor-pointer hover:text-foreground"
                        onClick={() => handleSort("change")}
                      >
                        24h % <SortIcon field="change" />
                      </TableHead>
                      <TableHead className="w-[80px]">Chart</TableHead>
                      <TableHead 
                        className="text-center cursor-pointer hover:text-foreground"
                        onClick={() => handleSort("signal")}
                      >
                        Signal <SortIcon field="signal" />
                      </TableHead>
                      <TableHead 
                        className="text-center cursor-pointer hover:text-foreground"
                        onClick={() => handleSort("confidence")}
                      >
                        Confidence <SortIcon field="confidence" />
                      </TableHead>
                      <TableHead 
                        className="text-center cursor-pointer hover:text-foreground"
                        onClick={() => handleSort("trend")}
                      >
                        Trend <SortIcon field="trend" />
                      </TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSignals.map((setup) => (
                      <TableRow
                        key={setup.symbol}
                        onClick={() => onSelectSymbol(setup.symbol)}
                        className="cursor-pointer hover:bg-muted/50 transition-colors border-border/30"
                      >
                        <TableCell>
                          <div>
                            <span className="font-medium">{setup.symbol}</span>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {getAssetName(setup.symbol)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-normal capitalize">
                            {setup.assetType}
                          </Badge>
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
                {paginatedSignals.map((setup) => (
                  <button
                    key={setup.symbol}
                    onClick={() => onSelectSymbol(setup.symbol)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{setup.symbol}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs font-normal capitalize">
                            {setup.assetType}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {getAssetName(setup.symbol)}
                          </span>
                        </div>
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="border-t border-border/30 p-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNum)}
                              isActive={currentPage === pageNum}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className={cn(currentPage === totalPages && "pointer-events-none opacity-50")}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
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
