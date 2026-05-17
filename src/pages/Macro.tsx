import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Landmark, Globe2, Bitcoin } from "lucide-react";
import { FedMacroPanel } from "@/components/macro/FedMacroPanel";
import { LatamMacroPanel } from "@/components/macro/LatamMacroPanel";
import { CryptoMacroPanel } from "@/components/macro/CryptoMacroPanel";
import { Seo } from "@/components/Seo";
import { ProGate } from "@/components/ProGate";

type MacroTab = "fed" | "latam" | "crypto";

export default function Macro() {
  const [tab, setTab] = useState<MacroTab>("fed");

  return (
    <ProGate preview>
    <div className="min-h-screen bg-background">
      <Seo
        title="Macro Intelligence — FED, LATAM & Crypto | ScreenerPilot"
        description="Real-time macro indicators: Fed policy, US data, LATAM economies and crypto-native macro. Track regime shifts and economic surprises."
        path="/macro"
      />
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Macro Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time macroeconomic indicators across the Fed, LATAM economies, and crypto markets
          </p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as MacroTab)} className="space-y-6">
          <TabsList className="w-full h-12 bg-muted/40 p-1 grid grid-cols-3 gap-1">
            <TabsTrigger value="fed" className="flex items-center justify-center gap-2 h-full text-sm font-medium">
              <Landmark className="h-4 w-4" />
              <span className="hidden sm:inline">FED & US Macro</span>
              <span className="sm:hidden">FED</span>
            </TabsTrigger>
            <TabsTrigger value="latam" className="flex items-center justify-center gap-2 h-full text-sm font-medium">
              <Globe2 className="h-4 w-4" />
              <span className="hidden sm:inline">LATAM Macro</span>
              <span className="sm:hidden">LATAM</span>
            </TabsTrigger>
            <TabsTrigger value="crypto" className="flex items-center justify-center gap-2 h-full text-sm font-medium">
              <Bitcoin className="h-4 w-4" />
              <span className="hidden sm:inline">Crypto Macro</span>
              <span className="sm:hidden">Crypto</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fed" className="mt-0">
            <FedMacroPanel />
          </TabsContent>
          <TabsContent value="latam" className="mt-0">
            <LatamMacroPanel />
          </TabsContent>
          <TabsContent value="crypto" className="mt-0">
            <CryptoMacroPanel />
          </TabsContent>
        </Tabs>

        <div className="mt-10 py-4 border-t border-border/40">
          <p className="text-[11px] text-muted-foreground text-center">
            Sources: FRED (St. Louis Fed) · Yahoo Finance · CoinGecko · Binance · Alternative.me Fear & Greed Index
          </p>
        </div>
      </main>
    </div>
    </ProGate>
  );
}
