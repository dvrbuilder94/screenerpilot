import { Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  tooltip: string;
  valueColor?: "default" | "bullish" | "bearish";
}

export function MetricCard({ label, value, tooltip, valueColor = "default" }: MetricCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Info className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px] text-xs">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </div>
      <p
        className={cn(
          "text-2xl font-bold font-mono mt-2",
          valueColor === "bullish" && "text-bullish",
          valueColor === "bearish" && "text-bearish",
          valueColor === "default" && "text-foreground"
        )}
      >
        {value}
      </p>
    </Card>
  );
}
