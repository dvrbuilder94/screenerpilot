import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getDominanceData } from '@/lib/cryptoMetrics';
import { BloombergInsight } from '@/components/BloombergInsight';
import { dominanceInsight } from '@/lib/bloombergInsights';

export const DominancePanel = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['btc-dominance'],
    queryFn: getDominanceData,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-red-500';
    if (change < 0) return 'text-green-500';
    return 'text-muted-foreground';
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent shadow-glow">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <CardTitle>BTC Dominance</CardTitle>
            <CardDescription>
              Bitcoin market cap percentage
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
          <div className="space-y-6">
            <BloombergInsight insight={dominanceInsight(data)} />
            {/* Main Dominance Value */}
            <div className="text-center">
              <div className="text-6xl font-bold text-primary">
                {data.dominance.toFixed(2)}%
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Current Dominance
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-secondary rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent shadow-glow transition-all duration-500"
                  style={{ width: `${data.dominance}%` }}
                />
              </div>
            </div>

            {/* 7-Day Change */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">7-Day Change</span>
                <span className={`text-xl font-bold ${getChangeColor(data.change7d)}`}>
                  {data.change7d > 0 ? '+' : ''}{data.change7d.toFixed(2)}% {data.change7d > 0 ? '↑' : '↓'}
                </span>
              </div>
            </div>

            {/* Interpretation */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
              <div className="text-xs font-medium text-muted-foreground mb-2">Interpretation</div>
              <p className="text-sm leading-relaxed">
                {data.change7d > 0 && (
                  <>Bitcoin dominance is rising, indicating capital is flowing into BTC. This typically signals risk-off sentiment where investors prefer the safety of Bitcoin over altcoins.</>
                )}
                {data.change7d < 0 && (
                  <>Bitcoin dominance is falling, indicating capital is rotating into altcoins. This typically signals risk-on sentiment where investors are seeking higher returns in alternative cryptocurrencies.</>
                )}
                {Math.abs(data.change7d) < 0.1 && (
                  <>Bitcoin dominance is stable. Market is in equilibrium without clear rotation between BTC and altcoins.</>
                )}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
