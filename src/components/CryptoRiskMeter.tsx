import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Activity, TrendingUp, Minus, TrendingDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { calculateCryptoRisk, RiskState } from '@/lib/cryptoMacro';

export const CryptoRiskMeter = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['crypto-risk'],
    queryFn: calculateCryptoRisk,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const getRiskConfig = (state: RiskState) => {
    switch (state) {
      case 'risk_on':
        return {
          label: 'RISK-ON',
          description: 'Aggressive market mode',
          color: 'text-bullish',
          bgColor: 'bg-bullish/10',
          borderColor: 'border-bullish/30',
          icon: TrendingUp
        };
      case 'risk_off':
        return {
          label: 'RISK-OFF',
          description: 'Defensive market mode',
          color: 'text-bearish',
          bgColor: 'bg-bearish/10',
          borderColor: 'border-bearish/30',
          icon: TrendingDown
        };
      default:
        return {
          label: 'NEUTRAL',
          description: 'No clear trend',
          color: 'text-neutral',
          bgColor: 'bg-neutral/10',
          borderColor: 'border-neutral/30',
          icon: Minus
        };
    }
  };

  const config = data ? getRiskConfig(data.state) : getRiskConfig('neutral');
  const Icon = config.icon;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent shadow-glow">
            <Activity className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <CardTitle>Crypto Risk Regime</CardTitle>
            <CardDescription>
              Market risk appetite indicator
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
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
            {/* Estado principal */}
            <div className={`p-6 rounded-xl border ${config.borderColor} ${config.bgColor}`}>
              <div className="flex items-center justify-center gap-3 mb-2">
                <Icon className={`w-8 h-8 ${config.color}`} />
                <h2 className={`text-4xl font-bold ${config.color}`}>
                  {config.label}
                </h2>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {config.description}
              </p>
            </div>

            {/* Key Factors */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Key factors:</h4>
              <ul className="space-y-2">
                {data.reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span className="text-sm text-muted-foreground">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Additional Metric */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Alts avg 7d return:</span>
                <Badge 
                  variant="outline" 
                  className={data.altsAvgReturn7d >= 0 ? 'border-bullish text-bullish' : 'border-bearish text-bearish'}
                >
                  {data.altsAvgReturn7d >= 0 ? '+' : ''}{data.altsAvgReturn7d.toFixed(2)}%
                </Badge>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
