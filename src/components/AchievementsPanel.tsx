import { Award, Lock, Trophy, Flame, Star, Zap, Crown, LogIn } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGamification } from "@/hooks/useGamification";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const iconMap: Record<string, any> = {
  LogIn,
  Flame,
  Trophy,
  Star,
  Award,
  Zap,
  Crown,
};

export default function AchievementsPanel() {
  const { gamificationData, userAchievements, allAchievements, isLoading } = useGamification();

  if (isLoading || !gamificationData || !allAchievements) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Achievements
          </CardTitle>
          <CardDescription>Loading your achievements...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
  const loginCount = Math.floor(gamificationData.total_points / 10);

  const getProgress = (achievement: any) => {
    let current = 0;
    switch (achievement.requirement_type) {
      case 'login_count':
        current = loginCount;
        break;
      case 'streak':
        current = gamificationData.current_streak;
        break;
      case 'total_points':
        current = gamificationData.total_points;
        break;
      case 'level':
        current = gamificationData.current_level;
        break;
    }
    return Math.min((current / achievement.requirement_value) * 100, 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Achievements
        </CardTitle>
        <CardDescription>
          {unlockedIds.size} of {allAchievements.length} unlocked
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allAchievements.map((achievement) => {
            const isUnlocked = unlockedIds.has(achievement.id);
            const progress = getProgress(achievement);
            const Icon = iconMap[achievement.icon] || Award;

            return (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border transition-all ${
                  isUnlocked
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-muted/30 border-border opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isUnlocked ? 'bg-primary/10' : 'bg-muted'
                    }`}
                  >
                    {isUnlocked ? (
                      <Icon className="w-5 h-5 text-primary" />
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{achievement.name}</h4>
                      {achievement.points_reward > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          +{achievement.points_reward}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {achievement.description}
                    </p>
                    {!isUnlocked && (
                      <>
                        <Progress value={progress} className="h-1.5 mb-1" />
                        <p className="text-xs text-muted-foreground">
                          {progress.toFixed(0)}% complete
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
