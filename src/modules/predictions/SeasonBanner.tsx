import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, Star } from 'lucide-react';
import type { Season, UserSeasonStats } from './types';

interface SeasonBannerProps {
  season: Season;
  userStats: UserSeasonStats | null;
  userRank?: number;
}

function formatTimeRemaining(endsAt: string): string {
  const now = new Date();
  const end = new Date(endsAt);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h remaining`;
  return `${hours}h remaining`;
}

export function SeasonBanner({ season, userStats, userRank }: SeasonBannerProps) {
  return (
    <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{season.name}</h2>
              {season.description && (
                <p className="text-sm text-muted-foreground">{season.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{formatTimeRemaining(season.ends_at)}</span>
            </div>

            {userStats && (
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="gap-1">
                  <Star className="h-3 w-3" />
                  {userStats.xp} XP
                </Badge>
                {userRank && (
                  <Badge variant="outline">
                    Rank #{userRank}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
