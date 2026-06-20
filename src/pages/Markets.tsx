import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMarketSnapshots, MarketSnapshot } from "@/hooks/useMarketSnapshots";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Seo } from "@/components/Seo";
import { DailyBriefingCard } from "@/components/DailyBriefingCard";
import { useTierLimit } from "@/hooks/useTierLimit";
import { UpgradeTease } from "@/components/UpgradeTease";

// ==================== FORMATO ====================

const fmtNum = (n: number | null | undefined, decimals: number = 2) => {
  if (n == null || !isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  }).format(n);
};

const PctChange = ({ value }: { value: number | null | undefined }) => {
  if (value == null || !isFinite(value)) return <span className="text-muted-foreground">—</span>;
  
  const isPositive = value >= 0;
  const sign = isPositive ? "+" : "";
  
  return (
    <span className={cn(
      "font-mono tabular-nums",
      isPositive ? "text-emerald-400" : "text-red-400"
    )}>
      {sign}{value.toFixed(2)}%
    </span>
  );
};

// ==================== TABLA ====================

const MarketTable = ({ rows, title }: { rows: MarketSnapshot[]; title: string }) => {
  if (rows.length === 0) {
    return (
      <div className="fin-card p-8 text-center text-sm text-muted-foreground">
        No market data available • Updating every 15 minutes
      </div>
    );
  }

  return (
    <div className="fin-card">
      <div className="px-4 py-3 border-b border-border/50">
        <h3 className="text-xs uppercase tracking-[0.08em] text-muted-foreground font-medium">{title}</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-xs uppercase tracking-widest text-muted-foreground">
              <th className="text-left py-3 px-4 font-normal">Asset</th>
              <th className="text-right py-3 px-4 font-normal">Last</th>
              <th className="text-right py-3 px-4 font-normal">1D Chg</th>
              <th className="text-right py-3 px-4 font-normal">1D %</th>
              <th className="text-right py-3 px-4 font-normal">YTD %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30 font-mono">
            {rows.map((row) => (
              <tr key={row.symbol} className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4">
                  <div>
                    <span className="font-medium text-foreground">{row.display_name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{row.symbol}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right tabular-nums">
                  {fmtNum(row.current_price)}
                </td>
                <td className="py-3 px-4 text-right tabular-nums">
                  {fmtNum(row.change_1d)}
                </td>
                <td className="py-3 px-4 text-right">
                  <PctChange value={row.change_pct_1d} />
                </td>
                <td className="py-3 px-4 text-right">
                  <PctChange value={row.change_pct_ytd} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==================== MAIN PAGE ====================

const Markets = () => {
  const { data: rows = [], isLoading } = useMarketSnapshots();
  const { limit } = useTierLimit();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading market data...</p>
        </div>
      </div>
    );
  }

  const usEquity = rows.filter(r => ["SPY", "QQQ", "DIA", "IWM", "^VIX"].includes(r.symbol));
  const sectors = rows.filter(r => r.category === "sector");
  const visibleSectors = sectors.slice(0, limit);
  const hiddenSectors = Math.max(0, sectors.length - limit);

  return (
    <div className="space-y-10 pb-12">
      <Seo
        title="Markets - ScreenerPilot"
        description="Cross-asset macro snapshot: sectors, factors, yields, currencies and commodities."
        path="/markets"
      />

      <div>
        <h1 className="text-4xl font-semibold tracking-tighter">Markets</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Cross-asset macro snapshot • Sectors, factors, yields, currencies and commodities
        </p>
      </div>

      <DailyBriefingCard />

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="mb-8 bg-transparent border-b border-border w-full justify-start rounded-none h-auto p-0">
          {["today", "sectors", "factors", "yields", "currencies", "commodities", "countries"].map((tab) => (
            <TabsTrigger 
              key={tab} 
              value={tab}
              className="capitalize data-[state=active]:border-b-2 data-[state=active]:border-white rounded-none pb-4 px-6 text-sm"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="today" className="mt-0">
          <MarketTable 
            rows={usEquity} 
            title="US Equity Markets" 
          />
          
          {/* Global Snapshot se puede mejorar más adelante */}
        </TabsContent>

        <TabsContent value="sectors" className="mt-0 space-y-3">
          <MarketTable
            rows={visibleSectors}
            title="US Sectors"
          />
          <UpgradeTease hiddenCount={hiddenSectors} label="sectors" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Markets;
