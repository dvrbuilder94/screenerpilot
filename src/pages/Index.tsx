import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import EnhancedSignalCard from "@/components/EnhancedSignalCard";
import WatchlistManager from "@/components/WatchlistManager";
import TopSetupsPanel from "@/components/TopSetupsPanel";
import FilterPanel from "@/components/FilterPanel";
import { TradingStyleSelector } from "@/components/TradingStyleSelector";
import StockNews from "@/components/StockNews";
import MiniChart from "@/components/MiniChart";
import CandleTable from "@/components/CandleTable";
import GroupRanking, { GroupSymbolData } from "@/components/GroupRanking";
import { 
  fetchCandles, 
  Symbol, 
  Interval, 
  Candle, 
  AssetType, 
  GroupKey, 
  getGroupSymbols,
  getSymbolsByType,
  getAssetType 
} from "@/lib/binanceApi";
import {
  ema,
  rsi,
  macd,
  atr,
  supertrend,
  IndicatorData,
} from "@/lib/indicators";
import { calculateEnhancedSignal } from "@/lib/enhancedSignals";
import { TradingSetup, FilterOptions, EnhancedSignal } from "@/types/trading";
import { TradingStyle, TRADING_PROFILES } from "@/types/tradingProfile";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";

const STORAGE_KEY = "crypto-dashboard-settings";

interface DashboardData {
  candles: Candle[];
  indicators: IndicatorData;
  enhancedSignal: EnhancedSignal;
  currentPrice: number;
}

export default function Index() {
  const { language } = useLanguage();
  const t = translations[language];

  // Load settings from localStorage
  const loadSettings = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  };

  const [assetType, setAssetType] = useState<AssetType>(() => loadSettings()?.assetType || "crypto");
  const [symbol, setSymbol] = useState<Symbol>(() => {
    const saved = loadSettings();
    if (saved?.symbol) return saved.symbol;
    const symbols = getSymbolsByType(assetType);
    return symbols[0] || "BTCUSDT";
  });
  const [selectedGroup, setSelectedGroup] = useState<GroupKey | null>(null);
  const [macroInterval, setMacroInterval] = useState<Interval>(() => loadSettings()?.macroInterval || "1d");
  const [microInterval, setMicroInterval] = useState<Interval>(() => loadSettings()?.microInterval || "1h");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [macroData, setMacroData] = useState<DashboardData | null>(null);
  const [microData, setMicroData] = useState<DashboardData | null>(null);
  const [groupData, setGroupData] = useState<GroupSymbolData[]>([]);
  const [tradingSetups, setTradingSetups] = useState<TradingSetup[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    trend: 'ALL',
    signalType: 'ALL',
    assetType: 'ALL',
    minConfidence: 0,
  });

  // Trading profile state
  const [tradingStyle, setTradingStyle] = useState<TradingStyle>(() => {
    const saved = loadSettings()?.tradingStyle;
    return saved || 'swing';
  });

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ assetType, symbol, macroInterval, microInterval, tradingStyle })
    );
  }, [assetType, symbol, macroInterval, microInterval, tradingStyle]);

  const calculateIndicators = useCallback((candles: Candle[]): DashboardData => {
    const closes = candles.map(c => c.close);
    const ohlc = candles.map(c => ({
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const ema20 = ema(closes, 20);
    const ema50 = ema(closes, 50);
    const rsiValues = rsi(closes, 14);
    const macdValues = macd(closes);
    const atrValues = atr(ohlc, 14);
    const supertrendValues = supertrend(ohlc, 10, 3);

    const indicators: IndicatorData = {
      ema20,
      ema50,
      rsi: rsiValues,
      macd: macdValues,
      atr: atrValues,
      supertrend: supertrendValues,
    };

    const currentPrice = candles[candles.length - 1]?.close || 0;
    const prevPrice = candles[candles.length - 2]?.close || currentPrice;

    const enhancedSignal = calculateEnhancedSignal({
      indicators,
      currentPrice,
      prevPrice,
      tradingProfile: TRADING_PROFILES[tradingStyle],
      sentiment: null,
    });

    return {
      candles,
      indicators,
      enhancedSignal,
      currentPrice,
    };
  }, [tradingStyle]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (selectedGroup) {
        // Fetch data for all symbols in the group
        const groupSymbols = getGroupSymbols(selectedGroup);
        const groupResults: GroupSymbolData[] = [];
        const setupResults: TradingSetup[] = [];

        for (const sym of groupSymbols) {
          try {
            const [macroCandles, microCandles] = await Promise.all([
              fetchCandles(sym, macroInterval, 500),
              fetchCandles(sym, microInterval, 500),
            ]);

            const macroResult = calculateIndicators(macroCandles);
            const microResult = calculateIndicators(microCandles);

            groupResults.push({
              symbol: sym,
              score: microResult.enhancedSignal.score,
              signal: microResult.enhancedSignal.signal as any,
              price: microResult.currentPrice,
              macroSignal: macroResult.enhancedSignal.signal as any,
            });

            // Create trading setup for ranking
            setupResults.push({
              symbol: sym,
              assetType: getAssetType(sym),
              currentPrice: microResult.currentPrice,
              macroSignal: macroResult.enhancedSignal,
              microSignal: microResult.enhancedSignal,
              combinedConfidence: (macroResult.enhancedSignal.confidence + microResult.enhancedSignal.confidence) / 2,
              lastUpdate: Date.now(),
            });
          } catch (error) {
            console.error(`Error fetching data for ${sym}:`, error);
          }
        }

        setGroupData(groupResults);
        setTradingSetups(setupResults);
        toast.success(`${t.groupDataUpdated} (${groupResults.length}/${groupSymbols.length})`);
      } else {
        // Fetch data for single symbol
        const [macroCandles, microCandles] = await Promise.all([
          fetchCandles(symbol, macroInterval, 500),
          fetchCandles(symbol, microInterval, 500),
        ]);

        const macroResult = calculateIndicators(macroCandles);
        const microResult = calculateIndicators(microCandles);

        setMacroData(macroResult);
        setMicroData(microResult);

        // Create single trading setup
        const setup: TradingSetup = {
          symbol,
          assetType: getAssetType(symbol),
          currentPrice: microResult.currentPrice,
          macroSignal: macroResult.enhancedSignal,
          microSignal: microResult.enhancedSignal,
          combinedConfidence: (macroResult.enhancedSignal.confidence + microResult.enhancedSignal.confidence) / 2,
          lastUpdate: Date.now(),
        };
        setTradingSetups([setup]);

        toast.success(t.dataUpdated);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(t.errorFetchingData);
    } finally {
      setIsLoading(false);
    }
  }, [symbol, selectedGroup, macroInterval, microInterval, calculateIndicators, tradingStyle]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData();
    }, 60000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  // Filter trading setups
  const filteredSetups = tradingSetups.filter((setup) => {
    if (filters.trend !== 'ALL' && setup.macroSignal.trend !== filters.trend) return false;
    if (filters.signalType !== 'ALL' && setup.microSignal.signal !== filters.signalType) return false;
    if (filters.assetType !== 'ALL' && setup.assetType !== filters.assetType) return false;
    if (setup.combinedConfidence < (filters.minConfidence || 0)) return false;
    return true;
  });

  const activeFiltersCount = [
    filters.trend !== 'ALL',
    filters.signalType !== 'ALL',
    filters.assetType !== 'ALL',
    (filters.minConfidence || 0) > 0,
  ].filter(Boolean).length;

  const exportToCsv = () => {
    if (!microData) return;

    const headers = ["Date", "Open", "High", "Low", "Close", "Volume", "EMA20", "EMA50", "RSI", "MACD", "Signal"];
    const rows = microData.candles.slice(-200).map((candle, i) => {
      const ema20Idx = i + Math.max(0, microData.candles.length - microData.indicators.ema20.length - 200);
      const ema50Idx = i + Math.max(0, microData.candles.length - microData.indicators.ema50.length - 200);
      const rsiIdx = i + Math.max(0, microData.candles.length - microData.indicators.rsi.length - 200);
      const macdIdx = i + Math.max(0, microData.candles.length - microData.indicators.macd.macd.length - 200);

      return [
        new Date(candle.openTime).toISOString(),
        candle.open,
        candle.high,
        candle.low,
        candle.close,
        candle.volume,
        microData.indicators.ema20[ema20Idx] || "",
        microData.indicators.ema50[ema50Idx] || "",
        microData.indicators.rsi[rsiIdx] || "",
        microData.indicators.macd.macd[macdIdx] || "",
        microData.indicators.macd.signal[macdIdx] || "",
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${symbol}_${microInterval}_data.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(t.csvExported);
  };

  // Handle asset type change
  const handleAssetTypeChange = (type: AssetType) => {
    setAssetType(type);
    setSelectedGroup(null);
    const symbols = getSymbolsByType(type);
    setSymbol(symbols[0]);
  };

  // Handle group change
  const handleGroupChange = (group: GroupKey | null) => {
    setSelectedGroup(group);
    if (group) {
      setMacroData(null);
      setMicroData(null);
    } else {
      setGroupData([]);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <DashboardHeader
          symbol={symbol}
          assetType={assetType}
          selectedGroup={selectedGroup}
          macroInterval={macroInterval}
          microInterval={microInterval}
          autoRefresh={autoRefresh}
          isLoading={isLoading}
          onSymbolChange={setSymbol}
          onAssetTypeChange={handleAssetTypeChange}
          onGroupChange={handleGroupChange}
          onMacroIntervalChange={setMacroInterval}
          onMicroIntervalChange={setMicroInterval}
          onAutoRefreshChange={setAutoRefresh}
          onRefresh={fetchData}
        />

        {/* Trading Style & Market Sentiment */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TradingStyleSelector
              selectedStyle={tradingStyle}
              onStyleChange={setTradingStyle}
            />
          </div>
          <div className="lg:col-span-1">
            <StockNews symbol={symbol} />
          </div>
        </div>

        {/* Watchlist & Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <WatchlistManager onSymbolSelect={(sym) => {
            setSymbol(sym);
            setSelectedGroup(null);
          }} />
          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            activeFiltersCount={activeFiltersCount}
          />
          <div className="lg:col-span-1">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-2">{t.summary}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.totalSetups}:</span>
                  <span className="font-bold">{tradingSetups.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.filtered}:</span>
                  <span className="font-bold">{filteredSetups.length}</span>
                </div>
                {microData && (
                  <div className="flex justify-between pt-2 border-t border-border/50">
                    <span className="text-muted-foreground">{t.currentPrice}:</span>
                    <span className="font-mono font-bold text-primary">
                      ${microData.currentPrice.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Top Setups Panel */}
        {filteredSetups.length > 0 && (
          <TopSetupsPanel
            setups={filteredSetups}
            onSelectSetup={(sym) => {
              setSymbol(sym as Symbol);
              setSelectedGroup(null);
            }}
          />
        )}

        {selectedGroup ? (
          <GroupRanking
            groupName={selectedGroup === "magnificent_seven" ? "Magnificent Seven" : selectedGroup}
            data={groupData}
            isLoading={isLoading}
          />
        ) : (
          macroData && microData && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EnhancedSignalCard
                  title={t.macroAnalysis}
                  timeframe={t[macroInterval] || macroInterval}
                  signal={macroData.enhancedSignal}
                  currentPrice={macroData.currentPrice}
                />

                <EnhancedSignalCard
                  title={t.microAnalysis}
                  timeframe={t[microInterval] || microInterval}
                  signal={microData.enhancedSignal}
                  currentPrice={microData.currentPrice}
                />
              </div>

              <div className="bg-card rounded-2xl p-6 shadow-lg border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{t.chartAndData}</h3>
                    <p className="text-3xl font-mono font-bold text-primary mt-2">
                      ${microData.currentPrice.toFixed(2)}
                    </p>
                  </div>
                  <Button onClick={exportToCsv} variant="outline" size="lg">
                    <Download className="mr-2 h-4 w-4" />
                    {t.exportCsv}
                  </Button>
                </div>

                <MiniChart
                  candles={microData.candles}
                  ema20={microData.indicators.ema20}
                  ema50={microData.indicators.ema50}
                />

                <CandleTable candles={microData.candles} limit={20} />
              </div>
            </>
          )
        )}

        {!selectedGroup && !macroData && !microData && !isLoading && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">{t.loadingInitialData}</p>
          </div>
        )}
      </div>
    </div>
  );
}
