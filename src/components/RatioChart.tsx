import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, LineChart } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Area, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import presets from '@/config/presets.json';

interface RatioPoint {
  date: string;
  timestamp: number;
  ratio: number;
  numeratorPrice: number;
  denominatorPrice: number;
}

interface RatioPreset {
  name: string;
  numerator: string;
  denominator: string;
}

type Timeframe = '2Y' | '5Y' | '10Y';

const TIMEFRAME_CONFIG: Record<Timeframe, { interval: string; label: string }> = {
  '2Y': { interval: '1d', label: '2 Years' },
  '5Y': { interval: '1w', label: '5 Years' },
  '10Y': { interval: '1M', label: '10 Years' },
};

const SYMBOL_LABELS: Record<string, string> = {
  'GC=F': 'Gold',
  'SI=F': 'Silver',
  'CL=F': 'Oil',
  'HG=F': 'Copper',
  'PL=F': 'Platinum',
  'PA=F': 'Palladium',
  'NG=F': 'Nat Gas',
};

async function fetchCandles(symbol: string, interval: string): Promise<{ timestamp: number; close: number }[]> {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
      body: { symbol, interval },
    });

    if (error) {
      console.error(`Error fetching ${symbol}:`, error);
      return [];
    }

    const candles = data?.candles || data || [];
    if (!Array.isArray(candles)) return [];

    return candles.map((c: any) => ({
      timestamp: c.openTime,
      close: c.close,
    }));
  } catch (err) {
    console.error(`Failed to fetch ${symbol}:`, err);
    return [];
  }
}

function formatDate(timestamp: number, timeframe: Timeframe): string {
  const date = new Date(timestamp);
  if (timeframe === '10Y') {
    return date.toLocaleDateString('en-US', { year: '2-digit', month: 'short' });
  }
  if (timeframe === '5Y') {
    return date.toLocaleDateString('en-US', { year: '2-digit', month: 'short' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function RatioChart() {
  const ratios: RatioPreset[] = presets.commodity_ratios || [];
  const [selectedRatio, setSelectedRatio] = useState<string>(ratios[0]?.name || 'Copper/Gold');
  const [timeframe, setTimeframe] = useState<Timeframe>('5Y');
  const [ratioData, setRatioData] = useState<RatioPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const currentRatioConfig = ratios.find((r) => r.name === selectedRatio);

  useEffect(() => {
    if (!currentRatioConfig) return;

    const loadData = async () => {
      setIsLoading(true);
      const config = TIMEFRAME_CONFIG[timeframe];

      const [numData, denomData] = await Promise.all([
        fetchCandles(currentRatioConfig.numerator, config.interval),
        fetchCandles(currentRatioConfig.denominator, config.interval),
      ]);

      if (numData.length === 0 || denomData.length === 0) {
        setRatioData([]);
        setIsLoading(false);
        return;
      }

      // Create map for denominator by timestamp
      const denomMap = new Map<number, number>();
      denomData.forEach((d) => denomMap.set(d.timestamp, d.close));

      // Calculate ratio where both have data
      const aligned: RatioPoint[] = [];
      for (const numPoint of numData) {
        const denomClose = denomMap.get(numPoint.timestamp);
        if (denomClose && denomClose > 0) {
          aligned.push({
            timestamp: numPoint.timestamp,
            date: formatDate(numPoint.timestamp, timeframe),
            ratio: numPoint.close / denomClose,
            numeratorPrice: numPoint.close,
            denominatorPrice: denomClose,
          });
        }
      }

      // Sort by timestamp
      aligned.sort((a, b) => a.timestamp - b.timestamp);
      setRatioData(aligned);
      setIsLoading(false);
    };

    loadData();
  }, [selectedRatio, timeframe, currentRatioConfig]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (ratioData.length === 0) return null;

    const values = ratioData.map((d) => d.ratio);
    const current = values[values.length - 1];
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    const high = Math.max(...values);
    const low = Math.min(...values);
    const deviation = ((current - avg) / avg) * 100;

    return { current, avg, high, low, deviation };
  }, [ratioData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;
    const data = payload[0].payload as RatioPoint;
    const numLabel = SYMBOL_LABELS[currentRatioConfig?.numerator || ''] || currentRatioConfig?.numerator;
    const denomLabel = SYMBOL_LABELS[currentRatioConfig?.denominator || ''] || currentRatioConfig?.denominator;

    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="text-xs text-muted-foreground mb-1">{new Date(data.timestamp).toLocaleDateString()}</p>
        <p className="font-bold text-foreground">{data.ratio.toFixed(4)}</p>
        <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
          <p>{numLabel}: ${data.numeratorPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          <p>{denomLabel}: ${data.denominatorPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
        </div>
      </div>
    );
  };

  // Y-axis domain
  const yDomain = useMemo(() => {
    if (ratioData.length === 0) return [0, 1];
    const values = ratioData.map((d) => d.ratio);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1;
    return [min - padding, max + padding];
  }, [ratioData]);

  return (
    <Card className="border-2 border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-primary" />
            <span>Ratio Charts</span>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedRatio} onValueChange={setSelectedRatio}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ratios.map((r) => (
                  <SelectItem key={r.name} value={r.name}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex rounded-md border border-border overflow-hidden">
              {(['2Y', '5Y', '10Y'] as Timeframe[]).map((tf) => (
                <Button
                  key={tf}
                  variant={timeframe === tf ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-none px-3 h-9"
                  onClick={() => setTimeframe(tf)}
                >
                  {tf}
                </Button>
              ))}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : ratioData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No data available for this ratio
          </div>
        ) : (
          <>
            {/* Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={ratioData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ratioGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    interval="preserveStartEnd"
                    minTickGap={50}
                  />
                  <YAxis
                    domain={yDomain}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    tickFormatter={(v) => v.toFixed(3)}
                    width={60}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {stats && (
                    <ReferenceLine
                      y={stats.avg}
                      stroke="hsl(var(--muted-foreground))"
                      strokeDasharray="5 5"
                      strokeOpacity={0.5}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="ratio"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#ratioGradient)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Statistics */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-border">
                <div className="text-center p-2 bg-muted/30 rounded">
                  <p className="text-xs text-muted-foreground">Current</p>
                  <p className="font-bold text-foreground">{stats.current.toFixed(4)}</p>
                </div>
                <div className="text-center p-2 bg-muted/30 rounded">
                  <p className="text-xs text-muted-foreground">{timeframe} Average</p>
                  <p className="font-bold text-foreground">{stats.avg.toFixed(4)}</p>
                </div>
                <div className="text-center p-2 bg-muted/30 rounded">
                  <p className="text-xs text-muted-foreground">High</p>
                  <p className="font-bold text-foreground">{stats.high.toFixed(4)}</p>
                </div>
                <div className="text-center p-2 bg-muted/30 rounded">
                  <p className="text-xs text-muted-foreground">Low</p>
                  <p className="font-bold text-foreground">{stats.low.toFixed(4)}</p>
                </div>
                <div className="text-center p-2 bg-muted/30 rounded">
                  <p className="text-xs text-muted-foreground">vs Average</p>
                  <div className="flex items-center justify-center gap-1">
                    {stats.deviation > 5 && <TrendingUp className="h-3 w-3 text-bullish" />}
                    {stats.deviation < -5 && <TrendingDown className="h-3 w-3 text-bearish" />}
                    {Math.abs(stats.deviation) <= 5 && <Minus className="h-3 w-3 text-muted-foreground" />}
                    <span
                      className={`font-bold ${
                        stats.deviation > 5 ? 'text-bullish' : stats.deviation < -5 ? 'text-bearish' : 'text-foreground'
                      }`}
                    >
                      {stats.deviation > 0 ? '+' : ''}
                      {stats.deviation.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
