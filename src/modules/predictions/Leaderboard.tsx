import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Medal, Award, Star, Target } from 'lucide-react';
import type { LeaderboardEntry } from './types';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  isLoading?: boolean;
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Trophy className="h-4 w-4 text-yellow-500" />;
    case 2:
      return <Medal className="h-4 w-4 text-gray-400" />;
    case 3:
      return <Award className="h-4 w-4 text-amber-600" />;
    default:
      return <span className="text-sm text-muted-foreground w-4 text-center">{rank}</span>;
  }
}

export function Leaderboard({ entries, currentUserId, isLoading }: LeaderboardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Season Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Season Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No forecasters yet. Be the first!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Season Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="divide-y">
            {entries.map((entry) => {
              const isCurrentUser = entry.user_id === currentUserId;
              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    isCurrentUser ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-center justify-center w-6">
                    {getRankIcon(entry.rank)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {entry.display_name}
                      {isCurrentUser && (
                        <span className="text-xs text-primary ml-2">(You)</span>
                      )}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {entry.correct}/{entry.total}
                      </span>
                      <span>{entry.accuracy}% accuracy</span>
                    </div>
                  </div>

                  <Badge variant="secondary" className="gap-1 shrink-0">
                    <Star className="h-3 w-3" />
                    {entry.xp}
                  </Badge>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
