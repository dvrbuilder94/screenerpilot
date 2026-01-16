import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpIcon, ArrowDownIcon, Scale } from 'lucide-react';
import presets from '@/config/presets.json';

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
  'CL=F': 'Oil',
  'PL=F': 'Platinum',
};

export function CommoditiesMacro() {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPrices() {
      setIsLoading(true);
      
      try {
        const symbols = Object.keys(COMMODITY_MAP);
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
                const data = await response.json();
                const candles = data.candles || data;
                if (Array.isArray(candles) && candles.length > 0) {
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
        console.error('Failed to fetch commodity prices');
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
        
        // Copper/Gold ratio: economic health indicator
        if (ratio.name === 'Copper/Gold') {
          // Typical range: 0.00015 - 0.0003 (copper ~4-5 / gold ~2000)
          if (value > 0.00022) {
            interpretation = 'Risk-on: Economic expansion expected';
            trend = 'bullish';
          } else if (value < 0.00018) {
            interpretation = 'Risk-off: Defensive positioning';
            trend = 'bearish';
          } else {
            interpretation = 'Neutral economic outlook';
            trend = 'neutral';
          }
        } 
        // Gold/Silver ratio: silver valuation
        else if (ratio.name === 'Gold/Silver') {
          // Historical average ~60-70, extreme >80 or <50
          if (value > 80) {
            interpretation = 'Silver undervalued vs Gold';
            trend = 'bearish';
          } else if (value < 65) {
            interpretation = 'Silver fairly valued';
            trend = 'bullish';
          } else {
            interpretation = 'Normal range (65-80)';
            trend = 'neutral';
          }
        } 
        // Platinum/Gold ratio
        else if (ratio.name === 'Platinum/Gold') {
          // Platinum historically traded at premium to gold, now discount
          if (value < 0.5) {
            interpretation = 'Platinum historically cheap';
            trend = 'bullish';
          } else {
            interpretation = 'Normal range';
            trend = 'neutral';
          }
        }
        
        ratios.push({ name: ratio.name, value, interpretation, trend });
      }
    }
    
    return ratios;
  };

  const ratios = calculateRatios();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Spot Prices - Hero Row */}
      <Card className="border-2 border-border bg-gradient-to-br from-card to-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Scale className="h-5 w-5 text-primary" />
            Spot Prices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(COMMODITY_MAP).map(([symbol, name]) => (
              <div key={symbol} className="text-center p-4 bg-muted/30 rounded-lg border border-border/50">
                <p className="text-sm text-muted-foreground font-medium">{name}</p>
                <p className="text-2xl font-bold mt-1">
                  ${prices[symbol]?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '—'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Ratios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ratios.map((ratio) => (
          <Card key={ratio.name} className="border-2 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>{ratio.name}</span>
                <Badge 
                  variant={ratio.trend === 'bullish' ? 'default' : ratio.trend === 'bearish' ? 'destructive' : 'secondary'}
                >
                  {ratio.trend === 'bullish' && <ArrowUpIcon className="h-3 w-3 mr-1" />}
                  {ratio.trend === 'bearish' && <ArrowDownIcon className="h-3 w-3 mr-1" />}
                  {ratio.trend.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{ratio.value.toFixed(4)}</p>
              <p className="text-sm text-muted-foreground mt-2">{ratio.interpretation}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
