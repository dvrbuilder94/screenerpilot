import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getEthUpsideScore, getAltseasonIndex, getDominanceData, getFearGreedIndex } from '@/lib/cryptoMetrics';
import { supabase } from '@/integrations/supabase/client';

async function generateInsight() {
  const [ethUpside, altseason, dominance, fearGreed] = await Promise.all([
    getEthUpsideScore(),
    getAltseasonIndex(),
    getDominanceData(),
    getFearGreedIndex()
  ]);

  const response = await supabase.functions.invoke('crypto-insight', {
    body: {
      ethUpsideScore: ethUpside.score,
      altseasonIndex: altseason.index,
      dominanceRegime: dominance.regime,
      fearGreedValue: fearGreed.value
    }
  });

  if (response.error) throw response.error;
  return response.data.insight;
}

export const CryptoMacroInsight = () => {
  const { data: insight, isLoading } = useQuery({
    queryKey: ['crypto-insight'],
    queryFn: generateInsight,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1
  });

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Generating insight...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium leading-relaxed">
              {insight || 'Markets showing mixed signals across metrics. Monitor key levels closely?'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
