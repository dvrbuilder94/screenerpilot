import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getDominanceData } from '@/lib/cryptoSignals';

export const DominancePanel = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['btc-dominance'],
    queryFn: getDominanceData,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const getStateBadge = (state: string) => {
    switch (state) {
      case 'Risk-On':
        return { variant: 'default' as const, color: 'text-bullish', icon: '🚀' };
      case 'Risk-Off':
        return { variant: 'destructive' as const, color: 'text-bearish', icon: '🛡️' };
      default:
        return { variant: 'secondary' as const, color: 'text-neutral', icon: '⚖️' };
    }
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-bearish'; // Rising dominance = bearish for alts
    if (change < 0) return 'text-bullish'; // Falling dominance = bullish for alts
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
            <CardTitle>BTC Dominance & RSI</CardTitle>
            <CardDescription>
              Market risk regime based on BTC dominance
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
            {/* Market State */}
            <div className="text-center p-6 rounded-lg bg-gradient-to-br from-muted/50 to-muted/20 border border-border/50">
              <div className="text-4xl mb-2">{getStateBadge(data.state).icon}</div>
              <Badge 
                variant={getStateBadge(data.state).variant}
                className="text-lg px-4 py-1"
              >
                {data.state}
              </Badge>
              <div className="text-xs text-muted-foreground mt-2">
                Current Market Regime
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 gap-3">
              {/* Current Dominance */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">BTC Dominance</span>
                  <span className="text-2xl font-bold">{data.dominance.toFixed(2)}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
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
                    {data.change7d > 0 ? '+' : ''}{data.change7d.toFixed(2)}%
                    {data.change7d > 0 ? ' ↑' : data.change7d < 0 ? ' ↓' : ''}
                  </span>
                </div>
              </div>

              {/* Dominance RSI */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Dominance RSI (14)</span>
                  <span className="text-xl font-bold">{data.dominanceRSI.toFixed(1)}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      data.dominanceRSI > 70 ? 'bg-bearish' : 
                      data.dominanceRSI < 30 ? 'bg-bullish' : 
                      'bg-neutral'
                    }`}
                    style={{ width: `${data.dominanceRSI}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Interpretation */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
              <div className="text-sm font-medium mb-2">Interpretation</div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {data.state === 'Risk-Off' && (
                  <span>
                    BTC dominance is <strong className="text-bearish">rising</strong> with RSI above 50. 
                    Market is in risk-off mode, with capital flowing into Bitcoin. 
                    Altcoins typically underperform in this regime.
                  </span>
                )}
                {data.state === 'Risk-On' && (
                  <span>
                    BTC dominance is <strong className="text-bullish">falling</strong> with RSI below 50. 
                    Market is in risk-on mode, with capital rotating into ETH and altcoins. 
                    Favorable environment for alt positions.
                  </span>
                )}
                {data.state === 'Neutral' && (
                  <span>
                    Mixed signals in dominance metrics. Market regime is unclear. 
                    Wait for stronger confirmation before making major allocation shifts.
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
