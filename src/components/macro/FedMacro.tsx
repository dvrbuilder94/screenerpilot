import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Landmark, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { EconomicCalendar } from './EconomicCalendar';

export function FedMacro() {
  const [marketData, setMarketData] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  const ECONOMIC_SYMBOLS = [
    { symbol: 'DX-Y.NYB', name: 'US Dollar Index (DXY)' },
    { symbol: '^TNX', name: '10Y Treasury Yield' },
    { symbol: '^TYX', name: '30Y Treasury Yield' },
    { symbol: '^FVX', name: '5Y Treasury Yield' },
  ];

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const priceMap: Record<string, number> = {};
      
      await Promise.all(
        ECONOMIC_SYMBOLS.map(async ({ symbol }) => {
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

  const dxy = marketData['DX-Y.NYB'];
  const yield10y = marketData['^TNX'];
  const yield30y = marketData['^TYX'];
  const yield5y = marketData['^FVX'];

  const getDxyInterpretation = (value: number) => {
    if (value > 105) return { text: 'Strong Dollar', trend: 'bearish' as const };
    if (value > 100) return { text: 'Neutral-Strong', trend: 'neutral' as const };
    if (value > 95) return { text: 'Neutral-Weak', trend: 'neutral' as const };
    return { text: 'Weak Dollar', trend: 'bullish' as const };
  };

  const getYieldCurve = () => {
    if (!yield10y || !yield5y) return null;
    const spread = yield10y - yield5y;
    if (spread < 0) return { text: 'Inverted', status: 'warning' as const, spread };
    if (spread < 0.25) return { text: 'Flat', status: 'caution' as const, spread };
    return { text: 'Normal', status: 'healthy' as const, spread };
  };

  const dxyStatus = dxy ? getDxyInterpretation(dxy) : null;
  const yieldCurve = getYieldCurve();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Row - DXY and Yield Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DXY Panel */}
        <Card className="border-2 border-border bg-gradient-to-br from-card to-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-primary" />
              US Dollar Index (DXY)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-5xl font-bold tracking-tight">{dxy?.toFixed(2) || '—'}</p>
                {dxyStatus && (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge 
                      variant={dxyStatus.trend === 'bullish' ? 'default' : dxyStatus.trend === 'bearish' ? 'destructive' : 'secondary'}
                    >
                      {dxyStatus.trend === 'bullish' && <TrendingUp className="h-3 w-3 mr-1" />}
                      {dxyStatus.trend === 'bearish' && <TrendingDown className="h-3 w-3 mr-1" />}
                      {dxyStatus.text}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>Support: 100</p>
                <p>Resistance: 107</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Yield Curve Panel */}
        <Card className="border-2 border-border bg-gradient-to-br from-card to-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Landmark className="h-5 w-5 text-primary" />
              Yield Curve (10Y-5Y)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                {yieldCurve && (
                  <>
                    <Badge 
                      variant={yieldCurve.status === 'healthy' ? 'default' : yieldCurve.status === 'warning' ? 'destructive' : 'secondary'}
                      className="text-xl px-4 py-2 mb-2"
                    >
                      {yieldCurve.text}
                    </Badge>
                    <p className="text-3xl font-bold mt-2">
                      {(yieldCurve.spread * 100).toFixed(0)} bps
                    </p>
                  </>
                )}
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>{yieldCurve?.status === 'warning' ? 'Recession signal' : yieldCurve?.status === 'caution' ? 'Economic uncertainty' : 'Healthy conditions'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Treasury Yields */}
      <Card className="border-2 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Treasury Yields</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">5Y Yield</p>
              <p className="text-3xl font-bold">{yield5y?.toFixed(2) || '—'}%</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">10Y Yield</p>
              <p className="text-3xl font-bold">{yield10y?.toFixed(2) || '—'}%</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">30Y Yield</p>
              <p className="text-3xl font-bold">{yield30y?.toFixed(2) || '—'}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Economic Calendar */}
      <EconomicCalendar />
    </div>
  );
}
