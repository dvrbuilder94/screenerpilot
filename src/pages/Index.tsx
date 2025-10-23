import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import CombinedSignal from "@/components/CombinedSignal";
import IndicatorPanel from "@/components/IndicatorPanel";
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
  getSymbolsByType 
} from "@/lib/binanceApi";
import {
  ema,
  rsi,
  macd,
  atr,
  supertrend,
  calculateScore,
  getSignal,
  IndicatorData,
  Signal,
} from "@/lib/indicators";

const STORAGE_KEY = "crypto-dashboard-settings";

interface DashboardData {
  candles: Candle[];
  indicators: IndicatorData;
  signal: Signal;
  score: number;
}

export default function Index() {
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

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ assetType, symbol, macroInterval, microInterval })
    );
  }, [assetType, symbol, macroInterval, microInterval]);

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

    const score = calculateScore(indicators);
    const signal = getSignal(score);

    return {
      candles,
      indicators,
      signal,
      score,
    };
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (selectedGroup) {
        // Fetch data for all symbols in the group
        const groupSymbols = getGroupSymbols(selectedGroup);
        const groupResults: GroupSymbolData[] = [];

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
              score: microResult.score,
              signal: microResult.signal,
              price: microCandles[microCandles.length - 1]?.close || 0,
              macroSignal: macroResult.signal,
            });
          } catch (error) {
            console.error(`Error fetching data for ${sym}:`, error);
          }
        }

        setGroupData(groupResults);
        toast.success(`Datos del grupo actualizados (${groupResults.length}/${groupSymbols.length})`);
      } else {
        // Fetch data for single symbol
        const [macroCandles, microCandles] = await Promise.all([
          fetchCandles(symbol, macroInterval, 500),
          fetchCandles(symbol, microInterval, 500),
        ]);

        setMacroData(calculateIndicators(macroCandles));
        setMicroData(calculateIndicators(microCandles));

        toast.success("Datos actualizados correctamente");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error al obtener datos. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  }, [symbol, selectedGroup, macroInterval, microInterval, calculateIndicators]);

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

    toast.success("CSV exportado correctamente");
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

  const currentPrice = microData?.candles[microData.candles.length - 1]?.close || 0;

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

        {selectedGroup ? (
          <GroupRanking
            groupName={selectedGroup === "magnificent_seven" ? "Magnificent Seven" : selectedGroup}
            data={groupData}
            isLoading={isLoading}
          />
        ) : (
          macroData && microData && (
            <>
              <CombinedSignal
                macroSignal={macroData.signal}
                microSignal={microData.signal}
                macroScore={macroData.score}
                microScore={microData.score}
              />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
                <IndicatorPanel
                  title="🟢 Análisis Macro"
                  timeframe={macroInterval === "1d" ? "1 Día" : "1 Semana"}
                  indicators={macroData.indicators}
                  signal={macroData.signal}
                  score={macroData.score}
                  currentPrice={currentPrice}
                />
              </div>

              <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
                <IndicatorPanel
                  title="🔵 Análisis Micro"
                  timeframe={microInterval === "1h" ? "1 Hora" : "4 Horas"}
                  indicators={microData.indicators}
                  signal={microData.signal}
                  score={microData.score}
                  currentPrice={currentPrice}
                />
              </div>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-lg border border-border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Precio Actual</h3>
                  <p className="text-3xl font-mono font-bold text-primary mt-2">
                    ${currentPrice.toFixed(2)}
                  </p>
                </div>
                <Button onClick={exportToCsv} variant="outline" size="lg">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar CSV
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
            <p className="text-muted-foreground">Cargando datos iniciales...</p>
          </div>
        )}
      </div>
    </div>
  );
}
