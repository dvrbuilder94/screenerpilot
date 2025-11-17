import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { toast } from 'sonner';

const DAILY_LOGIN_POINTS = 10;
const STREAK_BONUS_MULTIPLIER = 5;

export interface GamificationData {
  id: string;
  user_id: string;
  total_points: number;
  current_level: number;
  current_streak: number;
  longest_streak: number;
  last_login_date: string | null;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points_reward: number;
  requirement_type: string;
  requirement_value: number;
}

export interface UserAchievement {
  id: string;
  achievement_id: string;
  unlocked_at: string;
  achievements: Achievement;
}

export function useGamification() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: gamificationData, isLoading } = useQuery({
    queryKey: ['gamification', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // No record exists, create one
        const { data: newData, error: insertError } = await supabase
          .from('user_gamification')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError) throw insertError;
        return newData as GamificationData;
      }

      if (error) throw error;
      return data as GamificationData;
    },
    enabled: !!user,
  });

  const { data: userAchievements } = useQuery({
    queryKey: ['user-achievements', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*, achievements(*)')
        .eq('user_id', user.id);

      if (error) throw error;
      return data as UserAchievement[];
    },
    enabled: !!user,
  });

  const { data: allAchievements } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('requirement_value', { ascending: true });

      if (error) throw error;
      return data as Achievement[];
    },
  });

  const trackLoginMutation = useMutation({
    mutationFn: async () => {
      if (!user || !gamificationData) return null;

      const today = new Date().toISOString().split('T')[0];
      const lastLogin = gamificationData.last_login_date;

      // Check if already logged in today
      if (lastLogin === today) {
        return gamificationData;
      }

      // Calculate streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const isConsecutive = lastLogin === yesterdayStr;
      const newStreak = isConsecutive ? gamificationData.current_streak + 1 : 1;
      const streakBonus = newStreak * STREAK_BONUS_MULTIPLIER;
      const totalNewPoints = DAILY_LOGIN_POINTS + streakBonus;

      const newTotalPoints = gamificationData.total_points + totalNewPoints;
      const newLevel = Math.floor(Math.sqrt(newTotalPoints / 100.0)) + 1;

      const { data, error } = await supabase
        .from('user_gamification')
        .update({
          total_points: newTotalPoints,
          current_level: newLevel,
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, gamificationData.longest_streak),
          last_login_date: today,
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Check for new achievements
      await checkAchievements(data as GamificationData);

      return data as GamificationData;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['gamification', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['user-achievements', user?.id] });
        
        const streakBonus = data.current_streak * STREAK_BONUS_MULTIPLIER;
        const totalPoints = DAILY_LOGIN_POINTS + streakBonus;
        
        toast.success(`Daily login! +${totalPoints} points (${data.current_streak} day streak)`);
      }
    },
  });

  const checkAchievements = async (gamificationData: GamificationData) => {
    if (!user || !allAchievements) return;

    const unlockedIds = userAchievements?.map(ua => ua.achievement_id) || [];
    const loginCount = Math.floor(gamificationData.total_points / DAILY_LOGIN_POINTS);

    for (const achievement of allAchievements) {
      if (unlockedIds.includes(achievement.id)) continue;

      let unlocked = false;
      switch (achievement.requirement_type) {
        case 'login_count':
          unlocked = loginCount >= achievement.requirement_value;
          break;
        case 'streak':
          unlocked = gamificationData.current_streak >= achievement.requirement_value;
          break;
        case 'total_points':
          unlocked = gamificationData.total_points >= achievement.requirement_value;
          break;
        case 'level':
          unlocked = gamificationData.current_level >= achievement.requirement_value;
          break;
      }

      if (unlocked) {
        const { error } = await supabase
          .from('user_achievements')
          .insert({ user_id: user.id, achievement_id: achievement.id });

        if (!error) {
          toast.success(`🏆 Achievement Unlocked: ${achievement.name}!`, {
            description: achievement.description,
          });

          if (achievement.points_reward > 0) {
            await supabase
              .from('user_gamification')
              .update({
                total_points: gamificationData.total_points + achievement.points_reward,
              })
              .eq('user_id', user.id);
          }
        }
      }
    }
  };

  // Track login on mount
  useEffect(() => {
    if (user && gamificationData) {
      trackLoginMutation.mutate();
    }
  }, [user?.id, gamificationData?.id]);

  return {
    gamificationData,
    userAchievements,
    allAchievements,
    isLoading,
    trackLogin: () => trackLoginMutation.mutate(),
  };
}
