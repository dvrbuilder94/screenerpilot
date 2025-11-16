import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getFearGreedIndex } from '@/lib/cryptoMetrics';

export const FearGreedPanel = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['fear-greed'],
    queryFn: getFearGreedIndex,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const getValueColor = (value: number) => {
    if (value <= 25) return 'text-red-500';
    if (value <= 44) return 'text-orange-500';
    if (value <= 54) return 'text-yellow-500';
    if (value <= 74) return 'text-green-500';
    return 'text-emerald-500';
  };

  const getGradientColor = (value: number) => {
    if (value <= 25) return 'from-red-500 to-red-600';
    if (value <= 44) return 'from-orange-500 to-orange-600';
    if (value <= 54) return 'from-yellow-500 to-yellow-600';
    if (value <= 74) return 'from-green-500 to-green-600';
    return 'from-emerald-500 to-emerald-600';
  };

  const getCategoryVariant = (category: string) => {
    if (category.includes('Fear')) return 'destructive' as const;
    if (category.includes('Greed')) return 'default' as const;
    return 'secondary' as const;
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent shadow-glow">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <CardTitle>Fear & Greed Index</CardTitle>
            <CardDescription>
              Market sentiment indicator
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
            {/* Main Value */}
            <div className="text-center">
              <div className={`text-6xl font-bold ${getValueColor(data.value)}`}>
                {data.value}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Sentiment Score
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-secondary rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${getGradientColor(data.value)} transition-all duration-500 shadow-glow`}
                  style={{ width: `${data.value}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Extreme Fear</span>
                <span>Neutral</span>
                <span>Extreme Greed</span>
              </div>
            </div>

            {/* Category Badge */}
            <div className="text-center">
              <Badge variant={getCategoryVariant(data.category)} className="text-base px-4 py-1">
                {data.category}
              </Badge>
            </div>

            {/* Updated Time */}
            <div className="text-center text-xs text-muted-foreground">
              Updated today
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
