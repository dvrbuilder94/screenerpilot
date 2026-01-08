import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { History, TrendingUp, TrendingDown, Percent, BarChart2 } from "lucide-react";
import { useTrackRecordMetrics } from "@/hooks/useTrackRecord";
import { SignalType } from "@/types/trading";
import { Skeleton } from "@/components/ui/skeleton";

interface TrackRecordContextProps {
  signalType: SignalType;
}

export function TrackRecordContext({ signalType }: TrackRecordContextProps) {
  const [horizon, setHorizon] = useState<"1w" | "1m" | "3m">("1w");
  
  const { data: metrics, isLoading } = useTrackRecordMetrics(horizon, "1d");

  // Find metrics for this specific signal type
  const signalMetrics = metrics?.find(
    (m) => m.signal === signalType && m.timeframe === "1d"
  );

  const hasData = signalMetrics && signalMetrics.sample_size >= 10;

  const isLongSignal = ["STRONG_BUY", "BUY"].includes(signalType);

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <History className="h-4 w-4" />
            System Credibility
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Daily (1D)
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Historical performance of {signalType.replace("_", " ")} signals
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Horizon Selector */}
        <Tabs value={horizon} onValueChange={(v) => setHorizon(v as "1w" | "1m" | "3m")}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="1w">1 Week</TabsTrigger>
            <TabsTrigger value="1m">1 Month</TabsTrigger>
            <TabsTrigger value="3m">3 Months</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Metrics Display */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : !hasData ? (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Insufficient historical data for this signal type
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Minimum 10 samples required
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              icon={BarChart2}
              label="Sample Size"
              value={signalMetrics.sample_size.toString()}
              color="text-primary"
            />
            <MetricCard
              icon={Percent}
              label="Win Rate"
              value={`${signalMetrics.win_rate.toFixed(1)}%`}
              color={signalMetrics.win_rate >= 50 ? "text-bullish" : "text-bearish"}
            />
            <MetricCard
              icon={isLongSignal ? TrendingUp : TrendingDown}
              label="Avg Return"
              value={`${signalMetrics.avg_return >= 0 ? "+" : ""}${signalMetrics.avg_return.toFixed(2)}%`}
              color={
                (isLongSignal && signalMetrics.avg_return > 0) ||
                (!isLongSignal && signalMetrics.avg_return < 0)
                  ? "text-bullish"
                  : "text-bearish"
              }
            />
            <MetricCard
              icon={TrendingDown}
              label="Avg Drawdown"
              value={`${signalMetrics.avg_drawdown.toFixed(2)}%`}
              color="text-bearish"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-3.5 w-3.5 ${color}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}
