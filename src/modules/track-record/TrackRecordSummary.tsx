import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTrackRecordMetrics } from '@/hooks/useTrackRecord';
import { useIsMobile } from '@/hooks/use-mobile';

interface TrackRecordSummaryProps {
  horizon: '1w' | '1m' | '3m';
}

export function TrackRecordSummary({ horizon }: TrackRecordSummaryProps) {
  const { data: metrics, isLoading } = useTrackRecordMetrics(horizon);
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasData = metrics && metrics.length > 0;

  // Desktop: Table view
  if (!isMobile) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-foreground">
            Performance by Signal Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No resolved outcomes yet for this horizon.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Signal</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Timeframe</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Sample</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Avg Return</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Avg Drawdown</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((row, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="py-2 px-3 text-foreground">{row.signal}</td>
                      <td className="py-2 px-3 text-foreground">{row.timeframe}</td>
                      <td className="py-2 px-3 text-right text-foreground">{row.sample_size}</td>
                      {row.sample_size < 10 ? (
                        <td colSpan={3} className="py-2 px-3 text-center">
                          <Badge variant="secondary" className="text-xs">Insufficient data</Badge>
                        </td>
                      ) : (
                        <>
                          <td className="py-2 px-3 text-right text-foreground">
                            {row.avg_return.toFixed(2)}%
                          </td>
                          <td className="py-2 px-3 text-right text-foreground">
                            {row.avg_drawdown.toFixed(2)}%
                          </td>
                          <td className="py-2 px-3 text-right text-foreground">
                            {row.win_rate.toFixed(1)}%
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Mobile: Stacked cards
  return (
    <div className="space-y-3">
      <h3 className="text-base font-medium text-foreground">Performance by Signal Type</h3>
      {!hasData ? (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center">
              No resolved outcomes yet for this horizon.
            </p>
          </CardContent>
        </Card>
      ) : (
        metrics.map((row, i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">{row.signal}</span>
                <span className="text-xs text-muted-foreground">{row.timeframe}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Sample: {row.sample_size}
              </div>
              {row.sample_size < 10 ? (
                <Badge variant="secondary" className="text-xs">Insufficient data</Badge>
              ) : (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Avg Return</p>
                    <p className="text-foreground">{row.avg_return.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Drawdown</p>
                    <p className="text-foreground">{row.avg_drawdown.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Win Rate</p>
                    <p className="text-foreground">{row.win_rate.toFixed(1)}%</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
