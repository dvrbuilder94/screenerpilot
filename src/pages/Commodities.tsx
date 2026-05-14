import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Scale, DollarSign, BarChart3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MiniChart from "@/components/MiniChart";
import RatioChart from "@/components/RatioChart";
import { Candle, Interval } from "@/lib/binanceApi";
import { ema } from "@/lib/indicators";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import presets from "@/config/presets.json";
import { Seo } from "@/components/Seo";

interface RatioData {
  name: string;
  numerator: string;
  denominator: string;
}

interface CommodityData {
  symbol: string;
  yahooSymbol: string;
  name: string;
  category: "Precious" | "Energy" | "Industrial" | "Battery / Critical" | "Agriculture";
  price: number;
  change: number;
  unit: string;
  candles?: Candle[];
  ema20?: number[];
  ema50?: number[];
}

// Yahoo Finance commodity futures + ETF proxies for metals without liquid futures
const commoditySymbols: CommodityData[] = [
  // Precious metals
  { symbol: "Gold", yahooSymbol: "GC=F", name: "Gold", category: "Precious", price: 0, change: 0, unit: "oz" },
  { symbol: "Silver", yahooSymbol: "SI=F", name: "Silver", category: "Precious", price: 0, change: 0, unit: "oz" },
  { symbol: "Platinum", yahooSymbol: "PL=F", name: "Platinum", category: "Precious", price: 0, change: 0, unit: "oz" },
  { symbol: "Palladium", yahooSymbol: "PA=F", name: "Palladium", category: "Precious", price: 0, change: 0, unit: "oz" },
  { symbol: "Palladium ETF", yahooSymbol: "PALL", name: "Palladium ETF", category: "Precious", price: 0, change: 0, unit: "share" },

  // Energy
  { symbol: "Crude Oil", yahooSymbol: "CL=F", name: "Crude Oil", category: "Energy", price: 0, change: 0, unit: "bbl" },
  { symbol: "Brent", yahooSymbol: "BZ=F", name: "Brent Crude", category: "Energy", price: 0, change: 0, unit: "bbl" },
  { symbol: "Natural Gas", yahooSymbol: "NG=F", name: "Natural Gas", category: "Energy", price: 0, change: 0, unit: "MMBtu" },
  { symbol: "Uranium ETF", yahooSymbol: "URA", name: "Uranium ETF", category: "Energy", price: 0, change: 0, unit: "share" },
  { symbol: "Cameco", yahooSymbol: "CCJ", name: "Cameco (Uranium)", category: "Energy", price: 0, change: 0, unit: "share" },

  // Industrial metals
  { symbol: "Copper", yahooSymbol: "HG=F", name: "Copper", category: "Industrial", price: 0, change: 0, unit: "lb" },
  { symbol: "Aluminum ETF", yahooSymbol: "JJU", name: "Aluminum ETN", category: "Industrial", price: 0, change: 0, unit: "share" },

  // Battery / Critical metals
  { symbol: "Lithium ETF", yahooSymbol: "LIT", name: "Lithium ETF", category: "Battery / Critical", price: 0, change: 0, unit: "share" },
  { symbol: "Albemarle", yahooSymbol: "ALB", name: "Albemarle (Lithium)", category: "Battery / Critical", price: 0, change: 0, unit: "share" },
  { symbol: "Rare Earths ETF", yahooSymbol: "REMX", name: "Rare Earths ETF", category: "Battery / Critical", price: 0, change: 0, unit: "share" },
  { symbol: "MP Materials", yahooSymbol: "MP", name: "MP Materials (Rare Earth)", category: "Battery / Critical", price: 0, change: 0, unit: "share" },
  { symbol: "Nickel/Battery ETF", yahooSymbol: "BATT", name: "Battery Tech ETF", category: "Battery / Critical", price: 0, change: 0, unit: "share" },

  // Agriculture
  { symbol: "Wheat", yahooSymbol: "ZW=F", name: "Wheat", category: "Agriculture", price: 0, change: 0, unit: "bu" },
  { symbol: "Corn", yahooSymbol: "ZC=F", name: "Corn", category: "Agriculture", price: 0, change: 0, unit: "bu" },
  { symbol: "Soybeans", yahooSymbol: "ZS=F", name: "Soybeans", category: "Agriculture", price: 0, change: 0, unit: "bu" },
  { symbol: "Coffee", yahooSymbol: "KC=F", name: "Coffee", category: "Agriculture", price: 0, change: 0, unit: "lb" },
];

const ratioDescriptions: Record<string, string> = {
  "Copper/Gold": "Key economic indicator. High ratio = economic optimism, low ratio = risk aversion",
  "Gold/Silver": "Historical ratio ~60-80. >80 = silver undervalued, <60 = gold undervalued",
  "Silver/Oil": "Relationship between precious metals and energy",
  "Gold/Oil": "How many barrels of oil one ounce of gold can buy",
  "Platinum/Gold": "Historically platinum > gold. Inversion indicates industrial stress",
  "Palladium/Gold": "Reflects industrial demand vs safe haven",
};

async function fetchCommodityCandles(yahooSymbol: string, interval: Interval): Promise<Candle[]> {
  try {
    const { data, error } = await supabase.functions.invoke("fetch-stock-data", {
      body: { symbol: yahooSymbol, interval },
    });

    if (error) {
      console.error(`Error fetching ${yahooSymbol}:`, error);
      return [];
    }

    // Handle response - candles are in data.candles
    const candles = data?.candles || data || [];
    return Array.isArray(candles) ? candles : [];
  } catch (err) {
    console.error(`Failed to fetch ${yahooSymbol}:`, err);
    return [];
  }
}

export default function Commodities() {
  const [selectedCommodity, setSelectedCommodity] = useState<string>("GC=F");
  const [interval, setInterval] = useState<Interval>("1d");
  const [commodityData, setCommodityData] = useState<CommodityData[]>(commoditySymbols);
  const [chartData, setChartData] = useState<{ candles: Candle[]; ema20: number[]; ema50: number[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [ratioValues, setRatioValues] = useState<Record<string, number>>({});

  const ratios: RatioData[] = presets.commodity_ratios || [];

  // Fetch all commodity prices
  const fetchAllPrices = useCallback(async () => {
    setIsLoading(true);
    try {
      const promises = commoditySymbols.map(async (commodity) => {
        const candles = await fetchCommodityCandles(commodity.yahooSymbol, interval);
        if (candles.length > 0) {
          const currentPrice = candles[candles.length - 1]?.close || 0;
          const prevPrice = candles[candles.length - 2]?.close || currentPrice;
          const change = prevPrice > 0 ? ((currentPrice - prevPrice) / prevPrice) * 100 : 0;

          const closes = candles.map((c) => c.close);
          const ema20Values = ema(closes, 20);
          const ema50Values = ema(closes, 50);

          return {
            ...commodity,
            price: currentPrice,
            change,
            candles,
            ema20: ema20Values,
            ema50: ema50Values,
          };
        }
        return commodity;
      });

      const results = await Promise.all(promises);
      setCommodityData(results);

      // Calculate ratios based on fetched prices
      const priceMap: Record<string, number> = {};
      results.forEach((r) => {
        priceMap[r.name] = r.price;
      });

      const calculatedRatios: Record<string, number> = {};
      if (priceMap["Copper"] && priceMap["Gold"]) {
        calculatedRatios["Copper/Gold"] = priceMap["Copper"] / priceMap["Gold"];
      }
      if (priceMap["Gold"] && priceMap["Silver"]) {
        calculatedRatios["Gold/Silver"] = priceMap["Gold"] / priceMap["Silver"];
      }
      if (priceMap["Silver"] && priceMap["Crude Oil"]) {
        calculatedRatios["Silver/Oil"] = priceMap["Silver"] / priceMap["Crude Oil"];
      }
      if (priceMap["Gold"] && priceMap["Crude Oil"]) {
        calculatedRatios["Gold/Oil"] = priceMap["Gold"] / priceMap["Crude Oil"];
      }
      if (priceMap["Platinum"] && priceMap["Gold"]) {
        calculatedRatios["Platinum/Gold"] = priceMap["Platinum"] / priceMap["Gold"];
      }
      if (priceMap["Palladium"] && priceMap["Gold"]) {
        calculatedRatios["Palladium/Gold"] = priceMap["Palladium"] / priceMap["Gold"];
      }
      setRatioValues(calculatedRatios);

      // Set chart for selected commodity
      const selected = results.find((r) => r.yahooSymbol === selectedCommodity);
      if (selected?.candles?.length) {
        setChartData({
          candles: selected.candles,
          ema20: selected.ema20 || [],
          ema50: selected.ema50 || [],
        });
      }

      toast.success("Commodity prices updated");
    } catch (error) {
      console.error("Error fetching commodity prices:", error);
      toast.error("Error fetching prices");
    } finally {
      setIsLoading(false);
    }
  }, [interval, selectedCommodity]);

  // Fetch chart data for selected commodity
  const fetchChartData = useCallback(
    async (yahooSymbol: string) => {
      const commodity = commodityData.find((c) => c.yahooSymbol === yahooSymbol);
      if (commodity?.candles?.length) {
        setChartData({
          candles: commodity.candles,
          ema20: commodity.ema20 || [],
          ema50: commodity.ema50 || [],
        });
      } else {
        const candles = await fetchCommodityCandles(yahooSymbol, interval);
        if (candles.length > 0) {
          const closes = candles.map((c) => c.close);
          const ema20Values = ema(closes, 20);
          const ema50Values = ema(closes, 50);
          setChartData({ candles, ema20: ema20Values, ema50: ema50Values });
        }
      }
    },
    [commodityData, interval],
  );

  useEffect(() => {
    fetchAllPrices();
  }, [fetchAllPrices]);

  useEffect(() => {
    if (selectedCommodity) {
      fetchChartData(selectedCommodity);
    }
  }, [selectedCommodity, fetchChartData]);

  const handleCommoditySelect = (yahooSymbol: string) => {
    setSelectedCommodity(yahooSymbol);
  };

  const selectedCommodityInfo = commodityData.find((c) => c.yahooSymbol === selectedCommodity);

  const getRatioStatus = (name: string, currentValue: number): "neutral" | "high" | "low" => {
    const historicalAverages: Record<string, number> = {
      "Copper/Gold": 0.00018,
      "Gold/Silver": 70,
      "Silver/Oil": 0.35,
      "Gold/Oil": 25,
      "Platinum/Gold": 1.2,
      "Palladium/Gold": 0.8,
    };
    const avg = historicalAverages[name];
    if (!avg || !currentValue) return "neutral";
    const deviation = (currentValue - avg) / avg;
    if (deviation > 0.15) return "high";
    if (deviation < -0.15) return "low";
    return "neutral";
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Commodities — Spot Prices & Key Ratios | ScreenerPilot"
        description="Live commodity futures and ETF proxies: precious metals, energy, industrial metals, battery materials and agriculture, plus Copper/Gold and Gold/Silver ratios."
        path="/commodities"
      />
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scale className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Commodities</h1>
              <p className="text-muted-foreground">Precious metals, energy and key market ratios</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={interval} onValueChange={(v) => setInterval(v as Interval)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1H</SelectItem>
                <SelectItem value="4h">4H</SelectItem>
                <SelectItem value="1d">1D</SelectItem>
                <SelectItem value="1w">1W</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchAllPrices} disabled={isLoading} aria-label="Refresh commodity prices">
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Commodity Prices Grid - Grouped by category */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Spot Prices
          </h2>
          {(["Precious", "Energy", "Industrial", "Battery / Critical", "Agriculture"] as const).map((cat) => {
            const items = commodityData.filter((c) => c.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">{cat}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {items.map((commodity) => (
                    <Card
                      key={commodity.yahooSymbol}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedCommodity === commodity.yahooSymbol ? "ring-2 ring-primary border-primary" : "border-border"
                      }`}
                      onClick={() => handleCommoditySelect(commodity.yahooSymbol)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-mono text-xs text-muted-foreground">{commodity.yahooSymbol}</span>
                          {commodity.change >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-bullish" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-bearish" />
                          )}
                        </div>
                        <p className="font-medium text-foreground text-sm">{commodity.name}</p>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-lg font-bold text-foreground">
                            $
                            {commodity.price > 0
                              ? commodity.price.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : "--"}
                          </span>
                          <span className="text-xs text-muted-foreground">/{commodity.unit}</span>
                        </div>
                        <span className={`text-sm font-medium ${commodity.change >= 0 ? "text-bullish" : "text-bearish"}`}>
                          {commodity.price > 0 ? `${commodity.change >= 0 ? "+" : ""}${commodity.change.toFixed(2)}%` : "--"}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* Chart Section */}
        {chartData && chartData.candles.length > 0 && selectedCommodityInfo && (
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {selectedCommodityInfo.name} Chart ({interval.toUpperCase()})
            </h2>
            <Card className="p-4">
              <MiniChart candles={chartData.candles} ema20={chartData.ema20} ema50={chartData.ema50} />
            </Card>
          </section>
        )}

        {/* Ratio Charts - Multi-Year Historical */}
        <section>
          <RatioChart />
        </section>

        {/* Ratios Section */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Key Ratios (Current)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ratios.map((ratio) => {
              const currentValue = ratioValues[ratio.name] || 0;
              const status = getRatioStatus(ratio.name, currentValue);

              return (
                <Card key={ratio.name} className="border-border hover:shadow-sm transition-all">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span>{ratio.name}</span>
                      {status === "high" && <TrendingUp className="h-4 w-4 text-bullish" />}
                      {status === "low" && <TrendingDown className="h-4 w-4 text-bearish" />}
                      {status === "neutral" && <Minus className="h-4 w-4 text-muted-foreground" />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-foreground">
                        {currentValue > 0 ? currentValue.toFixed(4) : "--"}
                      </span>
                      <span className="text-sm text-muted-foreground">(current)</span>
                    </div>

                    <p className="text-sm text-muted-foreground">{ratioDescriptions[ratio.name]}</p>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-1 rounded bg-secondary text-muted-foreground">{ratio.numerator}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="px-2 py-1 rounded bg-secondary text-muted-foreground">{ratio.denominator}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <p className="text-xs text-muted-foreground text-center pt-4 border-t border-border">
          Live futures prices from Yahoo Finance. Prices may differ slightly from spot market values.
        </p>
      </div>
    </div>
  );
}
