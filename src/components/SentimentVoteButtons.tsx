import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useSentimentVotes, useUserVotedToday, useSubmitVote } from '@/hooks/useSentimentVotes';
import { useAuth } from '@/contexts/AuthContext';

interface SentimentVoteButtonsProps {
  symbol: string;
}

export function SentimentVoteButtons({ symbol }: SentimentVoteButtonsProps) {
  const { user } = useAuth();
  const { data: votes, isLoading: loadingVotes } = useSentimentVotes(symbol);
  const { data: userVote, isLoading: loadingUserVote } = useUserVotedToday(symbol);
  const { mutate: submitVote, isPending } = useSubmitVote();

  const isLoading = loadingVotes || loadingUserVote;
  const hasVoted = !!userVote;
  const totalVotes = (votes?.bullish ?? 0) + (votes?.bearish ?? 0);
  const bullishPct = totalVotes > 0 ? Math.round((votes?.bullish ?? 0) / totalVotes * 100) : 50;
  const bearishPct = 100 - bullishPct;

  const handleVote = (direction: 'bullish' | 'bearish') => {
    if (!user || hasVoted || isPending) return;
    submitVote({ symbol, direction });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-green-600">{bullishPct}% Bullish</span>
          <span className="text-red-600">{bearishPct}% Bearish</span>
        </div>
        <Progress value={bullishPct} className="h-2 bg-red-200 [&>div]:bg-green-500" />
        <p className="text-xs text-muted-foreground text-center">
          {totalVotes} vote{totalVotes !== 1 ? 's' : ''} today
        </p>
      </div>

      {/* Vote buttons */}
      <div className="flex gap-2">
        <Button
          variant={userVote?.direction === 'bullish' ? 'default' : 'outline'}
          size="sm"
          className="flex-1"
          onClick={() => handleVote('bullish')}
          disabled={!user || hasVoted || isPending}
        >
          <ThumbsUp className="h-4 w-4 mr-1" />
          Bullish
        </Button>
        <Button
          variant={userVote?.direction === 'bearish' ? 'default' : 'outline'}
          size="sm"
          className="flex-1"
          onClick={() => handleVote('bearish')}
          disabled={!user || hasVoted || isPending}
        >
          <ThumbsDown className="h-4 w-4 mr-1" />
          Bearish
        </Button>
      </div>

      {!user && (
        <p className="text-xs text-muted-foreground text-center">
          Sign in to vote
        </p>
      )}
      {user && hasVoted && (
        <p className="text-xs text-muted-foreground text-center">
          You voted today
        </p>
      )}
    </div>
  );
}
