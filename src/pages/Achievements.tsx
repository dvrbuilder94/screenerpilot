import AchievementsPanel from "@/components/AchievementsPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGamification } from "@/hooks/useGamification";
import { Trophy, TrendingUp, Flame, Award } from "lucide-react";

export default function Achievements() {
  const { gamificationData } = useGamification();

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-primary" />
          Your Progress
        </h1>
        <p className="text-muted-foreground">
          Track your achievements and level up by using ScreenerPilot daily
        </p>
      </div>

      {gamificationData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Points</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Award className="w-6 h-6 text-primary" />
                {gamificationData.total_points}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Current Level</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-accent" />
                {gamificationData.current_level}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Current Streak</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Flame className="w-6 h-6 text-bullish" />
                {gamificationData.current_streak} days
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Longest Streak</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Trophy className="w-6 h-6 text-primary" />
                {gamificationData.longest_streak} days
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <AchievementsPanel />
    </div>
  );
}
