import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchCandles, Candle } from '@/lib/binanceApi';
import { BloombergInsight } from '@/components/BloombergInsight';
import { bmnrVsEthInsight } from '@/lib/bloombergInsights';

interface AssetMetrics {
  returns: number;
  volatility: number;
  maxDrawdown: number;
  riskReward: number;
}

function calcReturn(start: number, end: number) {
  return ((end - start) / start) * 100;
}

function calcVolatility(candles: Candle[]) {
  if (candles.length < 2) return 0;
  const rets = [];
  for (let i = 1; i < candles.length; i++) {
    rets.push((candles[i].close - candles[i - 1].close) / candles[i - 1].close);
  }
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance = rets.reduce((s, r) => s + (r - mean) ** 2, 0) / rets.length;
  return Math.sqrt(variance) * 100;
}

function calcMaxDrawdown(candles: Candle[]) {
  let peak = candles[0].close;
  let maxDD = 0;
  for (const c of candles) {
    if (c.close > peak) peak = c.close;
    const dd = ((c.close - peak) / peak) * 100;
    if (dd < maxDD) maxDD = dd;
  }
  return maxDD;
}

async function calculateBmnrVsEth() {
  const [bmnrCandles, ethCandles] = await Promise.all([
    fetchCandles('BMNR' as any, '1d', 90),
    fetchCandles('ETHUSDT', '1d', 90),
  ]);

  if (bmnrCandles.length < 2 || ethCandles.length < 2) {
    throw new Error('Not enough data');
  }

  const compute = (candles: Candle[]): AssetMetrics => {
    const returns = calcReturn(candles[0].close, candles[candles.length - 1].close);
    const volatility = calcVolatility(candles);
    const maxDrawdown = calcMaxDrawdown(candles);
    const riskReward = volatility > 0 ? returns / volatility : 0;
    return { returns, volatility, maxDrawdown, riskReward };
  };

  const bmnr = compute(bmnrCandles);
  const eth = compute(ethCandles);

  const winner: 'BMNR' | 'ETH' | 'NEUTRAL' =
    bmnr.riskReward > eth.riskReward + 0.1 ? 'BMNR' :
    eth.riskReward > bmnr.riskReward + 0.1 ? 'ETH' : 'NEUTRAL';

  let conclusion = '';
  if (winner === 'BMNR') {
    conclusion = `BitMine (BMNR) shows a better risk/reward ratio (${bmnr.riskReward.toFixed(2)} vs ${eth.riskReward.toFixed(2)}) over the last 90 days, suggesting stronger risk-adjusted returns compared to Ethereum.`;
  } else if (winner === 'ETH') {
    conclusion = `Ethereum shows a better risk/reward ratio (${eth.riskReward.toFixed(2)} vs ${bmnr.riskReward.toFixed(2)}) over the last 90 days, suggesting stronger risk-adjusted returns compared to BitMine.`;
  } else {
    conclusion = `BitMine and Ethereum show similar risk/reward profiles over the last 90 days. Both assets present comparable risk-adjusted performance.`;
  }

  return { bmnr, eth, winner, conclusion };
}

export const BmnrVsEthPanel = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['bmnr-vs-eth'],
    queryFn: calculateBmnrVsEth,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const renderSide = (
    label: string,
    metrics: AssetMetrics | undefined,
    isWinner: boolean
  ) => (
    <div className={`p-4 rounded-lg border ${isWinner ? 'border-bullish/50 bg-bullish/5' : 'border-border/50 bg-muted/30'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold">{label}</h3>
        {isWinner && (
          <Badge variant="default" className="bg-bullish text-bullish-foreground">
            Better R/R
          </Badge>
        )}
      </div>
      {metrics && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">90d Return:</span>
            <span className={`font-semibold ${metrics.returns >= 0 ? 'text-bullish' : 'text-bearish'}`}>
              {metrics.returns >= 0 ? '+' : ''}{metrics.returns.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Volatility:</span>
            <span className="font-semibold">{metrics.volatility.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Max Drawdown:</span>
            <span className="font-semibold text-bearish">{metrics.maxDrawdown.toFixed(2)}%</span>
          </div>
          <div className="pt-2 border-t border-border/50">
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">Risk/Reward:</span>
              <span className="font-bold text-primary">{metrics.riskReward.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent shadow-glow">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <CardTitle>BMNR vs ETH</CardTitle>
            <CardDescription>BitMine vs Ethereum — Risk/Reward over 90 days</CardDescription>
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
            <BloombergInsight insight={bmnrVsEthInsight(data)} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderSide('BMNR', data.bmnr, data.winner === 'BMNR')}
              {renderSide('ETH', data.eth, data.winner === 'ETH')}
            </div>
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
