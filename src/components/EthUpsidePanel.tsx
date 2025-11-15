import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getEthUpsideScore } from '@/lib/cryptoSignals';

export const EthUpsidePanel = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['eth-upside'],
    queryFn: getEthUpsideScore,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const getScoreColor = (score: number) => {
    if (score < 30) return 'text-bearish';
    if (score < 60) return 'text-neutral';
    return 'text-bullish';
  };

  const getGradientColor = (score: number) => {
    if (score < 30) return 'from-bearish to-bearish-light';
    if (score < 60) return 'from-neutral to-neutral-light';
    return 'from-bullish to-bullish-light';
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent shadow-glow">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <CardTitle>ETH Upside Probability</CardTitle>
            <CardDescription>
              Quantitative score for ETH/BTC bullish movement
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
            {/* Main Score */}
            <div className="text-center">
              <div className={`text-6xl font-bold ${getScoreColor(data.score)}`}>
                {data.score}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Upside Probability Score
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-secondary rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${getGradientColor(data.score)} transition-all duration-500 shadow-glow`}
                  style={{ width: `${data.score}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>

            {/* Supporting Data */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="text-xs text-muted-foreground mb-1">ETH/BTC Price</div>
                <div className="font-semibold">{data.ethbtcPrice.toFixed(6)}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="text-xs text-muted-foreground mb-1">BB Width</div>
                <div className="font-semibold">{data.bbWidth.toFixed(4)}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="text-xs text-muted-foreground mb-1">EMA50</div>
                <div className="font-semibold">{data.ema50.toFixed(6)}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="text-xs text-muted-foreground mb-1">EMA200</div>
                <div className="font-semibold">{data.ema200.toFixed(6)}</div>
              </div>
            </div>

            {/* Factors Analysis */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
              <div className="text-sm font-medium mb-3">Signal Factors</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Above EMA50</span>
                  <Badge variant={data.factors.aboveEma50 ? 'default' : 'secondary'}>
                    {data.factors.aboveEma50 ? '✓ Yes' : '✗ No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Above EMA200</span>
                  <Badge variant={data.factors.aboveEma200 ? 'default' : 'secondary'}>
                    {data.factors.aboveEma200 ? '✓ Yes' : '✗ No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">BB Compressed</span>
                  <Badge variant={data.factors.compressed ? 'default' : 'secondary'}>
                    {data.factors.compressed ? '✓ Yes' : '✗ No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">RSI Rising (14)</span>
                  <Badge variant={data.factors.rsiRising ? 'default' : 'secondary'}>
                    {data.rsi.toFixed(1)} {data.factors.rsiRising ? '↑' : '↓'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
