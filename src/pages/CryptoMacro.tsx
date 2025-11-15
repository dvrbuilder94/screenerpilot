import { AltseasonPanel } from '@/components/AltseasonPanel';
import { EthVsBtcPanel } from '@/components/EthVsBtcPanel';
import { CryptoRiskMeter } from '@/components/CryptoRiskMeter';
import { useAuth } from '@/contexts/AuthContext';
import { Lock } from 'lucide-react';

export default function CryptoMacro() {
  const { user } = useAuth();
  const requiresPro = false; // Flag para futuras restricciones Pro

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
            Vista macro del mercado crypto: Altseason Index, ETH vs BTC, y Risk Regime
          </p>
        </div>

        {/* Panels Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Altseason Index - Ancho completo en mobile, mitad en desktop */}
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
        </div>

        {/* Footer note */}
        <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            Los datos se actualizan cada 5 minutos. Métricas calculadas usando datos de Binance.
          </p>
        </div>
      </main>
    </div>
  );
}
