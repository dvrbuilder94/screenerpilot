import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EquityCurve } from "@/components/performance/EquityCurve";
import { MetricCard } from "@/components/performance/MetricCard";
import { TradeHistory } from "@/components/performance/TradeHistory";
import { usePerformanceData } from "@/hooks/usePerformanceData";

const metricTooltips = {
  totalReturn: "The overall gain or loss since inception, expressed as a percentage",
  cagr: "Compound Annual Growth Rate - the average yearly return if gains were reinvested",
  maxDrawdown: "The largest peak-to-trough decline during the tracked period",
  winRate: "The percentage of trades that resulted in a profit",
  tradeCount: "Total count of completed trades with resolved outcomes",
  startDate: "When the strategy began recording signals",
};

export default function Performance() {
  const [timeRange, setTimeRange] = useState<"all" | "6m" | "3m">("all");
  const { data, isLoading, error } = usePerformanceData(timeRange);

  if (error) {
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Failed to load performance data</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Strategy Performance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Paper-traded · Fully automated · Daily signals · No leverage
        </p>
      </div>

      {/* Equity Curve */}
      {isLoading ? (
        <Card className="p-6">
          <Skeleton className="h-[350px] w-full" />
        </Card>
      ) : data ? (
        <EquityCurve
          data={data.equityCurve}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          isDemo={data.isDemo}
        />
      ) : null}

      {/* Key Metrics */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-4 w-16 mb-3" />
              <Skeleton className="h-8 w-20" />
            </Card>
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard
            label="Total Return"
            value={`${data.metrics.totalReturn >= 0 ? "+" : ""}${data.metrics.totalReturn.toFixed(1)}%`}
            tooltip={metricTooltips.totalReturn}
            valueColor={data.metrics.totalReturn >= 0 ? "bullish" : "bearish"}
          />
          <MetricCard
            label="CAGR"
            value={`${data.metrics.cagr >= 0 ? "+" : ""}${data.metrics.cagr.toFixed(1)}%`}
            tooltip={metricTooltips.cagr}
            valueColor={data.metrics.cagr >= 0 ? "bullish" : "bearish"}
          />
          <MetricCard
            label="Max Drawdown"
            value={`${data.metrics.maxDrawdown.toFixed(1)}%`}
            tooltip={metricTooltips.maxDrawdown}
            valueColor="bearish"
          />
          <MetricCard
            label="Win Rate"
            value={`${data.metrics.winRate.toFixed(1)}%`}
            tooltip={metricTooltips.winRate}
          />
          <MetricCard
            label="Trades"
            value={data.metrics.tradeCount.toString()}
            tooltip={metricTooltips.tradeCount}
          />
          <MetricCard
            label="Start Date"
            value={
              data.metrics.startDate
                ? new Date(data.metrics.startDate).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })
                : "—"
            }
            tooltip={metricTooltips.startDate}
          />
        </div>
      ) : null}

      {/* Strategy Description */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">How It Works</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This performance is generated from daily trading signals executed automatically using
          predefined rules. Trades are entered on the next market close after a signal is
          generated. No manual intervention, no hindsight, no leverage.
        </p>
      </Card>

      {/* Trade History */}
      {!isLoading && data && data.trades.length > 0 && (
        <TradeHistory trades={data.trades} />
      )}
    </div>
  );
}
