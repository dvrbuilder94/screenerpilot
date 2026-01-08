import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

// ============ SENTIMENT VOTES ============

interface SentimentAggregates {
  bullish: number;
  bearish: number;
}

export function useSentimentVotes(symbol: string) {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['sentiment-votes', symbol, today],
    queryFn: async (): Promise<SentimentAggregates> => {
      const { data, error } = await supabase
        .from('sentiment_votes')
        .select('direction')
        .eq('symbol', symbol)
        .eq('vote_date', today);

      if (error) throw error;

      const bullish = data?.filter(v => v.direction === 'bullish').length ?? 0;
      const bearish = data?.filter(v => v.direction === 'bearish').length ?? 0;
      
      return { bullish, bearish };
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useUserVotedToday(symbol: string) {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['user-vote-today', symbol, user?.id, today],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('sentiment_votes')
        .select('id, direction')
        .eq('symbol', symbol)
        .eq('user_id', user.id)
        .eq('vote_date', today)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useSubmitVote() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  return useMutation({
    mutationFn: async ({ symbol, direction }: { symbol: string; direction: 'bullish' | 'bearish' }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('sentiment_votes')
        .insert({
          symbol,
          user_id: user.id,
          direction,
          vote_date: today,
        });

      if (error) throw error;
    },
    onSuccess: (_, { symbol }) => {
      queryClient.invalidateQueries({ queryKey: ['sentiment-votes', symbol] });
      queryClient.invalidateQueries({ queryKey: ['user-vote-today', symbol] });
    },
  });
}

// ============ PRICE EXPECTATIONS ============

interface ExpectationAggregates {
  avg: number;
  min: number;
  max: number;
  count: number;
}

export function usePriceExpectations(symbol: string, month: string) {
  return useQuery({
    queryKey: ['price-expectations', symbol, month],
    queryFn: async (): Promise<ExpectationAggregates | null> => {
      const { data, error } = await supabase
        .from('price_expectations')
        .select('target_price')
        .eq('symbol', symbol)
        .eq('target_month', month);

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const prices = data.map(d => Number(d.target_price));
      return {
        avg: prices.reduce((a, b) => a + b, 0) / prices.length,
        min: Math.min(...prices),
        max: Math.max(...prices),
        count: prices.length,
      };
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useUserExpectation(symbol: string, month: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-expectation', symbol, month, user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('price_expectations')
        .select('id, target_price')
        .eq('symbol', symbol)
        .eq('user_id', user.id)
        .eq('target_month', month)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useSubmitExpectation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ symbol, targetPrice, targetMonth }: { symbol: string; targetPrice: number; targetMonth: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('price_expectations')
        .insert({
          symbol,
          user_id: user.id,
          target_price: targetPrice,
          target_month: targetMonth,
        });

      if (error) throw error;
    },
    onSuccess: (_, { symbol, targetMonth }) => {
      queryClient.invalidateQueries({ queryKey: ['price-expectations', symbol, targetMonth] });
      queryClient.invalidateQueries({ queryKey: ['user-expectation', symbol, targetMonth] });
    },
  });
}
