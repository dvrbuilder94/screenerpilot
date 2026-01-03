import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface SectorData {
  symbol: string;
  name: string;
  price: number;
  category: 'defensive' | 'cyclical';
}

const MARKET_SYMBOLS = [
  { symbol: '^VIX', name: 'VIX' },
  { symbol: '^GSPC', name: 'S&P 500' },
];

const SECTOR_ETFS: SectorData[] = [
  { symbol: 'XLK', name: 'Technology', price: 0, category: 'cyclical' },
  { symbol: 'XLF', name: 'Financials', price: 0, category: 'cyclical' },
  { symbol: 'XLE', name: 'Energy', price: 0, category: 'cyclical' },
  { symbol: 'XLV', name: 'Healthcare', price: 0, category: 'defensive' },
  { symbol: 'XLP', name: 'Consumer Staples', price: 0, category: 'defensive' },
  { symbol: 'XLU', name: 'Utilities', price: 0, category: 'defensive' },
];

export function StocksMacro() {
  const [marketData, setMarketData] = useState<Record<string, number>>({});
  const [sectorData, setSectorData] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const priceMap: Record<string, number> = {};
      const sectorMap: Record<string, number> = {};
      
      // Fetch market indices
      await Promise.all([
        ...MARKET_SYMBOLS.map(async ({ symbol }) => {
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
        }),
        ...SECTOR_ETFS.map(async ({ symbol }) => {
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
              if (candles.length > 1) {
                const latest = candles[candles.length - 1].close;
                const previous = candles[candles.length - 2].close;
                const changePercent = ((latest - previous) / previous) * 100;
                sectorMap[symbol] = changePercent;
              }
            }
          } catch (err) {
            console.error(`Error fetching ${symbol}:`, err);
          }
        })
      ]);
      
      setMarketData(priceMap);
      setSectorData(sectorMap);
      setIsLoading(false);
    }
    
    fetchData();
  }, []);

  const getVixInterpretation = (vix: number) => {
    if (vix < 15) return { text: 'Complacency', color: 'text-green-600' };
    if (vix < 20) return { text: 'Low Vol', color: 'text-green-500' };
    if (vix < 25) return { text: 'Normal', color: 'text-yellow-500' };
    if (vix < 30) return { text: 'Elevated', color: 'text-orange-500' };
    return { text: 'Extreme Fear', color: 'text-red-500' };
  };

  const getSectorRotationSignal = () => {
    const cyclicalAvg = ['XLK', 'XLF', 'XLE'].reduce((sum, s) => sum + (sectorData[s] || 0), 0) / 3;
    const defensiveAvg = ['XLV', 'XLP', 'XLU'].reduce((sum, s) => sum + (sectorData[s] || 0), 0) / 3;
    const diff = cyclicalAvg - defensiveAvg;
    
    if (diff > 0.5) return { signal: 'Risk-On', description: 'Money flowing into cyclical sectors', trend: 'bullish' as const };
    if (diff < -0.5) return { signal: 'Risk-Off', description: 'Money flowing into defensive sectors', trend: 'bearish' as const };
    return { signal: 'Neutral', description: 'No clear rotation pattern', trend: 'neutral' as const };
  };

  const vix = marketData['^VIX'];
  const sp500 = marketData['^GSPC'];
  const vixStatus = vix ? getVixInterpretation(vix) : null;
  const rotationSignal = getSectorRotationSignal();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Row - VIX and S&P */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* VIX Panel */}
        <Card className="border-2 border-border bg-gradient-to-br from-card to-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              VIX Volatility Index
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-5xl font-bold tracking-tight">{vix?.toFixed(1) || '—'}</p>
                {vixStatus && (
                  <p className={`text-xl font-semibold mt-1 ${vixStatus.color}`}>
                    {vixStatus.text}
                  </p>
                )}
              </div>
              {/* VIX Gauge */}
              <div className="w-32">
                <div className="h-3 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full relative">
                  {vix && (
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-foreground rounded-full border-2 border-background shadow-lg"
                      style={{ left: `${Math.min(100, (vix / 50) * 100)}%`, transform: 'translate(-50%, -50%)' }}
                    />
                  )}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0</span>
                  <span>50+</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* S&P 500 Panel */}
        <Card className="border-2 border-border bg-gradient-to-br from-card to-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              S&P 500
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold tracking-tight">
              {sp500?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '—'}
            </p>
            <p className="text-muted-foreground mt-1">Key benchmark index</p>
          </CardContent>
        </Card>
      </div>

      {/* Sector Rotation */}
      <Card className="border-2 border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              Sector Rotation
            </CardTitle>
            <Badge 
              variant={rotationSignal.trend === 'bullish' ? 'default' : rotationSignal.trend === 'bearish' ? 'destructive' : 'secondary'}
              className="text-sm px-3 py-1"
            >
              {rotationSignal.signal}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{rotationSignal.description}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {SECTOR_ETFS.map(({ symbol, name, category }) => {
              const change = sectorData[symbol];
              const isPositive = change > 0;
              return (
                <div 
                  key={symbol} 
                  className={`p-3 rounded-lg border ${category === 'cyclical' ? 'bg-blue-500/5 border-blue-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground">{symbol}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {category === 'cyclical' ? 'Cyclical' : 'Defensive'}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium">{name}</p>
                  <div className={`flex items-center gap-1 mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <span className="text-sm font-bold">
                      {change !== undefined ? `${isPositive ? '+' : ''}${change.toFixed(2)}%` : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
