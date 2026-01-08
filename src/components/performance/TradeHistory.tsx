import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TradeRecord } from "@/hooks/usePerformanceData";
import { getAssetName } from "@/lib/assetNames";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/translations";

interface TradeHistoryProps {
  trades: TradeRecord[];
}

export function TradeHistory({ trades }: TradeHistoryProps) {
  const { language } = useLanguage();
  
  if (trades.length === 0) {
    return null;
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      month: "short",
      day: "numeric",
      year: "2-digit",
    });
  };

  const getSignalVariant = (signal: string) => {
    if (signal.includes("BUY")) return "default";
    if (signal.includes("SELL")) return "secondary";
    return "outline";
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">{t('performance.recentTrades', language)}</h2>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs uppercase tracking-wide">{t('performance.asset', language)}</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">{t('performance.signal', language)}</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">{t('performance.entry', language)}</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">{t('performance.exit', language)}</TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-right">{t('performance.return', language)}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((trade) => (
              <TableRow key={trade.id}>
                <TableCell className="font-medium">
                  <div>
                    <span className="font-mono text-sm">{trade.asset}</span>
                    <span className="block text-xs text-muted-foreground">
                      {getAssetName(trade.asset)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getSignalVariant(trade.signal)} className="text-xs">
                    {trade.signal.replace("STRONG_", "")}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(trade.entryDate)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(trade.exitDate)}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={cn(
                      "font-mono font-medium",
                      trade.returnPct >= 0 ? "text-bullish" : "text-bearish"
                    )}
                  >
                    {trade.returnPct >= 0 ? "+" : ""}
                    {trade.returnPct.toFixed(2)}%
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {trades.map((trade) => (
          <div
            key={trade.id}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium truncate">
                  {trade.asset}
                </span>
                <Badge variant={getSignalVariant(trade.signal)} className="text-xs shrink-0">
                  {trade.signal.replace("STRONG_", "")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(trade.entryDate)} → {formatDate(trade.exitDate)}
              </p>
            </div>
            <span
              className={cn(
                "font-mono font-medium text-sm ml-3",
                trade.returnPct >= 0 ? "text-bullish" : "text-bearish"
              )}
            >
              {trade.returnPct >= 0 ? "+" : ""}
              {trade.returnPct.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}