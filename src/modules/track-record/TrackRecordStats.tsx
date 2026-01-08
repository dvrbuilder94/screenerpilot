import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTrackRecordStats } from '@/hooks/useTrackRecord';

export function TrackRecordStats() {
  const { data, isLoading } = useTrackRecordStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Total Signals Recorded</p>
          <p className="text-2xl font-semibold text-foreground mt-1">
            {data?.totalSnapshots ?? 0}
          </p>
        </CardContent>
      </Card>
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Resolved Outcomes</p>
          <p className="text-2xl font-semibold text-foreground mt-1">
            {data?.totalOutcomes ?? 0}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
