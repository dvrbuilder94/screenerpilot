import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { TrackRecordStats } from './TrackRecordStats';
import { TrackRecordSummary } from './TrackRecordSummary';
import { SignalHistory } from './SignalHistory';

export function TrackRecordPage() {
  const [horizon, setHorizon] = useState<'1w' | '1m' | '3m'>('1w');

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">System Track Record</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Observed signal outcomes over time
          </p>
        </div>

        {/* Fixed Disclaimer */}
        <Alert className="border-muted bg-muted/30">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm text-muted-foreground">
            Historical system performance reflects observed outcomes only. Past performance does not guarantee future results.
          </AlertDescription>
        </Alert>

        {/* Scope Clarification */}
        <p className="text-xs text-muted-foreground">
          The System Track Record evaluates daily signals only. Intraday signals are provided for real-time context and execution support.
        </p>

        {/* Global Stats */}
        <TrackRecordStats />

        {/* Horizon Selector */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Horizon:</span>
          <Tabs value={horizon} onValueChange={(v) => setHorizon(v as '1w' | '1m' | '3m')}>
            <TabsList className="bg-muted/50">
              <TabsTrigger value="1w" className="text-sm">1 Week</TabsTrigger>
              <TabsTrigger value="1m" className="text-sm">1 Month</TabsTrigger>
              <TabsTrigger value="3m" className="text-sm">3 Months</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Summary by Signal Type */}
        <TrackRecordSummary horizon={horizon} />

        {/* Signal History */}
        <SignalHistory />
      </div>
    </div>
  );
}
