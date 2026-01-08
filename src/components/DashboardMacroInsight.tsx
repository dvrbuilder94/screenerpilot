import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

async function fetchDashboardInsight(): Promise<string> {
  const { data, error } = await supabase.functions.invoke('dashboard-insight');
  
  if (error) {
    console.error('Dashboard insight error:', error);
    return 'Market analysis loading...';
  }
  
  return data?.insight || 'Market analysis in progress.';
}

export const DashboardMacroInsight = () => {
  const { data: insight, isLoading } = useQuery({
    queryKey: ['dashboard-insight'],
    queryFn: fetchDashboardInsight,
    staleTime: 15 * 60 * 1000, // 15 min cache
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/20">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-emerald-400 flex-shrink-0 animate-pulse" />
            <Skeleton className="h-5 w-full max-w-[400px]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/20">
      <CardContent className="py-4">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          <p className="text-sm font-medium text-foreground">{insight}</p>
        </div>
      </CardContent>
    </Card>
  );
};
