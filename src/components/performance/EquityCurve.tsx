import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart } from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EquityPoint } from "@/hooks/usePerformanceData";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/translations";

interface EquityCurveProps {
  data: EquityPoint[];
  timeRange: "all" | "6m" | "3m";
  onTimeRangeChange: (range: "all" | "6m" | "3m") => void;
}

export function EquityCurve({ data, timeRange, onTimeRangeChange }: EquityCurveProps) {
  const { language } = useLanguage();
  
  const timeRanges: { label: string; value: "all" | "6m" | "3m" }[] = [
    { label: t('performance.sinceInception', language), value: "all" },
    { label: "6M", value: "6m" },
    { label: "3M", value: "3m" },
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: "short", day: "numeric" });
  };

  const formatTooltipDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as EquityPoint;
      return (
        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
          <p className="text-xs text-muted-foreground mb-1">{formatTooltipDate(point.date)}</p>
          <p className="text-sm font-semibold font-mono text-bullish">
            ${point.equity.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate Y-axis domain based on visible data
  const allValues = data.map(d => d.equity);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const padding = (maxValue - minValue) * 0.1;

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t('performance.equityCurve', language)}</h2>
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-bullish rounded"></span>
                <span className="text-muted-foreground">{t('performance.strategy', language)}</span>
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          {timeRanges.map((range) => (
            <Button
              key={range.value}
              variant={timeRange === range.value ? "default" : "ghost"}
              size="sm"
              onClick={() => onTimeRangeChange(range.value)}
              className={cn(
                "text-xs",
                timeRange !== range.value && "text-muted-foreground"
              )}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Institutional disclaimer */}
      <p className="text-xs text-muted-foreground mb-4">
        {t('performance.chartDisclaimer', language)}
      </p>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(145, 60%, 42%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(145, 60%, 42%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[Math.floor(minValue - padding), Math.ceil(maxValue + padding)]}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `$${value}`}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="equity"
              stroke="hsl(145, 60%, 42%)"
              strokeWidth={2}
              fill="url(#equityGradient)"
              animationDuration={1000}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}