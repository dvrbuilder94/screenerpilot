import { Trophy, Flame, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useGamification } from "@/hooks/useGamification";
import { Progress } from "@/components/ui/progress";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export default function GamificationBadge() {
  const { gamificationData, isLoading } = useGamification();

  if (isLoading || !gamificationData) return null;

  const currentLevel = gamificationData.current_level;
  const currentPoints = gamificationData.total_points;
  const pointsForCurrentLevel = (currentLevel - 1) ** 2 * 100;
  const pointsForNextLevel = currentLevel ** 2 * 100;
  const progressToNextLevel = ((currentPoints - pointsForCurrentLevel) / (pointsForNextLevel - pointsForCurrentLevel)) * 100;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <Trophy className="w-3.5 h-3.5 text-primary" />
            <span className="font-semibold">Level {currentLevel}</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-bullish/10 to-bullish/5 border-bullish/20">
            <Flame className="w-3.5 h-3.5 text-bullish" />
            <span className="font-semibold">{gamificationData.current_streak} days</span>
          </Badge>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="font-semibold">Level {currentLevel}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {currentPoints} / {pointsForNextLevel} points
              </span>
            </div>
            <Progress value={progressToNextLevel} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {pointsForNextLevel - currentPoints} points to level {currentLevel + 1}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-bullish" />
              <span className="text-sm font-medium">Current Streak</span>
            </div>
            <span className="text-sm font-semibold">{gamificationData.current_streak} days</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">Longest Streak</span>
            </div>
            <span className="text-sm font-semibold">{gamificationData.longest_streak} days</span>
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Login daily to maintain your streak and earn bonus points!
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
