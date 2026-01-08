import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { TradingAIWidget } from "@/components/TradingAIWidget";
import { DashboardOverview } from "@/components/DashboardOverview";
import { AssetIntelligencePage } from "@/components/AssetIntelligencePage";
import { AppHeader } from "@/components/AppHeader";
import { 
  fetchCandles, 
  Symbol, 
  Interval, 
  Candle, 
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
import presets from "@/config/presets.json";

const STORAGE_KEY = "crypto-dashboard-settings";

interface DashboardData {
  candles: Candle[];
  indicators: IndicatorData;
  enhancedSignal: EnhancedSignal;
  currentPrice: number;
}

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

export default function Index() {
  // Core state
  const [selectedSymbol, setSelectedSymbol] = useState<Symbol | null>(null);
  const [tradingStyle] = useState<TradingStyle>(() => {
    const saved = loadSettings()?.tradingStyle;
    return saved || 'swing';
  });

  // Dashboard filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [assetCategory, setAssetCategory] = useState("ALL");

  // All signals state
  const [allSignals, setAllSignals] = useState<TradingSetup[]>([]);
  const [isScanningAll, setIsScanningAll] = useState(false);

  // Selected asset data
  const [macroData, setMacroData] = useState<DashboardData | null>(null);
  const [microData, setMicroData] = useState<DashboardData | null>(null);
  const [isLoadingAsset, setIsLoadingAsset] = useState(false);

  // Fixed intervals for strategic focus
  const macroInterval: Interval = "1d";
  const microInterval: Interval = "1h";

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

  // Scan all tickers for overview
  const scanAllTickers = useCallback(async () => {
    setIsScanningAll(true);
    
    const allTickers: Symbol[] = [
      ...presets.crypto,
      ...(presets.commodities || []),
      ...presets.stocks,
      ...presets.indices,
      ...presets.etf_alt,
    ];

    const maxTickers = 100;
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
          
          const recentCandles = microCandles.slice(-24);
          const price24hAgo = recentCandles[0]?.close || currentPrice;
          const priceChange24h = ((currentPrice - price24hAgo) / price24hAgo) * 100;
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
    setIsScanningAll(false);

    toast.success(`Scanned ${validSetups.length} assets`);
  }, [tradingStyle, calculateIndicators]);

  // Fetch data for selected asset
  const fetchAssetData = useCallback(async (symbol: Symbol) => {
    setIsLoadingAsset(true);
    try {
      const [macroCandles, microCandles] = await Promise.all([
        fetchCandles(symbol, macroInterval, 500),
        fetchCandles(symbol, microInterval, 500),
      ]);

      const macroResult = calculateIndicators(macroCandles);
      const microResult = calculateIndicators(microCandles);

      setMacroData(macroResult);
      setMicroData(microResult);
    } catch (error) {
      console.error("Error fetching asset data:", error);
      toast.error("Error loading asset data");
    } finally {
      setIsLoadingAsset(false);
    }
  }, [calculateIndicators]);

  // Initial scan
  useEffect(() => {
    scanAllTickers();
  }, [scanAllTickers]);

  // Auto-refresh all signals every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      scanAllTickers();
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [scanAllTickers]);

  // Handle symbol selection
  const handleSelectSymbol = useCallback((symbol: string) => {
    setSelectedSymbol(symbol as Symbol);
    fetchAssetData(symbol as Symbol);
  }, [fetchAssetData]);

  // Handle back to overview
  const handleBackToOverview = useCallback(() => {
    setSelectedSymbol(null);
    setMacroData(null);
    setMicroData(null);
  }, []);

  // Show asset detail page
  if (selectedSymbol && macroData && microData) {
    return (
      <>
        <TradingAIWidget />
        <AssetIntelligencePage
          symbol={selectedSymbol}
          currentPrice={macroData.currentPrice}
          macroSignal={macroData.enhancedSignal}
          microSignal={microData.enhancedSignal}
          candles={macroData.candles}
          indicators={macroData.indicators}
          onBack={handleBackToOverview}
        />
      </>
    );
  }

  // Show dashboard overview (no asset sidebar)
  return (
    <>
      <TradingAIWidget />
      <div className="flex flex-col min-h-screen w-full bg-background">
        {/* Main Content - Full width, filters inside DashboardOverview */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 lg:p-8">
            <div className="max-w-[1400px] mx-auto">
              <DashboardOverview
                allSignals={allSignals}
                onSelectSymbol={handleSelectSymbol}
                isLoading={isScanningAll}
                searchQuery={searchQuery}
                category={assetCategory}
                onSearchChange={setSearchQuery}
                onCategoryChange={setAssetCategory}
              />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
