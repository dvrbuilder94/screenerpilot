import { TrendingUp, TrendingDown, Activity, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TradingSetup } from "@/types/trading";

interface MarketSummaryCardsProps {
  signals: TradingSetup[];
  isLoading: boolean;
}

export function MarketSummaryCards({ signals, isLoading }: MarketSummaryCardsProps) {
  const stats = {
    total: signals.length,
    strongBuy: signals.filter(s => s.macroSignal.signal === "STRONG_BUY").length,
    buy: signals.filter(s => s.macroSignal.signal === "BUY").length,
    hold: signals.filter(s => s.macroSignal.signal === "HOLD").length,
    sell: signals.filter(s => s.macroSignal.signal === "SELL").length,
    strongSell: signals.filter(s => s.macroSignal.signal === "STRONG_SELL").length,
  };

  const bullish = stats.strongBuy + stats.buy;
  const bearish = stats.sell + stats.strongSell;
  const bullishPct = stats.total > 0 ? Math.round((bullish / stats.total) * 100) : 0;
  const bearishPct = stats.total > 0 ? Math.round((bearish / stats.total) * 100) : 0;

  const cards = [
    {
      title: "Total Assets",
      value: stats.total,
      icon: BarChart3,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Bullish Signals",
      value: bullish,
      subtitle: `${bullishPct}% of total`,
      icon: TrendingUp,
      color: "text-bullish",
      bgColor: "bg-bullish/10",
    },
    {
      title: "Bearish Signals",
      value: bearish,
      subtitle: `${bearishPct}% of total`,
      icon: TrendingDown,
      color: "text-bearish",
      bgColor: "bg-bearish/10",
    },
    {
      title: "Strong Signals",
      value: stats.strongBuy + stats.strongSell,
      subtitle: "High conviction",
      icon: Activity,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  if (isLoading && signals.length === 0) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-16 bg-muted rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="p-4 bg-card/50 border-border/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{card.title}</p>
              <p className="text-2xl font-bold">{card.value}</p>
              {card.subtitle && (
                <p className="text-xs text-muted-foreground">{card.subtitle}</p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
