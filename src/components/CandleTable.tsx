import { Candle } from "@/lib/binanceApi";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CandleTableProps {
  candles: Candle[];
  limit?: number;
}

export default function CandleTable({ candles, limit = 20 }: CandleTableProps) {
  const displayCandles = candles.slice(-limit).reverse();

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatNumber = (num: number) => {
    return num.toFixed(2);
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(2)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(2)}K`;
    return vol.toFixed(2);
  };

  return (
    <div className="bg-card rounded-xl border border-border/50">
      <div className="p-4 border-b border-border/50">
        <h4 className="text-sm font-semibold text-muted-foreground">
          Últimas {limit} Velas
        </h4>
      </div>
      <ScrollArea className="h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Fecha</TableHead>
              <TableHead className="text-right">Apertura</TableHead>
              <TableHead className="text-right">Máximo</TableHead>
              <TableHead className="text-right">Mínimo</TableHead>
              <TableHead className="text-right">Cierre</TableHead>
              <TableHead className="text-right">Volumen</TableHead>
              <TableHead className="text-right">Cambio %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayCandles.map((candle, i) => {
              const change = ((candle.close - candle.open) / candle.open) * 100;
              const isPositive = change >= 0;
              
              return (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs">
                    {formatDate(candle.openTime)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${formatNumber(candle.open)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-bullish">
                    ${formatNumber(candle.high)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-bearish">
                    ${formatNumber(candle.low)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    ${formatNumber(candle.close)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {formatVolume(candle.volume)}
                  </TableCell>
                  <TableCell className={`text-right font-mono font-semibold ${
                    isPositive ? 'text-bullish' : 'text-bearish'
                  }`}>
                    {isPositive ? '+' : ''}{change.toFixed(2)}%
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
