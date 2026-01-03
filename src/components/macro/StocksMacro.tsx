import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, AlertTriangle, Activity } from 'lucide-react';

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

export function StocksMacro() {
  const [marketData, setMarketData] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  const MARKET_SYMBOLS = [
    { symbol: '^VIX', name: 'VIX (Volatility)' },
    { symbol: '^GSPC', name: 'S&P 500' },
    { symbol: '^NDX', name: 'NASDAQ 100' },
    { symbol: '^RUT', name: 'Russell 2000' },
  ];

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const priceMap: Record<string, number> = {};
      
      await Promise.all(
        MARKET_SYMBOLS.map(async ({ symbol }) => {
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
      
      setMarketData(priceMap);
      setIsLoading(false);
    }
    
    fetchData();
  }, []);

  const getVixInterpretation = (vix: number) => {
    if (vix < 15) return { text: 'Extreme Complacency', color: 'text-green-500', level: 'low' };
    if (vix < 20) return { text: 'Low Volatility', color: 'text-green-400', level: 'low' };
    if (vix < 25) return { text: 'Normal Range', color: 'text-yellow-500', level: 'normal' };
    if (vix < 30) return { text: 'Elevated Fear', color: 'text-orange-500', level: 'elevated' };
    return { text: 'Extreme Fear', color: 'text-red-500', level: 'high' };
  };

  const vix = marketData['^VIX'];
  const vixStatus = vix ? getVixInterpretation(vix) : null;

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
      {/* VIX Panel */}
      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Activity className="h-5 w-5 text-primary" />
            VIX - Volatility Index
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold text-foreground">{vix?.toFixed(2) || '—'}</p>
              {vixStatus && (
                <p className={`text-lg font-medium ${vixStatus.color}`}>
                  {vixStatus.text}
                </p>
              )}
            </div>
            <div className="text-right space-y-2">
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">{'< 15: Complacency'}</Badge>
                <Badge variant="outline" className="text-xs">15-20: Low</Badge>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">20-25: Normal</Badge>
                <Badge variant="outline" className="text-xs">{'> 30: Fear'}</Badge>
              </div>
            </div>
          </div>
          
          {/* VIX Gauge */}
          <div className="mt-4">
            <div className="h-3 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full relative">
              {vix && (
                <div 
                  className="absolute top-0 w-3 h-3 bg-foreground rounded-full border-2 border-background shadow-md"
                  style={{ left: `${Math.min(100, (vix / 50) * 100)}%`, transform: 'translateX(-50%)' }}
                />
              )}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0</span>
              <span>25</span>
              <span>50+</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Major Indices */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MARKET_SYMBOLS.filter(s => s.symbol !== '^VIX').map(({ symbol, name }) => (
          <Card key={symbol} className="border border-border">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{name}</p>
              <p className="text-2xl font-bold text-foreground">
                {marketData[symbol]?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '—'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Market Breadth Insight */}
      <Card className="border border-border bg-muted/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {vix && vix > 25 ? (
              <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            ) : (
              <TrendingUp className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-medium text-foreground">Market Analysis</p>
              <p className="text-sm text-muted-foreground mt-1">
                {vix && vix > 30 
                  ? 'High VIX indicates elevated fear and potential capitulation. Historically, extreme VIX readings can signal buying opportunities for long-term investors.'
                  : vix && vix < 15
                  ? 'Low VIX suggests market complacency. While conditions are calm, be aware that low volatility often precedes volatility spikes.'
                  : 'Markets are trading in a normal volatility range. Monitor for sector rotation and earnings momentum.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
