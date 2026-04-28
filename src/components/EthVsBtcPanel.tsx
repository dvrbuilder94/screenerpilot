import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Coins } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { calculateEthVsBtc } from '@/lib/cryptoMacro';
import { BloombergInsight } from '@/components/BloombergInsight';
import { ethVsBtcInsight } from '@/lib/bloombergInsights';

export const EthVsBtcPanel = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['eth-vs-btc'],
    queryFn: calculateEthVsBtc,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent shadow-glow">
            <Coins className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <CardTitle>ETH vs BTC</CardTitle>
            <CardDescription>
              Risk/Reward comparison over 90 days
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
            <BloombergInsight insight={ethVsBtcInsight(data)} panel="ETH vs BTC (90d Risk/Reward)" data={data} />
            {/* Side-by-side comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* BTC */}
              <div className={`p-4 rounded-lg border ${data.winner === 'BTC' ? 'border-bullish/50 bg-bullish/5' : 'border-border/50 bg-muted/30'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold">BTC</h3>
                  {data.winner === 'BTC' && (
                    <Badge variant="default" className="bg-bullish text-bullish-foreground">
                      Better R/R
                    </Badge>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">90d Return:</span>
                    <span className={`font-semibold ${data.btc.returns >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                      {data.btc.returns >= 0 ? '+' : ''}{data.btc.returns.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Volatility:</span>
                    <span className="font-semibold">{data.btc.volatility.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Drawdown:</span>
                    <span className="font-semibold text-bearish">{data.btc.maxDrawdown.toFixed(2)}%</span>
                  </div>
                  <div className="pt-2 border-t border-border/50">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Risk/Reward:</span>
                      <span className="font-bold text-primary">{data.btc.riskReward.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ETH */}
              <div className={`p-4 rounded-lg border ${data.winner === 'ETH' ? 'border-bullish/50 bg-bullish/5' : 'border-border/50 bg-muted/30'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold">ETH</h3>
                  {data.winner === 'ETH' && (
                    <Badge variant="default" className="bg-bullish text-bullish-foreground">
                      Better R/R
                    </Badge>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">90d Return:</span>
                    <span className={`font-semibold ${data.eth.returns >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                      {data.eth.returns >= 0 ? '+' : ''}{data.eth.returns.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Volatility:</span>
                    <span className="font-semibold">{data.eth.volatility.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Drawdown:</span>
                    <span className="font-semibold text-bearish">{data.eth.maxDrawdown.toFixed(2)}%</span>
                  </div>
                  <div className="pt-2 border-t border-border/50">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Risk/Reward:</span>
                      <span className="font-bold text-primary">{data.eth.riskReward.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Conclusion */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-sm leading-relaxed">
                <strong className="text-foreground">Conclusion:</strong> {data.conclusion}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
