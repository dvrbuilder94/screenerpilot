import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Signal } from "@/lib/indicators";

export interface GroupSymbolData {
  symbol: string;
  score: number;
  signal: Signal;
  price: number;
  macroSignal: Signal;
}

interface GroupRankingProps {
  groupName: string;
  data: GroupSymbolData[];
  isLoading: boolean;
}

export default function GroupRanking({ groupName, data, isLoading }: GroupRankingProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">{groupName}</h2>
        <p className="text-muted-foreground">Cargando datos del grupo...</p>
      </Card>
    );
  }

  const sortedData = [...data].sort((a, b) => b.score - a.score);

  const getSignalIcon = (signal: Signal) => {
    switch (signal) {
      case "BUY":
        return <TrendingUp className="h-4 w-4 text-success" />;
      case "SELL":
        return <TrendingDown className="h-4 w-4 text-danger" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSignalBadge = (signal: Signal) => {
    const variants: Record<Signal, "default" | "secondary" | "destructive"> = {
      BUY: "default",
      HOLD: "secondary",
      SELL: "destructive",
    };
    return (
      <Badge variant={variants[signal]} className="font-mono">
        {signal}
      </Badge>
    );
  };

  return (
    <Card className="p-6 bg-card border border-border shadow-lg rounded-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          📊 {groupName}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Ranking por score micro (operativa)
        </p>
      </div>

      <div className="space-y-3">
        {sortedData.map((item, index) => (
          <div
            key={item.symbol}
            className="flex items-center justify-between p-4 bg-background/50 rounded-xl border border-border hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                {index + 1}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{item.symbol}</span>
                  {getSignalIcon(item.signal)}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">Macro:</span>
                  {getSignalBadge(item.macroSignal)}
                  <span className="text-xs text-muted-foreground">Micro:</span>
                  {getSignalBadge(item.signal)}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="font-mono text-lg font-bold">
                ${item.price.toFixed(2)}
              </div>
              <div className="flex items-center gap-2 justify-end mt-1">
                <span className="text-xs text-muted-foreground">Score:</span>
                <span
                  className={`font-bold text-sm ${
                    item.score >= 3
                      ? "text-success"
                      : item.score <= -3
                      ? "text-danger"
                      : "text-warning"
                  }`}
                >
                  {item.score > 0 ? "+" : ""}
                  {item.score}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-muted/30 rounded-xl border border-border">
        <h3 className="font-semibold text-sm mb-2">📈 Resumen del Grupo</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-success">
              {sortedData.filter((d) => d.signal === "BUY").length}
            </div>
            <div className="text-xs text-muted-foreground">Compra</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-warning">
              {sortedData.filter((d) => d.signal === "HOLD").length}
            </div>
            <div className="text-xs text-muted-foreground">Mantener</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-danger">
              {sortedData.filter((d) => d.signal === "SELL").length}
            </div>
            <div className="text-xs text-muted-foreground">Venta</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
