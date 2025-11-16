import { AltseasonPanel } from '@/components/AltseasonPanel';
import { EthVsBtcPanel } from '@/components/EthVsBtcPanel';
import { CryptoRiskMeter } from '@/components/CryptoRiskMeter';
import { EthUpsidePanel } from '@/components/EthUpsidePanel';
import { AltseasonIndexPanel } from '@/components/AltseasonIndexPanel';
import { DominancePanel } from '@/components/DominancePanel';
import { FearGreedPanel } from '@/components/FearGreedPanel';
import { CryptoMacroInsight } from '@/components/CryptoMacroInsight';
import { useAuth } from '@/contexts/AuthContext';
import { Lock } from 'lucide-react';

export default function CryptoMacro() {
  const { user } = useAuth();
  const requiresPro = false; // Flag for future Pro restrictions

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Crypto Macro
            </h1>
            {requiresPro && !user && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 border border-accent/30">
                <Lock className="w-3 h-3 text-accent" />
                <span className="text-xs font-semibold text-accent">Pro</span>
              </div>
            )}
          </div>
          <p className="text-muted-foreground">
            Comprehensive crypto market macro analysis: Altseason, ETH/BTC, Risk Regime & Quantitative Signals
          </p>
        </div>

        {/* AI Insight */}
        <div className="mb-6">
          <CryptoMacroInsight />
        </div>

        {/* Panels Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original Altseason Index - Full width on mobile, half on desktop */}
          <div className="lg:col-span-2">
            <AltseasonPanel />
          </div>

          {/* ETH vs BTC */}
          <div className="lg:col-span-1">
            <EthVsBtcPanel />
          </div>

          {/* Crypto Risk Meter */}
          <div className="lg:col-span-1">
            <CryptoRiskMeter />
          </div>

          {/* ETH Upside Probability */}
          <div className="lg:col-span-1">
            <EthUpsidePanel />
          </div>

          {/* Advanced Altseason Index */}
          <div className="lg:col-span-1">
            <AltseasonIndexPanel />
          </div>

          {/* Fear & Greed Index */}
          <div className="lg:col-span-1">
            <FearGreedPanel />
          </div>

          {/* BTC Dominance Panel - takes remaining space */}
          <div className="lg:col-span-1">
            <DominancePanel />
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            Data updates every 5 minutes. Metrics calculated using Binance data.
          </p>
        </div>
      </main>
    </div>
  );
}
