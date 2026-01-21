import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { calculateStockRegime, type StockMarketRegime, type StockRiskState } from '@/lib/stockMacro';
import { calculateCryptoRisk, type CryptoRiskData, type RiskState } from '@/lib/cryptoMacro';
import { calculateCommodityRegime, type CommodityMarketRegime, type CommodityState, getCommodityStateLabel } from '@/lib/commodityMacro';

interface RegimeBadgeProps {
  icon: string;
  label: string;
  state: string;
  stateLabel: string;
  reasons: string[];
  colorClass: string;
  isLoading?: boolean;
}

function RegimeBadge({ icon, label, state, stateLabel, reasons, colorClass, isLoading }: RegimeBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border/50">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-medium">{label}:</span>
        <Skeleton className="h-5 w-16" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <TooltipTrigger asChild>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border/50 hover:bg-muted/80 transition-colors cursor-pointer">
                <span className="text-lg">{icon}</span>
                <span className="text-sm font-medium text-muted-foreground">{label}:</span>
                <Badge 
                  variant="outline" 
                  className={`${colorClass} border-current font-semibold`}
                >
                  {stateLabel}
                </Badge>
                {isOpen ? (
                  <ChevronUp className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <ul className="text-xs space-y-1">
              {reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="text-muted-foreground">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </TooltipContent>
          <CollapsibleContent className="mt-2 ml-0 pl-3 border-l-2 border-border/50">
            <ul className="text-xs space-y-1 text-muted-foreground">
              {reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span>•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      </Tooltip>
    </TooltipProvider>
  );
}

function getStockStateLabel(state: StockRiskState): string {
  switch (state) {
    case 'risk_on': return 'Risk-On';
    case 'risk_off': return 'Risk-Off';
    case 'neutral': return 'Neutral';
  }
}

function getStockStateColor(state: StockRiskState): string {
  switch (state) {
    case 'risk_on': return 'text-green-500';
    case 'risk_off': return 'text-red-500';
    case 'neutral': return 'text-yellow-500';
  }
}

function getCryptoStateLabel(state: RiskState): string {
  switch (state) {
    case 'risk_on': return 'Risk-On';
    case 'risk_off': return 'Risk-Off';
    case 'neutral': return 'Neutral';
  }
}

function getCryptoStateColor(state: RiskState): string {
  switch (state) {
    case 'risk_on': return 'text-green-500';
    case 'risk_off': return 'text-red-500';
    case 'neutral': return 'text-yellow-500';
  }
}

function getCommodityStateColorClass(state: CommodityState): string {
  switch (state) {
    case 'inflationary_boom': return 'text-green-500';
    case 'supply_shock': return 'text-blue-500';
    case 'late_cycle': return 'text-yellow-500';
    case 'deflationary': return 'text-red-500';
    default: return 'text-muted-foreground';
  }
}

export function MarketRegimeBadges() {
  // Fetch all 3 regimes
  const { data: stockRegime, isLoading: stockLoading } = useQuery({
    queryKey: ['stock-regime'],
    queryFn: calculateStockRegime,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
  });

  const { data: cryptoRegime, isLoading: cryptoLoading } = useQuery({
    queryKey: ['crypto-regime'],
    queryFn: calculateCryptoRisk,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });

  const { data: commodityRegime, isLoading: commodityLoading } = useQuery({
    queryKey: ['commodity-regime'],
    queryFn: calculateCommodityRegime,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });

  return (
    <div className="p-4 bg-card/50 border border-border/50 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Market Regime
        </h3>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {/* Stocks Badge */}
        <RegimeBadge
          icon="🏛️"
          label="Stocks"
          state={stockRegime?.state || 'neutral'}
          stateLabel={stockRegime ? getStockStateLabel(stockRegime.state) : 'Loading...'}
          reasons={stockRegime?.reasons || ['Calculating...']}
          colorClass={stockRegime ? getStockStateColor(stockRegime.state) : 'text-muted-foreground'}
          isLoading={stockLoading}
        />

        {/* Crypto Badge */}
        <RegimeBadge
          icon="₿"
          label="Crypto"
          state={cryptoRegime?.state || 'neutral'}
          stateLabel={cryptoRegime ? getCryptoStateLabel(cryptoRegime.state) : 'Loading...'}
          reasons={cryptoRegime?.reasons || ['Calculating...']}
          colorClass={cryptoRegime ? getCryptoStateColor(cryptoRegime.state) : 'text-muted-foreground'}
          isLoading={cryptoLoading}
        />

        {/* Commodities Badge */}
        <RegimeBadge
          icon="⛏️"
          label="Commodities"
          state={commodityRegime?.state || 'late_cycle'}
          stateLabel={commodityRegime ? getCommodityStateLabel(commodityRegime.state) : 'Loading...'}
          reasons={commodityRegime?.drivers || ['Calculating...']}
          colorClass={commodityRegime ? getCommodityStateColorClass(commodityRegime.state) : 'text-muted-foreground'}
          isLoading={commodityLoading}
        />
      </div>
    </div>
  );
}
