import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSignalSnapshots } from '@/hooks/useTrackRecord';
import { useIsMobile } from '@/hooks/use-mobile';
import { getAssetName } from '@/lib/assetNames';
import { format } from 'date-fns';

interface SignalHistoryProps {
  assetFilter?: string;
}

export function SignalHistory({ assetFilter = 'ALL' }: SignalHistoryProps) {
  const { data: snapshots, isLoading } = useSignalSnapshots(undefined, 50);
  const isMobile = useIsMobile();

  // Filter by asset type
  const filteredSnapshots = snapshots?.filter(s => 
    assetFilter === 'ALL' || s.asset_type === assetFilter
  );

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

  const hasData = filteredSnapshots && filteredSnapshots.length > 0;

  // Desktop: Table view
  if (!isMobile) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-foreground">
            Recent Daily Signals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No daily signals recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Date</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Asset</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Signal</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSnapshots.map((row) => (
                    <tr key={row.id} className="border-b border-border/50 last:border-0">
                      <td className="py-2 px-3 text-foreground">
                        {format(new Date(row.created_at), 'MMM dd, yyyy')}
                      </td>
                      <td className="py-2 px-3 text-foreground">
                        <div className="flex flex-col">
                          <span className="font-medium">{getAssetName(row.symbol)}</span>
                          <span className="text-xs text-muted-foreground">{row.symbol}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-foreground">{row.signal}</td>
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
      <h3 className="text-base font-medium text-foreground">Recent Daily Signals</h3>
      {!hasData ? (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center">
              No daily signals recorded yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        filteredSnapshots.map((row) => (
          <Card key={row.id} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{getAssetName(row.symbol)}</span>
                  <span className="text-xs text-muted-foreground">{row.symbol}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(row.created_at), 'MMM dd, yyyy')}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-foreground">{row.signal}</span>
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
