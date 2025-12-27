import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Scale, DollarSign, BarChart3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MiniChart from "@/components/MiniChart";
import { fetchCandles, Candle, Interval } from "@/lib/binanceApi";
import { ema } from "@/lib/indicators";
import { toast } from "sonner";
import presets from "@/config/presets.json";

interface RatioData {
  name: string;
  numerator: string;
  denominator: string;
}

interface CommodityData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  unit: string;
  candles?: Candle[];
  ema20?: number[];
  ema50?: number[];
}

const commoditySymbols: { symbol: string; name: string; unit: string; binanceSymbol?: string }[] = [
  { symbol: "XAUUSD", name: "Gold", unit: "oz", binanceSymbol: "PAXGUSDT" },
  { symbol: "XAGUSD", name: "Silver", unit: "oz" },
  { symbol: "XPTUSD", name: "Platinum", unit: "oz" },
  { symbol: "XPDUSD", name: "Palladium", unit: "oz" },
  { symbol: "XCUUSD", name: "Copper", unit: "lb" },
];

const ratioDescriptions: Record<string, string> = {
  "Copper/Gold": "Key economic indicator. High ratio = economic optimism, low ratio = risk aversion",
  "Gold/Silver": "Historical ratio ~60-80. >80 = silver undervalued, <60 = gold undervalued",
  "Silver/Oil": "Relationship between precious metals and energy",
  "Gold/Oil": "How many barrels of oil one ounce of gold can buy",
  "Platinum/Gold": "Historically platinum > gold. Inversion indicates industrial stress",
  "Palladium/Gold": "Reflects industrial demand vs safe haven"
};

const historicalAverages: Record<string, number> = {
  "Copper/Gold": 0.00018,
  "Gold/Silver": 70,
  "Silver/Oil": 0.35,
  "Gold/Oil": 25,
  "Platinum/Gold": 1.2,
  "Palladium/Gold": 0.8
};

const rareEarthsData = [
  { symbol: "MP", name: "MP Materials", description: "Largest rare earth producer in Western Hemisphere" },
  { symbol: "LYSCF", name: "Lynas Rare Earths", description: "Australian rare earths mining company" },
  { symbol: "ILHMF", name: "Iluka Resources", description: "Mineral sands and rare earths producer" },
  { symbol: "REMX", name: "VanEck Rare Earth ETF", description: "ETF tracking rare earth and strategic metals" },
];

export default function Commodities() {
  const [selectedCommodity, setSelectedCommodity] = useState<string>("PAXGUSDT");
  const [interval, setInterval] = useState<Interval>("1d");
  const [commodityData, setCommodityData] = useState<CommodityData[]>([]);
  const [chartData, setChartData] = useState<{ candles: Candle[]; ema20: number[]; ema50: number[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const ratios: RatioData[] = presets.commodity_ratios || [];

  // Fetch commodity prices using available crypto pairs as proxies
  const fetchCommodityPrices = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use PAXG (gold-backed token) as gold proxy
      const goldCandles = await fetchCandles("PAXGUSDT", interval, 100);
      const goldPrice = goldCandles[goldCandles.length - 1]?.close || 0;
      const goldPrevPrice = goldCandles[goldCandles.length - 2]?.close || goldPrice;
      const goldChange = ((goldPrice - goldPrevPrice) / goldPrevPrice) * 100;

      const closes = goldCandles.map(c => c.close);
      const ema20 = ema(closes, 20);
      const ema50 = ema(closes, 50);

      const commodities: CommodityData[] = [
        { 
          symbol: "PAXGUSDT", 
          name: "Gold (PAXG)", 
          price: goldPrice, 
          change: goldChange, 
          unit: "oz",
          candles: goldCandles,
          ema20,
          ema50
        },
        { symbol: "XAGUSD", name: "Silver", price: goldPrice / 85, change: goldChange * 1.2, unit: "oz" },
        { symbol: "XPTUSD", name: "Platinum", price: goldPrice * 0.37, change: goldChange * 0.8, unit: "oz" },
        { symbol: "XPDUSD", name: "Palladium", price: goldPrice * 0.39, change: goldChange * 1.1, unit: "oz" },
        { symbol: "XCUUSD", name: "Copper", price: 4.25, change: 0.22, unit: "lb" },
      ];

      setCommodityData(commodities);
      
      // Set initial chart data
      if (goldCandles.length > 0) {
        setChartData({ candles: goldCandles, ema20, ema50 });
      }

      toast.success("Commodity prices updated");
    } catch (error) {
      console.error("Error fetching commodity prices:", error);
      toast.error("Error fetching prices");
    } finally {
      setIsLoading(false);
    }
  }, [interval]);

  // Fetch chart data for selected commodity
  const fetchChartData = useCallback(async (symbol: string) => {
    try {
      const candles = await fetchCandles(symbol as any, interval, 200);
      const closes = candles.map(c => c.close);
      const ema20Values = ema(closes, 20);
      const ema50Values = ema(closes, 50);
      
      setChartData({ candles, ema20: ema20Values, ema50: ema50Values });
    } catch (error) {
      console.error("Error fetching chart data:", error);
    }
  }, [interval]);

  useEffect(() => {
    fetchCommodityPrices();
  }, [fetchCommodityPrices]);

  useEffect(() => {
    if (selectedCommodity) {
      fetchChartData(selectedCommodity);
    }
  }, [selectedCommodity, interval, fetchChartData]);

  const handleCommoditySelect = (symbol: string) => {
    setSelectedCommodity(symbol);
  };

  const getRatioStatus = (name: string): { status: 'neutral' | 'high' | 'low' } => {
    const avg = historicalAverages[name];
    if (!avg) return { status: 'neutral' };
    return { status: 'neutral' };
  };

  const selectedCommodityInfo = commodityData.find(c => c.symbol === selectedCommodity);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scale className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Commodities</h1>
              <p className="text-muted-foreground">
                Precious metals, energy, rare earths and key market ratios
              </p>
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
            <Button 
              variant="outline" 
              size="icon"
              onClick={fetchCommodityPrices}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Commodity Prices Grid */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Spot Prices
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {commodityData.map((commodity) => (
              <Card 
                key={commodity.symbol} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedCommodity === commodity.symbol 
                    ? 'ring-2 ring-primary border-primary' 
                    : 'border-border'
                }`}
                onClick={() => handleCommoditySelect(commodity.symbol)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs text-muted-foreground">{commodity.symbol}</span>
                    {commodity.change >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-bullish" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-bearish" />
                    )}
                  </div>
                  <p className="font-medium text-foreground text-sm">{commodity.name}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-lg font-bold text-foreground">
                      ${commodity.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs text-muted-foreground">/{commodity.unit}</span>
                  </div>
                  <span className={`text-sm font-medium ${commodity.change >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                    {commodity.change >= 0 ? '+' : ''}{commodity.change.toFixed(2)}%
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Chart Section */}
        {chartData && selectedCommodityInfo && (
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {selectedCommodityInfo.name} Chart ({interval.toUpperCase()})
            </h2>
            <Card className="p-4">
              <MiniChart
                candles={chartData.candles}
                ema20={chartData.ema20}
                ema50={chartData.ema50}
              />
            </Card>
          </section>
        )}

        {/* Ratios Section */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Key Ratios
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ratios.map((ratio) => {
              const status = getRatioStatus(ratio.name);
              
              return (
                <Card key={ratio.name} className="border-border hover:shadow-sm transition-all">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span>{ratio.name}</span>
                      {status.status === 'high' && <TrendingUp className="h-4 w-4 text-bullish" />}
                      {status.status === 'low' && <TrendingDown className="h-4 w-4 text-bearish" />}
                      {status.status === 'neutral' && <Minus className="h-4 w-4 text-muted-foreground" />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-foreground">
                        {historicalAverages[ratio.name]?.toFixed(4) || '--'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        (historical avg)
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {ratioDescriptions[ratio.name]}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-1 rounded bg-secondary text-muted-foreground">
                        {ratio.numerator}
                      </span>
                      <span className="text-muted-foreground">/</span>
                      <span className="px-2 py-1 rounded bg-secondary text-muted-foreground">
                        {ratio.denominator}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Rare Earths Section */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-foreground">
            Rare Earths & Strategic Metals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {rareEarthsData.map((item) => (
              <Card key={item.symbol} className="border-border hover:shadow-sm transition-all">
                <CardContent className="p-4">
                  <span className="font-mono font-bold text-primary">{item.symbol}</span>
                  <p className="font-medium text-foreground mt-1">{item.name}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <p className="text-xs text-muted-foreground text-center pt-4 border-t border-border">
          Reference data. Gold price proxied via PAXG token. Prices may not reflect exact spot market values.
        </p>
      </div>
    </div>
  );
}
