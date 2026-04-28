import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAltseasonIndex } from '@/lib/cryptoMetrics';
import { BloombergInsight } from '@/components/BloombergInsight';
import { altseasonInsight } from '@/lib/bloombergInsights';

export const AltseasonIndexPanel = () => {
  const [lookbackDays, setLookbackDays] = useState(30);

  const { data, isLoading, error } = useQuery({
    queryKey: ['altseason-index-improved', lookbackDays],
    queryFn: () => getAltseasonIndex(lookbackDays),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const getIndexColor = (value: number) => {
    if (value < 30) return 'text-bearish';
    if (value < 60) return 'text-neutral';
    return 'text-bullish';
  };

  const getGradientColor = (value: number) => {
    if (value < 30) return 'from-bearish to-bearish-light';
    if (value < 60) return 'from-neutral to-neutral-light';
    return 'from-bullish to-bullish-light';
  };

  const getTrendBadgeVariant = (trend: string) => {
    if (trend === 'Bullish' || trend === 'Falling') return 'default';
    if (trend === 'Bearish' || trend === 'Rising') return 'destructive';
    return 'secondary';
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent shadow-glow">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <CardTitle>Altseason Index</CardTitle>
            <CardDescription>
              Advanced multi-factor altseason probability
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Lookback Period Selector */}
        <div className="flex gap-2">
          {[30, 60, 90].map((days) => (
            <Button
              key={days}
              variant={lookbackDays === days ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLookbackDays(days)}
              disabled={isLoading}
            >
              {days}d
            </Button>
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-destructive">
            Error loading data. Please try again.
          </div>
        )}

        {data && (
          <>
            <BloombergInsight insight={altseasonInsight(data)} panel={`Altseason Index (${lookbackDays}d)`} data={data} />
            {/* Main Index Value */}
            <div className="text-center">
              <div className={`text-6xl font-bold ${getIndexColor(data.index)}`}>
                {data.index}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Altseason Index Score
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-secondary rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${getGradientColor(data.index)} transition-all duration-500 shadow-glow`}
                  style={{ width: `${data.index}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Bitcoin Season</span>
                <span>Neutral</span>
                <span>Altseason</span>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="space-y-3">
              {/* Alts Outperforming */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Alts Outperforming BTC</span>
                  <Badge variant="default">
                    {data.percentOutperforming}%
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {data.altsOutperforming} of {data.totalAlts} alts beating BTC ({lookbackDays}d)
                </div>
              </div>

              {/* ETHBTC Trend */}
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">ETH/BTC Trend</span>
                  <Badge variant={getTrendBadgeVariant(data.ethbtcTrend)}>
                    {data.ethbtcTrend}
                  </Badge>
                </div>
              </div>

              {/* BTC Dominance Arrow */}
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">BTC Dominance</span>
                  <span className="text-2xl">{data.dominanceArrow}</span>
                </div>
              </div>
            </div>

            {/* Interpretation */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-sm leading-relaxed">
                {data.index < 30 && (
                  <span>
                    <strong className="text-bearish">Bitcoin Season:</strong> BTC is dominating the market. 
                    Most altcoins are underperforming. Consider waiting for better entry points.
                  </span>
                )}
                {data.index >= 30 && data.index < 70 && (
                  <span>
                    <strong className="text-neutral">Neutral Phase:</strong> Mixed signals in the market. 
                    Some alts are performing well, but no clear altseason yet.
                  </span>
                )}
                {data.index >= 70 && (
                  <span>
                    <strong className="text-bullish">Altseason Active:</strong> Strong altcoin performance! 
                    Majority of alts are outperforming BTC. Prime time for alt positions.
                  </span>
                )}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
