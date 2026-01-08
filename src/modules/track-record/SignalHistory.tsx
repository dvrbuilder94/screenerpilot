import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSignalSnapshots } from '@/hooks/useTrackRecord';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';

export function SignalHistory() {
  const { data: snapshots, isLoading } = useSignalSnapshots(undefined, undefined, 20);
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasData = snapshots && snapshots.length > 0;

  // Desktop: Table view
  if (!isMobile) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-foreground">
            Recent Signals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No signals recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Date</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Symbol</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Signal</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Timeframe</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map((row) => (
                    <tr key={row.id} className="border-b border-border/50 last:border-0">
                      <td className="py-2 px-3 text-foreground">
                        {format(new Date(row.created_at), 'MMM dd, HH:mm')}
                      </td>
                      <td className="py-2 px-3 text-foreground font-medium">{row.symbol}</td>
                      <td className="py-2 px-3 text-foreground">{row.signal}</td>
                      <td className="py-2 px-3 text-foreground">{row.timeframe}</td>
                      <td className="py-2 px-3 text-right text-foreground">
                        ${Number(row.price_at_signal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
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
      <h3 className="text-base font-medium text-foreground">Recent Signals</h3>
      {!hasData ? (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center">
              No signals recorded yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        snapshots.map((row) => (
          <Card key={row.id} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-foreground">{row.symbol}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(row.created_at), 'MMM dd, HH:mm')}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <div className="space-x-2">
                  <span className="text-foreground">{row.signal}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{row.timeframe}</span>
                </div>
                <span className="text-foreground">
                  ${Number(row.price_at_signal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
