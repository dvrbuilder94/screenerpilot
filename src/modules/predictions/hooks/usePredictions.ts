import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Season, Prediction, PredictionWithVotes, UserSeasonStats, LeaderboardEntry, PredictionCondition } from '../types';

export function useActiveSeason() {
  return useQuery({
    queryKey: ['active-season'],
    queryFn: async (): Promise<Season | null> => {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .eq('status', 'active')
        .order('starts_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as Season | null;
    },
  });
}

export function usePredictions(seasonId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['predictions', seasonId, user?.id],
    queryFn: async (): Promise<PredictionWithVotes[]> => {
      if (!seasonId) return [];

      // Get predictions
      const { data: predictions, error: predError } = await supabase
        .from('predictions')
        .select('*')
        .eq('season_id', seasonId)
        .order('resolve_at', { ascending: true });

      if (predError) throw predError;

      // Get all votes for these predictions
      const predictionIds = predictions?.map(p => p.id) || [];
      const { data: votes, error: votesError } = await supabase
        .from('prediction_votes')
        .select('*')
        .in('prediction_id', predictionIds);

      if (votesError) throw votesError;

      // Calculate vote counts and user's vote
      return (predictions || []).map(pred => {
        const predVotes = votes?.filter(v => v.prediction_id === pred.id) || [];
        const yesCount = predVotes.filter(v => v.choice === true).length;
        const noCount = predVotes.filter(v => v.choice === false).length;
        const totalVotes = yesCount + noCount;
        const userVote = user ? predVotes.find(v => v.user_id === user.id)?.choice : null;
        const condition = pred.condition as unknown as PredictionCondition;

        return {
          ...pred,
          condition,
          status: pred.status as 'open' | 'resolved',
          yesCount,
          noCount,
          totalVotes,
          consensusPercent: totalVotes > 0 ? Math.round((yesCount / totalVotes) * 100) : 50,
          userVote: userVote ?? null,
        } as PredictionWithVotes;
      });
    },
    enabled: !!seasonId,
  });
}

export function useUserSeasonStats(seasonId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-season-stats', seasonId, user?.id],
    queryFn: async (): Promise<UserSeasonStats | null> => {
      if (!seasonId || !user) return null;

      const { data, error } = await supabase
        .from('user_season_stats')
        .select('*')
        .eq('season_id', seasonId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as UserSeasonStats | null;
    },
    enabled: !!seasonId && !!user,
  });
}

export function useLeaderboard(seasonId: string | undefined) {
  return useQuery({
    queryKey: ['leaderboard', seasonId],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      if (!seasonId) return [];

      // Get all stats for this season
      const { data: stats, error: statsError } = await supabase
        .from('user_season_stats')
        .select('*')
        .eq('season_id', seasonId)
        .order('xp', { ascending: false })
        .limit(50);

      if (statsError) throw statsError;

      // Get profiles for display names
      const userIds = stats?.map(s => s.user_id) || [];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);

      return (stats || []).map((stat, index) => ({
        user_id: stat.user_id,
        display_name: profileMap.get(stat.user_id) || 'Anonymous',
        xp: stat.xp,
        correct: stat.correct,
        total: stat.total,
        accuracy: stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0,
        rank: index + 1,
      }));
    },
    enabled: !!seasonId,
  });
}

export function useVoteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ predictionId, choice }: { predictionId: string; choice: boolean }) => {
      const { error } = await supabase.rpc('record_prediction_vote', {
        p_prediction_id: predictionId,
        p_choice: choice,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
      queryClient.invalidateQueries({ queryKey: ['user-season-stats'] });
      toast.success('Forecast submitted! +5 XP');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error('You have already submitted a forecast for this prediction');
      } else {
        toast.error('Failed to submit forecast');
      }
    },
  });
}

export function useIsAdmin() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async (): Promise<boolean> => {
      if (!user) return false;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (error && error.code !== 'PGRST116') return false;
      return !!data;
    },
    enabled: !!user,
  });
}

export function useCreatePrediction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prediction: {
      season_id: string;
      title: string;
      symbol: string;
      condition: PredictionCondition;
      resolve_at: string;
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const insertData: any = {
        season_id: prediction.season_id,
        title: prediction.title,
        symbol: prediction.symbol,
        condition: prediction.condition,
        resolve_at: prediction.resolve_at,
      };
      const { error } = await supabase
        .from('predictions')
        .insert([insertData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
      toast.success('Prediction created successfully');
    },
    onError: () => {
      toast.error('Failed to create prediction');
    },
  });
}

export function useResolvePrediction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ predictionId, result }: { predictionId: string; result: boolean }) => {
      const { error } = await supabase.rpc('resolve_prediction', {
        p_prediction_id: predictionId,
        p_result: result,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
      queryClient.invalidateQueries({ queryKey: ['user-season-stats'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      toast.success('Prediction resolved');
    },
    onError: () => {
      toast.error('Failed to resolve prediction');
    },
  });
}
