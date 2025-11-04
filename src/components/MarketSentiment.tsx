import { SentimentData, SentimentLevel } from "@/types/sentiment";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Minus, AlertTriangle, Smile } from "lucide-react";

interface MarketSentimentProps {
  sentiment: SentimentData | null;
  loading?: boolean;
}

const sentimentConfig: Record<SentimentLevel, {
  label: string;
  color: string;
  bgColor: string;
  icon: any;
}> = {
  extreme_fear: {
    label: "Miedo Extremo",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-950",
    icon: AlertTriangle,
  },
  fear: {
    label: "Miedo",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-950",
    icon: TrendingDown,
  },
  neutral: {
    label: "Neutral",
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    icon: Minus,
  },
  greed: {
    label: "Codicia",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-950",
    icon: TrendingUp,
  },
  extreme_greed: {
    label: "Codicia Extrema",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-950",
    icon: Smile,
  },
};

export function MarketSentiment({ sentiment, loading }: MarketSentimentProps) {
  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-8 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (!sentiment) {
    return (
      <Card className="p-4 border-dashed">
        <div className="text-center text-sm text-muted-foreground">
          <p>Sentimiento de mercado no disponible</p>
          <p className="text-xs mt-1">(Próximamente: Fear & Greed Index)</p>
        </div>
      </Card>
    );
  }

  const config = sentimentConfig[sentiment.level];
  const Icon = config.icon;

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Sentimiento de Mercado</h3>
          {sentiment.source && (
            <Badge variant="outline" className="text-xs">
              {sentiment.source}
            </Badge>
          )}
        </div>

        <div className={`flex items-center gap-3 p-3 rounded-lg ${config.bgColor}`}>
          <Icon className={`h-6 w-6 ${config.color}`} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${config.color}`}>
                {config.label}
              </span>
              <Badge variant="secondary" className="text-xs">
                {sentiment.score}/100
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {sentiment.description}
            </p>
          </div>
        </div>

        {/* Progress bar visual */}
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`absolute h-full transition-all ${
              sentiment.score <= 20
                ? "bg-red-500"
                : sentiment.score <= 40
                ? "bg-orange-500"
                : sentiment.score <= 60
                ? "bg-gray-500"
                : sentiment.score <= 80
                ? "bg-green-500"
                : "bg-emerald-500"
            }`}
            style={{ width: `${sentiment.score}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Miedo</span>
          <span>Neutral</span>
          <span>Codicia</span>
        </div>
      </div>
    </Card>
  );
}
