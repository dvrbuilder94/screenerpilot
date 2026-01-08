import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SentimentVoteButtons } from './SentimentVoteButtons';
import { PriceExpectationInput } from './PriceExpectationInput';

interface AssetSentimentProps {
  symbol: string;
}

export function AssetSentiment({ symbol }: AssetSentimentProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-foreground">
          Community Sentiment
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Community sentiment reflects aggregated user opinions.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <SentimentVoteButtons symbol={symbol} />
        <div className="border-t border-border pt-4">
          <PriceExpectationInput symbol={symbol} />
        </div>
      </CardContent>
    </Card>
  );
}
