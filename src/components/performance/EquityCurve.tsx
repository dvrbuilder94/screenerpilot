import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EquityPoint } from "@/hooks/usePerformanceData";

interface EquityCurveProps {
  data: EquityPoint[];
  timeRange: "all" | "6m" | "3m";
  onTimeRangeChange: (range: "all" | "6m" | "3m") => void;
  isDemo?: boolean;
}

const timeRanges: { label: string; value: "all" | "6m" | "3m" }[] = [
  { label: "Since Inception", value: "all" },
  { label: "6M", value: "6m" },
  { label: "3M", value: "3m" },
];

export function EquityCurve({ data, timeRange, onTimeRangeChange, isDemo }: EquityCurveProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatTooltipDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
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
          <p className="text-xs text-muted-foreground">{formatTooltipDate(point.date)}</p>
          <p className="text-sm font-semibold font-mono">
            ${point.equity.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Equity Curve</h2>
          {isDemo && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground mt-1">
              Demo Data
            </span>
          )}
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

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              domain={["dataMin - 5", "dataMax + 5"]}
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
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
