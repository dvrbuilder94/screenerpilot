import { useMemo } from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}

export function Sparkline({ data, width = 60, height = 20, className }: SparklineProps) {
  const points = useMemo(() => {
    if (!data || data.length < 2) return "";

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const normalized = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    });

    return normalized.join(" ");
  }, [data, width, height]);

  const isPositive = useMemo(() => {
    if (!data || data.length < 2) return true;
    return data[data.length - 1] >= data[0];
  }, [data]);

  if (!data || data.length < 2) {
    return null;
  }

  return (
    <svg width={width} height={height} className={className}>
      <polyline
        points={points}
        fill="none"
        stroke={isPositive ? "hsl(var(--chart-2))" : "hsl(var(--destructive))"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
