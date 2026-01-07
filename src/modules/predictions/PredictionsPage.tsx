import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Trophy, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SeasonBanner } from './SeasonBanner';
import { PredictionCard } from './PredictionCard';
import { Leaderboard } from './Leaderboard';
import { CreatePredictionModal } from './CreatePredictionModal';
import {
  useActiveSeason,
  usePredictions,
  useUserSeasonStats,
  useLeaderboard,
  useVoteMutation,
  useIsAdmin,
} from './hooks/usePredictions';

export function PredictionsPage() {
  const { user } = useAuth();
  const { data: season, isLoading: seasonLoading } = useActiveSeason();
  const { data: predictions, isLoading: predictionsLoading } = usePredictions(season?.id);
  const { data: userStats } = useUserSeasonStats(season?.id);
  const { data: leaderboard, isLoading: leaderboardLoading } = useLeaderboard(season?.id);
  const { data: isAdmin } = useIsAdmin();
  const voteMutation = useVoteMutation();

  const userRank = leaderboard?.find(e => e.user_id === user?.id)?.rank;

  const openPredictions = predictions?.filter(p => p.status === 'open') || [];
  const resolvedPredictions = predictions?.filter(p => p.status === 'resolved') || [];

  if (seasonLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (!season) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No active season at the moment. Check back soon for new forecasting opportunities!
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Season Banner */}
      <SeasonBanner season={season} userStats={userStats ?? null} userRank={userRank} />

      {/* Admin Controls */}
      {isAdmin && (
        <div className="flex justify-end">
          <CreatePredictionModal seasonId={season.id} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="active" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Active ({openPredictions.length})
              </TabsTrigger>
              <TabsTrigger value="resolved" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Resolved ({resolvedPredictions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-4">
              {predictionsLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-64" />
                  ))}
                </div>
              ) : openPredictions.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No active predictions right now. New forecasting opportunities coming soon!
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {openPredictions.map((prediction) => (
                    <PredictionCard
                      key={prediction.id}
                      prediction={prediction}
                      onVote={(choice) => voteMutation.mutate({ predictionId: prediction.id, choice })}
                      isVoting={voteMutation.isPending}
                      isAuthenticated={!!user}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="resolved" className="mt-4">
              {resolvedPredictions.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No resolved predictions yet in this season.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {resolvedPredictions.map((prediction) => (
                    <PredictionCard
                      key={prediction.id}
                      prediction={prediction}
                      onVote={() => {}}
                      isVoting={false}
                      isAuthenticated={!!user}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - Leaderboard */}
        <div>
          <Leaderboard
            entries={leaderboard || []}
            currentUserId={user?.id}
            isLoading={leaderboardLoading}
          />

          {/* Info Card */}
          <div className="mt-4 p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">How it works</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Submit your forecast on each prediction</li>
              <li>Earn +5 XP for each forecast</li>
              <li>Earn +20 XP for correct predictions</li>
              <li>Climb the leaderboard and build your reputation</li>
            </ul>
            <p className="text-xs italic mt-3">
              Future participation may be considered for rewards and access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
