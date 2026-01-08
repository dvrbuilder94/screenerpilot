import { useState } from 'react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePriceExpectations, useUserExpectation, useSubmitExpectation } from '@/hooks/useSentimentVotes';
import { useAuth } from '@/contexts/AuthContext';

interface PriceExpectationInputProps {
  symbol: string;
}

export function PriceExpectationInput({ symbol }: PriceExpectationInputProps) {
  const { user } = useAuth();
  const currentMonth = format(new Date(), 'yyyy-MM');
  const [targetPrice, setTargetPrice] = useState('');
  
  const { data: expectations, isLoading: loadingExpectations } = usePriceExpectations(symbol, currentMonth);
  const { data: userExpectation, isLoading: loadingUser } = useUserExpectation(symbol, currentMonth);
  const { mutate: submitExpectation, isPending } = useSubmitExpectation();

  const isLoading = loadingExpectations || loadingUser;
  const hasSubmitted = !!userExpectation;

  const handleSubmit = () => {
    const price = parseFloat(targetPrice);
    if (!user || hasSubmitted || isPending || isNaN(price) || price <= 0) return;
    submitExpectation({ symbol, targetPrice: price, targetMonth: currentMonth });
    setTargetPrice('');
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-foreground">
        Price Expectation (End of {format(new Date(), 'MMMM')})
      </p>

      {/* Community stats */}
      {expectations && expectations.count > 0 && (
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Community average: ${expectations.avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          <p>Range: ${expectations.min.toLocaleString()} - ${expectations.max.toLocaleString()}</p>
          <p>{expectations.count} prediction{expectations.count !== 1 ? 's' : ''}</p>
        </div>
      )}

      {/* User submission */}
      {hasSubmitted ? (
        <div className="text-xs text-muted-foreground">
          Your expectation: ${Number(userExpectation.target_price).toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>
      ) : user ? (
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Target price"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            className="flex-1 h-9"
            min="0"
            step="0.01"
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isPending || !targetPrice || parseFloat(targetPrice) <= 0}
          >
            Submit
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Sign in to submit your price expectation
        </p>
      )}
    </div>
  );
}
