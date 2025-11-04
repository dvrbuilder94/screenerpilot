import { TradingStyle, TRADING_PROFILES } from "@/types/tradingProfile";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, TrendingUp, Target } from "lucide-react";

interface TradingStyleSelectorProps {
  selectedStyle: TradingStyle;
  onStyleChange: (style: TradingStyle) => void;
}

const styleIcons: Record<TradingStyle, any> = {
  scalping: Zap,
  swing: TrendingUp,
  investment: Target,
};

export function TradingStyleSelector({ selectedStyle, onStyleChange }: TradingStyleSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Estilo de Trading</h3>
        <Badge variant="outline" className="text-xs">
          {TRADING_PROFILES[selectedStyle].name}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(Object.keys(TRADING_PROFILES) as TradingStyle[]).map((style) => {
          const profile = TRADING_PROFILES[style];
          const Icon = styleIcons[style];
          const isSelected = selectedStyle === style;

          return (
            <Card
              key={style}
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                isSelected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "hover:border-primary/50"
              }`}
              onClick={() => onStyleChange(style)}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  <h4 className="font-semibold text-sm">{profile.name}</h4>
                </div>
                <p className="text-xs text-muted-foreground">{profile.description}</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {profile.preferredTimeframes.map((tf) => (
                    <Badge key={tf} variant="secondary" className="text-xs px-2 py-0">
                      {tf}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
