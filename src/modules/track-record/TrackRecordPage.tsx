import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { TrackRecordStats } from './TrackRecordStats';
import { TrackRecordSummary } from './TrackRecordSummary';
import { SignalHistory } from './SignalHistory';

export function TrackRecordPage() {
  const [horizon, setHorizon] = useState<'1w' | '1m' | '3m'>('1w');
  const [assetFilter, setAssetFilter] = useState<string>('ALL');

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

        {/* Asset Type Filter */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm text-muted-foreground">Asset Type:</span>
          <Tabs value={assetFilter} onValueChange={setAssetFilter}>
            <TabsList className="bg-muted/50 flex-wrap h-auto">
              <TabsTrigger value="ALL" className="text-sm">All</TabsTrigger>
              <TabsTrigger value="crypto" className="text-sm">Crypto</TabsTrigger>
              <TabsTrigger value="stock" className="text-sm">Stocks</TabsTrigger>
              <TabsTrigger value="index" className="text-sm">Indices</TabsTrigger>
              <TabsTrigger value="etf" className="text-sm">ETFs</TabsTrigger>
              <TabsTrigger value="commodity" className="text-sm">Commodities</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

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
        <SignalHistory assetFilter={assetFilter} />
      </div>
    </div>
  );
}
