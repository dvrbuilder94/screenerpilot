import { useState } from 'react';
import { EthVsBtcPanel } from '@/components/EthVsBtcPanel';
import { BmnrVsEthPanel } from '@/components/BmnrVsEthPanel';
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
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Hero Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            Macro Analysis
          </h1>
          <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
            Real-time macro indicators across Crypto, Stocks, Commodities, and Federal Reserve data
          </p>
        </div>

        {/* Category Tabs - Prominent */}
        <div className="mb-8">
          <MacroCategoryTabs 
            activeCategory={activeCategory} 
            onCategoryChange={setActiveCategory} 
          />
        </div>

        {/* Category Content */}
        <div className="min-h-[60vh]">
          {activeCategory === 'crypto' && (
            <div className="space-y-6">
              {/* AI Insight - Full width hero */}
              <CryptoMacroInsight />

              {/* Primary Metrics - 2 column hero */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FearGreedPanel />
                <AltseasonIndexPanel />
              </div>

              {/* Secondary Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <EthVsBtcPanel />
                <EthUpsidePanel />
                <DominancePanel />
              </div>

              {/* Risk Meter - Full width */}
              <CryptoRiskMeter />
            </div>
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
        <div className="mt-10 py-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            Data updates in real-time. Crypto via Binance. Stocks, commodities, and Fed indicators via Yahoo Finance.
          </p>
        </div>
      </main>
    </div>
  );
}
