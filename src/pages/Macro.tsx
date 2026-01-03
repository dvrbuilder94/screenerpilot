import { useState } from 'react';
import { EthVsBtcPanel } from '@/components/EthVsBtcPanel';
import { CryptoRiskMeter } from '@/components/CryptoRiskMeter';
import { EthUpsidePanel } from '@/components/EthUpsidePanel';
import { AltseasonIndexPanel } from '@/components/AltseasonIndexPanel';
import { DominancePanel } from '@/components/DominancePanel';
import { FearGreedPanel } from '@/components/FearGreedPanel';
import { CryptoMacroInsight } from '@/components/CryptoMacroInsight';
import { MacroCategoryTabs, MacroCategory } from '@/components/macro/MacroCategoryTabs';
import { CommoditiesMacro } from '@/components/macro/CommoditiesMacro';
import { StocksMacro } from '@/components/macro/StocksMacro';
import { FedMacro } from '@/components/macro/FedMacro';

export default function Macro() {
  const [activeCategory, setActiveCategory] = useState<MacroCategory>('crypto');

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Macro Analysis
          </h1>
          <p className="text-muted-foreground">
            Comprehensive market macro analysis across Crypto, Commodities, Stocks, and Federal Reserve indicators
          </p>
        </div>

        {/* Category Tabs */}
        <div className="mb-6">
          <MacroCategoryTabs 
            activeCategory={activeCategory} 
            onCategoryChange={setActiveCategory} 
          />
        </div>

        {/* Category Content */}
        <div className="space-y-6">
          {activeCategory === 'crypto' && (
            <>
              {/* AI Insight */}
              <CryptoMacroInsight />

              {/* Crypto Panels Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EthVsBtcPanel />
                <CryptoRiskMeter />
                <EthUpsidePanel />
                <AltseasonIndexPanel />
                <FearGreedPanel />
                <DominancePanel />
              </div>
            </>
          )}

          {activeCategory === 'commodities' && (
            <CommoditiesMacro />
          )}

          {activeCategory === 'stocks' && (
            <StocksMacro />
          )}

          {activeCategory === 'fed' && (
            <FedMacro />
          )}
        </div>

        {/* Footer note */}
        <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            Data updates every 5 minutes. Crypto metrics use Binance data. Stocks and commodities use Yahoo Finance.
          </p>
        </div>
      </main>
    </div>
  );
}
