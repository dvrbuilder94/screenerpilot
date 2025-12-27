import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Scale, DollarSign } from "lucide-react";
import presets from "@/config/presets.json";

interface RatioData {
  name: string;
  numerator: string;
  denominator: string;
}

interface CommodityPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
  unit: string;
}

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

// Reference prices for commodities
const commodityPrices: CommodityPrice[] = [
  { symbol: "XAUUSD", name: "Gold", price: 2650.00, change: 0.45, unit: "oz" },
  { symbol: "XAGUSD", name: "Silver", price: 31.50, change: -0.32, unit: "oz" },
  { symbol: "XPTUSD", name: "Platinum", price: 985.00, change: 0.18, unit: "oz" },
  { symbol: "XPDUSD", name: "Palladium", price: 1025.00, change: -0.55, unit: "oz" },
  { symbol: "XCUUSD", name: "Copper", price: 4.25, change: 0.22, unit: "lb" },
  { symbol: "CL=F", name: "Crude Oil (WTI)", price: 72.50, change: -1.20, unit: "bbl" },
  { symbol: "NG=F", name: "Natural Gas", price: 2.85, change: 0.65, unit: "MMBtu" },
  { symbol: "HG=F", name: "Copper Futures", price: 4.28, change: 0.15, unit: "lb" },
];

const rareEarthsData = [
  { symbol: "MP", name: "MP Materials", description: "Largest rare earth producer in Western Hemisphere" },
  { symbol: "LYSCF", name: "Lynas Rare Earths", description: "Australian rare earths mining company" },
  { symbol: "ILHMF", name: "Iluka Resources", description: "Mineral sands and rare earths producer" },
  { symbol: "REMX", name: "VanEck Rare Earth ETF", description: "ETF tracking rare earth and strategic metals" },
];

export default function Commodities() {
  const ratios: RatioData[] = presets.commodity_ratios || [];

  const getRatioStatus = (name: string) => {
    const avg = historicalAverages[name];
    if (!avg) return { status: 'neutral' as const };
    
    // Simulated current value (in production, fetch real data)
    const deviation = Math.random() * 40 - 20; // Random for demo
    
    if (deviation > 15) {
      return { status: 'high' as const, deviation };
    } else if (deviation < -15) {
      return { status: 'low' as const, deviation };
    }
    return { status: 'neutral' as const, deviation };
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Scale className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Commodities</h1>
          <p className="text-muted-foreground">
            Precious metals, energy, rare earths and key market ratios
          </p>
        </div>
      </div>

      {/* Commodity Prices Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-2">
          <DollarSign className="h-6 w-6" />
          Spot Prices
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {commodityPrices.map((commodity) => (
            <Card key={commodity.symbol} className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-xs text-muted-foreground">{commodity.symbol}</span>
                  {commodity.change >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <p className="font-semibold text-foreground">{commodity.name}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-bold text-foreground">
                    ${commodity.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-muted-foreground">/{commodity.unit}</span>
                </div>
                <span className={`text-sm ${commodity.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {commodity.change >= 0 ? '+' : ''}{commodity.change.toFixed(2)}%
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Ratios Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-2">
          <Scale className="h-6 w-6" />
          Key Ratios
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ratios.map((ratio) => {
            const status = getRatioStatus(ratio.name);
            
            return (
              <Card key={ratio.name} className="bg-card border-border hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span>{ratio.name}</span>
                    {status.status === 'high' && <TrendingUp className="h-5 w-5 text-green-500" />}
                    {status.status === 'low' && <TrendingDown className="h-5 w-5 text-red-500" />}
                    {status.status === 'neutral' && <Minus className="h-5 w-5 text-muted-foreground" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-foreground">
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
                    <span className="px-2 py-1 rounded bg-muted text-muted-foreground">
                      {ratio.numerator}
                    </span>
                    <span className="text-muted-foreground">/</span>
                    <span className="px-2 py-1 rounded bg-muted text-muted-foreground">
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
        <h2 className="text-2xl font-bold mb-4 text-foreground">
          Rare Earths & Strategic Metals
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {rareEarthsData.map((item) => (
            <Card key={item.symbol} className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <span className="font-mono font-bold text-primary text-lg">{item.symbol}</span>
                <p className="font-semibold text-foreground mt-1">{item.name}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <p className="text-xs text-muted-foreground text-center mt-8">
        Reference data. Prices are indicative and may not reflect real-time market values.
      </p>
    </div>
  );
}
