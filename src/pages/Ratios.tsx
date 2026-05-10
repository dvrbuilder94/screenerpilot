import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Coins, BarChart3, Bitcoin, Globe2 } from "lucide-react";
import { RatioCategoryTable } from "@/components/ratios/RatioCategoryTable";

type RatioTab = "commodity" | "equity" | "crypto" | "latam_fx";

export default function Ratios() {
  const [tab, setTab] = useState<RatioTab>("commodity");

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Cross-Asset Ratios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            5Y rolling Z-Score · Flags statistical extremes (|z| ≥ 2σ) and regime shifts (|z| ≥ 1σ)
          </p>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2 text-[10px]">
          <span className="text-muted-foreground uppercase tracking-wider mr-1">Legend:</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/25 text-emerald-300 ring-1 ring-emerald-500/40 font-bold uppercase">STRETCHED HIGH</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold uppercase">RISK-ON</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-muted/40 text-muted-foreground font-bold uppercase">BALANCED</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 font-bold uppercase">RISK-OFF</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-rose-500/25 text-rose-300 ring-1 ring-rose-500/40 font-bold uppercase">STRETCHED LOW</span>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as RatioTab)} className="space-y-6">
          <TabsList className="w-full h-12 bg-muted/40 p-1 grid grid-cols-4 gap-1">
            <TabsTrigger value="commodity" className="flex items-center justify-center gap-2 h-full text-sm font-medium">
              <Coins className="h-4 w-4" />
              <span className="hidden sm:inline">Commodities</span>
            </TabsTrigger>
            <TabsTrigger value="equity" className="flex items-center justify-center gap-2 h-full text-sm font-medium">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Equities</span>
            </TabsTrigger>
            <TabsTrigger value="crypto" className="flex items-center justify-center gap-2 h-full text-sm font-medium">
              <Bitcoin className="h-4 w-4" />
              <span className="hidden sm:inline">Crypto</span>
            </TabsTrigger>
            <TabsTrigger value="latam_fx" className="flex items-center justify-center gap-2 h-full text-sm font-medium">
              <Globe2 className="h-4 w-4" />
              <span className="hidden sm:inline">LATAM FX</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="commodity" className="mt-0">
            <RatioCategoryTable category="commodity" description="Metal, energy & monetary stress ratios. Ranked by absolute Z-Score (extremes first)." />
          </TabsContent>
          <TabsContent value="equity" className="mt-0">
            <RatioCategoryTable category="equity" description="Equity risk regime rotations: small caps, tech leadership, credit spreads, defensives." />
          </TabsContent>
          <TabsContent value="crypto" className="mt-0">
            <RatioCategoryTable category="crypto" description="BTC vs traditional store of value, alt season indicator, and crypto vs equity beta." />
          </TabsContent>
          <TabsContent value="latam_fx" className="mt-0">
            <RatioCategoryTable category="latam_fx" description="LATAM FX vs DXY and commodity correlations (CLP↔Copper, BRL/MXN↔Oil)." />
          </TabsContent>
        </Tabs>

        <div className="mt-10 py-4 border-t border-border/40">
          <p className="text-[11px] text-muted-foreground text-center">
            Source: Yahoo Finance · 5Y daily closes · Z-Score = (current − μ₅ᵧ) / σ₅ᵧ · Updated every 6h
          </p>
        </div>
      </main>
    </div>
  );
}
