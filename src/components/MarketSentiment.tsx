import { SentimentData, SentimentLevel } from "@/types/sentiment";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Minus, AlertTriangle, Smile } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";

interface MarketSentimentProps {
  sentiment: SentimentData | null;
  loading?: boolean;
}

const sentimentConfig: Record<SentimentLevel, {
  color: string;
  bgColor: string;
  icon: any;
}> = {
  extreme_fear: {
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-950",
    icon: AlertTriangle,
  },
  fear: {
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-950",
    icon: TrendingDown,
  },
  neutral: {
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    icon: Minus,
  },
  greed: {
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-950",
    icon: TrendingUp,
  },
  extreme_greed: {
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-950",
    icon: Smile,
  },
};

function getSentimentLabel(level: SentimentLevel, lang: 'en' | 'es'): string {
  const labels = {
    en: {
      extreme_fear: "Extreme Fear",
      fear: "Fear",
      neutral: "Neutral",
      greed: "Greed",
      extreme_greed: "Extreme Greed",
    },
    es: {
      extreme_fear: "Miedo Extremo",
      fear: "Miedo",
      neutral: "Neutral",
      greed: "Codicia",
      extreme_greed: "Codicia Extrema",
    },
  };
  return labels[lang][level];
}

function getSentimentDescription(level: SentimentLevel, lang: 'en' | 'es'): string {
  const t = translations[lang];
  const descriptions = {
    extreme_fear: t.extremeFearDesc,
    fear: t.fearDesc,
    neutral: t.neutralDesc,
    greed: t.greedDesc,
    extreme_greed: t.extremeGreedDesc,
  };
  return descriptions[level];
}

export function MarketSentiment({ sentiment, loading }: MarketSentimentProps) {
  const { language } = useLanguage();
  const t = translations[language];

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
          <p>{t.sentimentNotAvailable}</p>
          <p className="text-xs mt-1">{t.sentimentComingSoon}</p>
        </div>
      </Card>
    );
  }

  const config = sentimentConfig[sentiment.level];
  const Icon = config.icon;
  const label = getSentimentLabel(sentiment.level, language);
  const description = getSentimentDescription(sentiment.level, language);

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">{t.marketSentiment}</h3>
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
                {label}
              </span>
              <Badge variant="secondary" className="text-xs">
                {sentiment.score}/100
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {description}
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
          <span>{t.fear}</span>
          <span>{t.neutral}</span>
          <span>{t.greed}</span>
        </div>
      </div>
    </Card>
  );
}
