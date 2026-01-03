import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpIcon, ArrowDownIcon, Scale } from 'lucide-react';
import presets from '@/config/presets.json';

interface CommodityPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

interface RatioData {
  name: string;
  value: number;
  interpretation: string;
  trend: 'bullish' | 'bearish' | 'neutral';
}

const COMMODITY_MAP: Record<string, string> = {
  'GC=F': 'Gold',
  'SI=F': 'Silver',
  'HG=F': 'Copper',
  'CL=F': 'Crude Oil',
  'PL=F': 'Platinum',
  'PA=F': 'Palladium',
};

export function CommoditiesMacro() {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrices() {
      setIsLoading(true);
      setError(null);
      
      try {
        const symbols = ['GC=F', 'SI=F', 'HG=F', 'CL=F', 'PL=F', 'PA=F'];
        const priceMap: Record<string, number> = {};
        
        await Promise.all(
          symbols.map(async (symbol) => {
            try {
              const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-stock-data`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                  },
                  body: JSON.stringify({ symbol, interval: '1d' }),
                }
              );
              
              if (response.ok) {
                const candles = await response.json();
                if (candles.length > 0) {
                  priceMap[symbol] = candles[candles.length - 1].close;
                }
              }
            } catch (err) {
              console.error(`Error fetching ${symbol}:`, err);
            }
          })
        );
        
        setPrices(priceMap);
      } catch (err) {
        setError('Failed to fetch commodity prices');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPrices();
  }, []);

  const calculateRatios = (): RatioData[] => {
    const ratios: RatioData[] = [];
    
    for (const ratio of presets.commodity_ratios) {
      const numPrice = prices[ratio.numerator];
      const denomPrice = prices[ratio.denominator];
      
      if (numPrice && denomPrice && denomPrice > 0) {
        const value = numPrice / denomPrice;
        let interpretation = '';
        let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
        
        if (ratio.name === 'Copper/Gold') {
          if (value > 0.00025) {
            interpretation = 'Risk-on sentiment, economic growth expected';
            trend = 'bullish';
          } else {
            interpretation = 'Risk-off sentiment, defensive positioning';
            trend = 'bearish';
          }
        } else if (ratio.name === 'Gold/Silver') {
          if (value > 80) {
            interpretation = 'Silver undervalued vs Gold, potential upside';
            trend = 'bearish';
          } else if (value < 60) {
            interpretation = 'Silver overvalued vs Gold';
            trend = 'bullish';
          } else {
            interpretation = 'Normal range';
            trend = 'neutral';
          }
        } else if (ratio.name === 'Platinum/Gold') {
          if (value < 0.5) {
            interpretation = 'Platinum historically cheap vs Gold';
            trend = 'bullish';
          } else {
            interpretation = 'Normal range';
            trend = 'neutral';
          }
        } else {
          interpretation = 'Monitor for trends';
          trend = 'neutral';
        }
        
        ratios.push({ name: ratio.name, value, interpretation, trend });
      }
    }
    
    return ratios;
  };

  const ratios = calculateRatios();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border border-border">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Commodity Prices */}
      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Scale className="h-5 w-5 text-primary" />
            Spot Prices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(COMMODITY_MAP).map(([symbol, name]) => (
              <div key={symbol} className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">{name}</p>
                <p className="text-lg font-bold text-foreground">
                  ${prices[symbol]?.toFixed(2) || '—'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Ratios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ratios.map((ratio) => (
          <Card key={ratio.name} className="border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="text-foreground">{ratio.name}</span>
                <Badge 
                  variant={ratio.trend === 'bullish' ? 'default' : ratio.trend === 'bearish' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {ratio.trend === 'bullish' && <ArrowUpIcon className="h-3 w-3 mr-1" />}
                  {ratio.trend === 'bearish' && <ArrowDownIcon className="h-3 w-3 mr-1" />}
                  {ratio.trend.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{ratio.value.toFixed(4)}</p>
              <p className="text-sm text-muted-foreground mt-1">{ratio.interpretation}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Interpretation */}
      <Card className="border border-border bg-muted/20">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Key Insight:</strong> The Copper/Gold ratio is a leading indicator 
            of economic activity. Rising copper relative to gold signals industrial growth, while falling 
            suggests defensive positioning. The Gold/Silver ratio historically reverts to mean around 60-70.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
