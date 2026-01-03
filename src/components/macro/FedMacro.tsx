import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Landmark, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

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
    if (value > 105) return { text: 'Strong Dollar', trend: 'bearish' as const, note: 'Headwind for commodities & emerging markets' };
    if (value > 100) return { text: 'Neutral-Strong', trend: 'neutral' as const, note: 'Dollar holding above key level' };
    if (value > 95) return { text: 'Neutral-Weak', trend: 'neutral' as const, note: 'Dollar in consolidation zone' };
    return { text: 'Weak Dollar', trend: 'bullish' as const, note: 'Tailwind for commodities & risk assets' };
  };

  const getYieldCurve = () => {
    if (!yield10y || !yield5y) return null;
    const spread = yield10y - yield5y;
    if (spread < 0) return { text: 'Inverted', status: 'warning', note: 'Historically signals recession risk' };
    if (spread < 0.25) return { text: 'Flat', status: 'caution', note: 'Economic uncertainty' };
    return { text: 'Normal', status: 'healthy', note: 'Healthy economic conditions' };
  };

  const dxyStatus = dxy ? getDxyInterpretation(dxy) : null;
  const yieldCurve = getYieldCurve();

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
      {/* DXY Panel */}
      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <DollarSign className="h-5 w-5 text-primary" />
            US Dollar Index (DXY)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold text-foreground">{dxy?.toFixed(2) || '—'}</p>
              {dxyStatus && (
                <>
                  <Badge 
                    variant={dxyStatus.trend === 'bullish' ? 'default' : dxyStatus.trend === 'bearish' ? 'destructive' : 'secondary'}
                    className="mt-2"
                  >
                    {dxyStatus.trend === 'bullish' && <TrendingUp className="h-3 w-3 mr-1" />}
                    {dxyStatus.trend === 'bearish' && <TrendingDown className="h-3 w-3 mr-1" />}
                    {dxyStatus.text}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">{dxyStatus.note}</p>
                </>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Key Levels</p>
              <div className="space-y-1 mt-1">
                <Badge variant="outline" className="text-xs block">Support: 100</Badge>
                <Badge variant="outline" className="text-xs block">Resistance: 107</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Treasury Yields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-border">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">5Y Treasury Yield</p>
            <p className="text-2xl font-bold text-foreground">{yield5y?.toFixed(2) || '—'}%</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">10Y Treasury Yield</p>
            <p className="text-2xl font-bold text-foreground">{yield10y?.toFixed(2) || '—'}%</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">30Y Treasury Yield</p>
            <p className="text-2xl font-bold text-foreground">{yield30y?.toFixed(2) || '—'}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Yield Curve Analysis */}
      {yieldCurve && (
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Landmark className="h-5 w-5 text-primary" />
              Yield Curve Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Badge 
                  variant={yieldCurve.status === 'healthy' ? 'default' : yieldCurve.status === 'warning' ? 'destructive' : 'secondary'}
                  className="text-lg px-4 py-1"
                >
                  {yieldCurve.text}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">{yieldCurve.note}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">10Y-5Y Spread</p>
                <p className="text-xl font-bold text-foreground">
                  {yield10y && yield5y ? ((yield10y - yield5y) * 100).toFixed(0) : '—'} bps
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fed Insight */}
      <Card className="border border-border bg-muted/20">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Monetary Policy Context:</strong> Rising yields typically indicate 
            expectations of higher rates or inflation, which can pressure growth stocks and support financials. 
            A strong dollar tends to be a headwind for commodities and emerging markets while benefiting 
            domestic-focused companies.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
