import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { TradingAIWidget } from "@/components/TradingAIWidget";
import DashboardHeader from "@/components/DashboardHeader";
import EnhancedSignalCard from "@/components/EnhancedSignalCard";
import TopSetupsPanel from "@/components/TopSetupsPanel";
import SignalsList from "@/components/SignalsList";
import { SignalsSidebar } from "@/components/SignalsSidebar";
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
import { TradingSetup, EnhancedSignal } from "@/types/trading";
import { TradingStyle, TRADING_PROFILES } from "@/types/tradingProfile";
import { useLanguage } from "@/contexts/LanguageContext";
import presets from "@/config/presets.json";


const STORAGE_KEY = "crypto-dashboard-settings";

interface DashboardData {
  candles: Candle[];
  indicators: IndicatorData;
  enhancedSignal: EnhancedSignal;
  currentPrice: number;
}

// Load settings from localStorage - moved outside component
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

export default function Index() {
  const { language } = useLanguage();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // All hooks must be at the top before any conditional returns
  const [assetType, setAssetType] = useState<AssetType>(() => loadSettings()?.assetType || "stock");
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

  // New state for all signals
  const [allSignals, setAllSignals] = useState<TradingSetup[]>([]);
  const [isScanningAll, setIsScanningAll] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<number>();

  // Trading profile state
  const [tradingStyle, setTradingStyle] = useState<TradingStyle>(() => {
    const saved = loadSettings()?.tradingStyle;
    return saved || 'swing';
  });

  // No redirect - dashboard is accessible without login

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

  // Scan all tickers in background
  const scanAllTickers = useCallback(async () => {
    setIsScanningAll(true);
    
    // Get all available tickers
    const allTickers: Symbol[] = [
      ...presets.crypto,
      ...(presets.commodities || []),
      ...presets.stocks,
      ...presets.indices,
      ...presets.etf_alt,
    ];

    // Apply tier restrictions - using fixed values since we removed subscription from component
    const maxTickers = 100; // You can adjust this or make it dynamic based on user tier
    const tickersToScan = allTickers.slice(0, maxTickers);

    const results = await Promise.allSettled(
      tickersToScan.map(async (ticker) => {
        try {
          const assetType = getAssetType(ticker);
          const macroCandles = await fetchCandles(ticker, macroInterval, 200);
          const microCandles = await fetchCandles(ticker, microInterval, 200);

          if (!macroCandles.length || !microCandles.length) {
            return null;
          }

          const macroIndicators = calculateIndicators(macroCandles);
          const microIndicators = calculateIndicators(microCandles);

          const tradingProfile = TRADING_PROFILES[tradingStyle];

          const macroSignal = calculateEnhancedSignal({
            indicators: macroIndicators.indicators,
            currentPrice: macroCandles[macroCandles.length - 1].close,
            prevPrice: macroCandles[macroCandles.length - 2]?.close || macroCandles[macroCandles.length - 1].close,
            tradingProfile,
            sentiment: null,
          });

          const microSignal = calculateEnhancedSignal({
            indicators: microIndicators.indicators,
            currentPrice: microCandles[microCandles.length - 1].close,
            prevPrice: microCandles[microCandles.length - 2]?.close || microCandles[microCandles.length - 1].close,
            tradingProfile,
            sentiment: null,
          });

          const combinedConfidence = Math.round((macroSignal.confidence + microSignal.confidence) / 2);
          const currentPrice = macroCandles[macroCandles.length - 1].close;
          
          // Calculate 24h price change
          const recentCandles = microCandles.slice(-24);
          const price24hAgo = recentCandles[0]?.close || currentPrice;
          const priceChange24h = ((currentPrice - price24hAgo) / price24hAgo) * 100;
          
          // Get recent prices for sparkline (last 24 points)
          const recentPrices = microCandles.slice(-24).map(c => c.close);

          return {
            symbol: ticker,
            assetType,
            currentPrice,
            macroSignal,
            microSignal,
            combinedConfidence,
            lastUpdate: Date.now(),
            priceChange24h,
            recentPrices,
          } as TradingSetup;
        } catch (error) {
          console.error(`Error scanning ${ticker}:`, error);
          return null;
        }
      })
    );

    const validSetups = results
      .filter((result): result is PromiseFulfilledResult<TradingSetup | null> => 
        result.status === "fulfilled" && result.value !== null
      )
      .map((result) => result.value as TradingSetup);

    setAllSignals(validSetups);
    setLastScanTime(Date.now());
    setIsScanningAll(false);

    toast.success(`Scanned ${validSetups.length} tickers successfully`);
  }, [macroInterval, microInterval, tradingStyle, calculateIndicators]);

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
        toast.success(`Group data updated (${groupResults.length}/${groupSymbols.length})`);
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

        toast.success("Data updated successfully");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error fetching data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [symbol, selectedGroup, macroInterval, microInterval, calculateIndicators, tradingStyle]);

  // Initial fetch
  useEffect(() => {
    fetchData();
    scanAllTickers(); // Initial scan of all tickers
  }, [fetchData, scanAllTickers]);

  // Auto-refresh all signals every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      scanAllTickers();
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [scanAllTickers]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData();
    }, 60000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  // No auth gate - dashboard is public

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

    toast.success("CSV exported successfully");
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
    <>
      <TradingAIWidget />
      <div className="flex h-screen w-full bg-background">
        {/* Signals Sidebar */}
        <div className="w-80 flex-shrink-0">
        <SignalsSidebar
          allSignals={allSignals}
          selectedSymbol={symbol}
          onSelectSymbol={(newSymbol) => {
            setSymbol(newSymbol as Symbol);
            setAssetType(getAssetType(newSymbol as Symbol));
            setSelectedGroup(null);
          }}
          isLoading={isScanningAll}
          lastUpdate={lastScanTime}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 lg:p-8">
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


            {selectedGroup ? (
              <GroupRanking 
                groupName={selectedGroup} 
                data={groupData} 
                isLoading={isLoading}
              />
            ) : (
              <>
                {macroData && microData && (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <EnhancedSignalCard
                        title={`Macro Analysis (${macroInterval})`}
                        timeframe={macroInterval}
                        signal={macroData.enhancedSignal}
                        currentPrice={macroData.currentPrice}
                      />
                      <EnhancedSignalCard
                        title={`Micro Analysis (${microInterval})`}
                        timeframe={microInterval}
                        signal={microData.enhancedSignal}
                        currentPrice={microData.currentPrice}
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <MiniChart
                        candles={macroData.candles}
                        ema20={macroData.indicators.ema20}
                        ema50={macroData.indicators.ema50}
                      />
                      <MiniChart
                        candles={microData.candles}
                        ema20={microData.indicators.ema20}
                        ema50={microData.indicators.ema50}
                      />
                    </div>

                    <CandleTable candles={microData.candles} limit={50} />
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
