import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LayoutGrid, TrendingUp, TrendingDown } from 'lucide-react';
import { BloombergInsight } from '@/components/BloombergInsight';
import { sectorHeatmapInsight } from '@/lib/bloombergInsights';

interface SectorPerformance {
  symbol: string;
  name: string;
  change: number;
  weight: number; // Relative size in heatmap
}

const SECTORS: Omit<SectorPerformance, 'change'>[] = [
  { symbol: 'XLK', name: 'Technology', weight: 28 },
  { symbol: 'XLV', name: 'Healthcare', weight: 13 },
  { symbol: 'XLF', name: 'Financials', weight: 13 },
  { symbol: 'XLY', name: 'Consumer Disc.', weight: 10 },
  { symbol: 'XLC', name: 'Communication', weight: 9 },
  { symbol: 'XLI', name: 'Industrials', weight: 8 },
  { symbol: 'XLP', name: 'Consumer Staples', weight: 6 },
  { symbol: 'XLE', name: 'Energy', weight: 4 },
  { symbol: 'XLU', name: 'Utilities', weight: 3 },
  { symbol: 'XLRE', name: 'Real Estate', weight: 3 },
  { symbol: 'XLB', name: 'Materials', weight: 3 },
];

const getHeatmapColor = (change: number) => {
  if (change >= 2) return 'bg-green-600';
  if (change >= 1) return 'bg-green-500';
  if (change >= 0.5) return 'bg-green-400';
  if (change >= 0) return 'bg-green-300/70';
  if (change >= -0.5) return 'bg-red-300/70';
  if (change >= -1) return 'bg-red-400';
  if (change >= -2) return 'bg-red-500';
  return 'bg-red-600';
};

const getTextColor = (change: number) => {
  if (Math.abs(change) >= 0.5) return 'text-white';
  return 'text-foreground';
};

export function SectorHeatmap() {
  const [sectorData, setSectorData] = useState<SectorPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const results: SectorPerformance[] = [];
      
      await Promise.all(
        SECTORS.map(async (sector) => {
          try {
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-stock-data`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                },
                body: JSON.stringify({ symbol: sector.symbol, interval: '1d' }),
              }
            );
            
            if (response.ok) {
              const candles = await response.json();
              if (candles.length > 1) {
                const latest = candles[candles.length - 1].close;
                const previous = candles[candles.length - 2].close;
                const change = ((latest - previous) / previous) * 100;
                results.push({ ...sector, change });
              }
            }
          } catch (err) {
            console.error(`Error fetching ${sector.symbol}:`, err);
            results.push({ ...sector, change: 0 });
          }
        })
      );
      
      // Sort by weight for display
      setSectorData(results.sort((a, b) => b.weight - a.weight));
      setIsLoading(false);
    }
    
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <Card className="border-2 border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <LayoutGrid className="h-5 w-5 text-primary" />
            Sector Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Calculate grid layout based on weights
  const totalWeight = sectorData.reduce((sum, s) => sum + s.weight, 0);

  return (
    <Card className="border-2 border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <LayoutGrid className="h-5 w-5 text-primary" />
          Sector Heatmap
        </CardTitle>
        <p className="text-sm text-muted-foreground">S&P 500 sectors by market cap weight</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <BloombergInsight
          insight={sectorHeatmapInsight(sectorData)}
          panel="S&P 500 Sector Heatmap"
          data={sectorData}
        />
        {/* Treemap-style grid */}
        <div className="grid grid-cols-4 gap-1.5 auto-rows-fr" style={{ gridAutoRows: '80px' }}>
          {sectorData.map((sector, idx) => {
            const colSpan = sector.weight >= 20 ? 2 : 1;
            const rowSpan = sector.weight >= 13 ? 2 : 1;
            
            return (
              <div
                key={sector.symbol}
                className={`${getHeatmapColor(sector.change)} rounded-lg p-3 flex flex-col justify-between transition-all hover:scale-[1.02] hover:shadow-lg cursor-default`}
                style={{ 
                  gridColumn: `span ${colSpan}`,
                  gridRow: `span ${rowSpan}`,
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-xs font-medium opacity-80 ${getTextColor(sector.change)}`}>
                      {sector.symbol}
                    </p>
                    <p className={`text-sm font-bold ${getTextColor(sector.change)}`}>
                      {sector.name}
                    </p>
                  </div>
                  {rowSpan > 1 && (
                    <span className={`text-xs opacity-60 ${getTextColor(sector.change)}`}>
                      {sector.weight}%
                    </span>
                  )}
                </div>
                
                <div className={`flex items-center gap-1 ${getTextColor(sector.change)}`}>
                  {sector.change >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="text-lg font-bold">
                    {sector.change >= 0 ? '+' : ''}{sector.change.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span>-2%+</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-300 rounded" />
            <span>-0.5%</span>
          </div>
          <div className="w-px h-4 bg-border mx-2" />
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-300 rounded" />
            <span>+0.5%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span>+2%+</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
