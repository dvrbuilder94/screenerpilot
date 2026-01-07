import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle, XCircle, Star, Users } from 'lucide-react';
import type { PredictionWithVotes } from './types';

interface PredictionCardProps {
  prediction: PredictionWithVotes;
  onVote: (choice: boolean) => void;
  isVoting: boolean;
  isAuthenticated: boolean;
}

function formatTimeUntil(date: string): string {
  const now = new Date();
  const target = new Date(date);
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) return 'Resolving...';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function getConditionLabel(condition: PredictionWithVotes['condition']): string {
  switch (condition.type) {
    case 'price_above':
      return `Price above $${condition.target.toLocaleString()}`;
    case 'price_below':
      return `Price below $${condition.target.toLocaleString()}`;
    case 'price_change_percent':
      return `${condition.target > 0 ? '+' : ''}${condition.target}% change`;
    default:
      return 'Custom condition';
  }
}

export function PredictionCard({ prediction, onVote, isVoting, isAuthenticated }: PredictionCardProps) {
  const isOpen = prediction.status === 'open';
  const hasVoted = prediction.userVote !== null && prediction.userVote !== undefined;

  return (
    <Card className={`transition-all ${!isOpen ? 'opacity-80' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-base leading-tight">{prediction.title}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {prediction.symbol}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {getConditionLabel(prediction.condition)}
              </span>
            </div>
          </div>
          <Badge variant={isOpen ? 'default' : prediction.result ? 'secondary' : 'destructive'}>
            {isOpen ? 'Open' : prediction.result ? 'Yes ✓' : 'No ✗'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Consensus bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-green-500 font-medium">Yes {prediction.consensusPercent}%</span>
            <span className="text-red-500 font-medium">No {100 - prediction.consensusPercent}%</span>
          </div>
          <Progress value={prediction.consensusPercent} className="h-2" />
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            {prediction.totalVotes} forecast{prediction.totalVotes !== 1 ? 's' : ''}
          </div>
        </div>

        {/* XP indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Star className="h-3 w-3 text-yellow-500" />
          <span>+5 XP for forecasting • +20 XP if correct</span>
        </div>

        {/* Action buttons or status */}
        {isOpen ? (
          <>
            {!isAuthenticated ? (
              <p className="text-center text-sm text-muted-foreground">
                Sign in to submit your forecast
              </p>
            ) : hasVoted ? (
              <div className="flex items-center justify-center gap-2 py-2">
                {prediction.userVote ? (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    You forecasted Yes
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    You forecasted No
                  </Badge>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-green-500/50 hover:bg-green-500/10 hover:text-green-500"
                  onClick={() => onVote(true)}
                  disabled={isVoting}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Yes
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-red-500/50 hover:bg-red-500/10 hover:text-red-500"
                  onClick={() => onVote(false)}
                  disabled={isVoting}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  No
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-sm text-muted-foreground">
            This prediction has been resolved
          </div>
        )}

        {/* Timer */}
        {isOpen && (
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Resolves in {formatTimeUntil(prediction.resolve_at)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
