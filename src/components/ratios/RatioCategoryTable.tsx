import { useRatioSnapshots, RatioSnapshot } from "@/hooks/useRatioSnapshots";
import { RatioRow } from "./RatioRow";
import { Skeleton } from "@/components/ui/skeleton";
import { BloombergInsight } from "@/components/BloombergInsight";
import { ratiosCategoryInsight } from "@/lib/bloombergInsights";

interface Props {
  category: string;
  description: string;
}

export function RatioCategoryTable({ category, description }: Props) {
  const { data, isLoading } = useRatioSnapshots(category);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
      </div>
    );
  }

  const rows = (data ?? []).sort((a, b) => Math.abs(b.z_score ?? 0) - Math.abs(a.z_score ?? 0));

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border/40 bg-card/30 p-8 text-center">
        <p className="text-muted-foreground">Ratios loading. Collector runs every 6 hours.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <BloombergInsight
        insight={ratiosCategoryInsight(rows, category)}
        panel={`Ratios · ${category}`}
        data={rows.slice(0, 8)}
      />
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="rounded-lg border border-border/40 bg-card/30 overflow-x-auto">
        <table className="w-full text-sm min-w-[840px]">
          <thead className="bg-muted/40 border-b border-border/40">
            <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="text-left py-2 px-3 font-medium">Ratio</th>
              <th className="text-right py-2 px-3 font-medium">Current</th>
              <th className="text-right py-2 px-3 font-medium">5Y Mean</th>
              <th className="text-right py-2 px-3 font-medium">Z-Score</th>
              <th className="text-right py-2 px-3 font-medium">Pctile</th>
              <th className="text-right py-2 px-3 font-medium">1M Δ</th>
              <th className="text-left py-2 px-3 font-medium">90D Trend</th>
              <th className="text-right py-2 px-3 font-medium">Bias</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: RatioSnapshot) => <RatioRow key={r.ratio_id} ratio={r} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
