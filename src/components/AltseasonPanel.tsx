import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { calculateAltseasonIndex, AltseasonData } from '@/lib/cryptoMacro';

export const AltseasonPanel = () => {
  const [lookbackDays, setLookbackDays] = useState(90);

  const { data, isLoading, error } = useQuery({
    queryKey: ['altseason-index', lookbackDays],
    queryFn: () => calculateAltseasonIndex(lookbackDays),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const getGradientColor = (value: number) => {
    if (value < 30) return 'from-bearish to-bearish-light';
    if (value < 60) return 'from-neutral to-neutral-light';
    return 'from-bullish to-bullish-light';
  };

  const getTextColor = (value: number) => {
    if (value < 30) return 'text-bearish';
    if (value < 60) return 'text-neutral';
    return 'text-bullish';
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent shadow-glow">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <CardTitle>Altseason Index</CardTitle>
            <CardDescription>
              % of altcoins outperforming BTC
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
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
            <div className="text-center">
              <div className={`text-6xl font-bold ${getTextColor(data.value)}`}>
                {data.value}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {data.altsOutperforming} of {data.totalAlts} alts outperform BTC
              </div>
            </div>

            <div className="space-y-2">
              <div className="w-full bg-secondary rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${getGradientColor(data.value)} transition-all duration-500 shadow-glow`}
                  style={{ width: `${data.value}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Bitcoin Season</span>
                <span>Neutral</span>
                <span>Altseason</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-sm leading-relaxed">
                {data.value < 25 && (
                  <span>
                    <strong className="text-bearish">Bitcoin Season:</strong> BTC is dominating the market. 
                    Most altcoins are underperforming. Better wait for clearer signals before entering alts.
                  </span>
                )}
                {data.value >= 25 && data.value < 75 && (
                  <span>
                    <strong className="text-neutral">Neutral Phase:</strong> Mixed market. Some altcoins are 
                    performing well, but no clear altseason yet. Careful selection is key.
                  </span>
                )}
                {data.value >= 75 && (
                  <span>
                    <strong className="text-bullish">Altseason:</strong> Strong altcoin performance! Majority are 
                    outperforming BTC. Optimal time for selected alt positions.
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
