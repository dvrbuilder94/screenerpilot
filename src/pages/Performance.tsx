import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EquityCurve } from "@/components/performance/EquityCurve";
import { MetricCard } from "@/components/performance/MetricCard";
import { TradeHistory } from "@/components/performance/TradeHistory";
import { usePerformanceData, filterEquityCurveForView } from "@/hooks/usePerformanceData";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/translations";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Performance() {
  const [timeRange, setTimeRange] = useState<"all" | "6m" | "3m">("all");
  const { data, isLoading, error } = usePerformanceData();
  const { language } = useLanguage();

  // Filter equity curve for display - data is fetched once, filtering happens on client
  const filteredEquityCurve = useMemo(() => {
    if (!data?.fullEquityCurve) return [];
    return filterEquityCurveForView(data.fullEquityCurve, timeRange);
  }, [data?.fullEquityCurve, timeRange]);

  if (error) {
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">{t('performance.failedToLoad', language)}</p>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t('performance.title', language)}</h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1 flex-wrap">
            <Tooltip>
              <TooltipTrigger className="underline decoration-dotted cursor-help">
                {t('performance.paperTraded', language)}
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{t('performance.paperTradedTooltip', language)}</p>
              </TooltipContent>
            </Tooltip>
            <span>·</span>
            <span>{t('performance.fullyAutomated', language)}</span>
            <span>·</span>
            <span>{t('performance.dailySignals', language)}</span>
          </p>
          <p className="text-xs text-muted-foreground/80 mt-2 italic">
            {t('performance.disclaimer', language)}
          </p>
        </div>

        {/* Equity Curve */}
        {isLoading ? (
          <Card className="p-6">
            <Skeleton className="h-[350px] w-full" />
          </Card>
        ) : data ? (
          <EquityCurve
            data={filteredEquityCurve}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
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
              label={t('performance.totalReturn', language)}
              value={`${data.metrics.totalReturn >= 0 ? "+" : ""}${data.metrics.totalReturn.toFixed(1)}%`}
              tooltip={t('performance.tooltips.totalReturn', language)}
              valueColor={data.metrics.totalReturn >= 0 ? "bullish" : "bearish"}
            />
            <MetricCard
              label={t('performance.cagr', language)}
              value={`${data.metrics.cagr >= 0 ? "+" : ""}${data.metrics.cagr.toFixed(1)}%`}
              tooltip={t('performance.tooltips.cagr', language)}
              valueColor={data.metrics.cagr >= 0 ? "bullish" : "bearish"}
            />
            <MetricCard
              label={t('performance.maxDrawdown', language)}
              value={`${data.metrics.maxDrawdown.toFixed(1)}%`}
              tooltip={t('performance.tooltips.maxDrawdown', language)}
              valueColor="bearish"
            />
            <MetricCard
              label={t('performance.winRate', language)}
              value={`${data.metrics.winRate.toFixed(1)}%`}
              tooltip={t('performance.tooltips.winRate', language)}
            />
            <MetricCard
              label={t('performance.trades', language)}
              value={data.metrics.tradeCount.toString()}
              tooltip={t('performance.tooltips.tradeCount', language)}
            />
            <MetricCard
              label={t('performance.startDate', language)}
              value={
                data.metrics.startDate
                  ? new Date(data.metrics.startDate).toLocaleDateString(
                      language === 'es' ? 'es-ES' : 'en-US',
                      { month: "short", year: "numeric" }
                    )
                  : "—"
              }
              tooltip={t('performance.tooltips.startDate', language)}
            />
          </div>
        ) : null}

        {/* Strategy Description */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-3">{t('performance.howItWorks', language)}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t('performance.howItWorksDesc', language)}
          </p>
        </Card>

        {/* Trade History */}
        {!isLoading && data && data.trades.length > 0 && (
          <TradeHistory trades={data.trades} />
        )}
      </div>
    </TooltipProvider>
  );
}