import { Candle } from "@/lib/binanceApi";
import { useMemo } from "react";

interface MiniChartProps {
  candles: Candle[];
  ema20: number[];
  ema50: number[];
  height?: number;
}

export default function MiniChart({ candles, ema20, ema50, height = 200 }: MiniChartProps) {
  const chartData = useMemo(() => {
    if (!candles.length) return null;

    const displayCandles = candles.slice(-100);
    const closes = displayCandles.map(c => c.close);
    const highs = displayCandles.map(c => c.high);
    const lows = displayCandles.map(c => c.low);

    const minPrice = Math.min(...lows);
    const maxPrice = Math.max(...highs);
    const priceRange = maxPrice - minPrice;

    const normalize = (value: number) => {
      return ((maxPrice - value) / priceRange) * (height - 20) + 10;
    };

    return {
      candles: displayCandles,
      minPrice,
      maxPrice,
      normalize,
    };
  }, [candles, height]);

  if (!chartData) return null;

  const { candles: displayCandles, normalize } = chartData;
  const width = 800;
  const candleWidth = (width - 40) / displayCandles.length;

  const ema20Offset = candles.length - ema20.length;
  const ema50Offset = candles.length - ema50.length;

  return (
    <div className="bg-card rounded-xl p-4 border border-border/50">
      <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Gráfico de Velas (últimas 100)</h4>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = 10 + ratio * (height - 20);
          const price = chartData.maxPrice - ratio * (chartData.maxPrice - chartData.minPrice);
          return (
            <g key={ratio}>
              <line
                x1="20"
                y1={y}
                x2={width - 20}
                y2={y}
                stroke="hsl(var(--border))"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.3"
              />
              <text x="5" y={y + 4} fontSize="10" fill="hsl(var(--muted-foreground))">
                ${price.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Candlesticks */}
        {displayCandles.map((candle, i) => {
          const x = 20 + i * candleWidth + candleWidth / 2;
          const isGreen = candle.close >= candle.open;
          const color = isGreen ? 'hsl(var(--bullish))' : 'hsl(var(--bearish))';

          const highY = normalize(candle.high);
          const lowY = normalize(candle.low);
          const openY = normalize(candle.open);
          const closeY = normalize(candle.close);
          const bodyTop = Math.min(openY, closeY);
          const bodyHeight = Math.abs(closeY - openY) || 1;

          return (
            <g key={i}>
              {/* Wick */}
              <line
                x1={x}
                y1={highY}
                x2={x}
                y2={lowY}
                stroke={color}
                strokeWidth="1"
              />
              {/* Body */}
              <rect
                x={x - candleWidth * 0.35}
                y={bodyTop}
                width={candleWidth * 0.7}
                height={bodyHeight}
                fill={color}
                opacity={isGreen ? 0.8 : 1}
              />
            </g>
          );
        })}

        {/* EMA 20 */}
        {ema20.length > 0 && (
          <polyline
            points={ema20
              .slice(Math.max(0, ema20.length - 100))
              .map((value, i) => {
                const idx = Math.max(0, displayCandles.length - ema20.slice(-100).length) + i;
                const x = 20 + idx * candleWidth + candleWidth / 2;
                const y = normalize(value);
                return `${x},${y}`;
              })
              .join(' ')}
            fill="none"
            stroke="hsl(var(--bullish-light))"
            strokeWidth="2"
            opacity="0.8"
          />
        )}

        {/* EMA 50 */}
        {ema50.length > 0 && (
          <polyline
            points={ema50
              .slice(Math.max(0, ema50.length - 100))
              .map((value, i) => {
                const idx = Math.max(0, displayCandles.length - ema50.slice(-100).length) + i;
                const x = 20 + idx * candleWidth + candleWidth / 2;
                const y = normalize(value);
                return `${x},${y}`;
              })
              .join(' ')}
            fill="none"
            stroke="hsl(var(--bearish-light))"
            strokeWidth="2"
            opacity="0.8"
          />
        )}
      </svg>

      <div className="flex items-center justify-center gap-6 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-bullish-light" />
          <span className="text-xs text-muted-foreground">EMA 20</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-bearish-light" />
          <span className="text-xs text-muted-foreground">EMA 50</span>
        </div>
      </div>
    </div>
  );
}
