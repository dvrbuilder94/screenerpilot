import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RefreshCw } from "lucide-react";
import { Symbol, Interval, AssetType, GroupKey, getSymbolsByType, getPresets } from "@/lib/binanceApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { LanguageToggle } from "./LanguageToggle";

interface DashboardHeaderProps {
  symbol: Symbol | null;
  assetType: AssetType;
  selectedGroup: GroupKey | null;
  macroInterval: Interval;
  microInterval: Interval;
  autoRefresh: boolean;
  isLoading: boolean;
  onSymbolChange: (symbol: Symbol) => void;
  onAssetTypeChange: (type: AssetType) => void;
  onGroupChange: (group: GroupKey | null) => void;
  onMacroIntervalChange: (interval: Interval) => void;
  onMicroIntervalChange: (interval: Interval) => void;
  onAutoRefreshChange: (enabled: boolean) => void;
  onRefresh: () => void;
}

export default function DashboardHeader({
  symbol,
  assetType,
  selectedGroup,
  macroInterval,
  microInterval,
  autoRefresh,
  isLoading,
  onSymbolChange,
  onAssetTypeChange,
  onGroupChange,
  onMacroIntervalChange,
  onMicroIntervalChange,
  onAutoRefreshChange,
  onRefresh,
}: DashboardHeaderProps) {
  const { language } = useLanguage();
  const t = translations[language];
  const presets = getPresets();
  const symbols = getSymbolsByType(assetType);
  
  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-4 shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-center gap-4">
          <LanguageToggle />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Asset Type selector */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">{t.assetType}</Label>
            <Select value={assetType} onValueChange={(v) => onAssetTypeChange(v as AssetType)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="crypto">{t.crypto}</SelectItem>
                <SelectItem value="stock">Stocks</SelectItem>
                <SelectItem value="index">{language === 'es' ? 'Índices' : 'Indices'}</SelectItem>
                <SelectItem value="etf">ETFs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Group selector (only for stocks) */}
          {assetType === 'stock' && (
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">{language === 'es' ? 'Grupo' : 'Group'}</Label>
              <Select 
                value={selectedGroup || "none"} 
                onValueChange={(v) => onGroupChange(v === "none" ? null : v as GroupKey)}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{language === 'es' ? 'Símbolo individual' : 'Individual Symbol'}</SelectItem>
                  <SelectItem value="magnificent_seven">Magnificent Seven</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Symbol selector (only when no group selected) */}
          {!selectedGroup && (
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">{language === 'es' ? 'Símbolo' : 'Symbol'}</Label>
              <Select value={symbol || ""} onValueChange={(v) => onSymbolChange(v as Symbol)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {symbols.map((sym) => (
                    <SelectItem key={sym} value={sym}>
                      {sym}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Macro timeframe */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">{t.macro} ({t.trend})</Label>
            <Select value={macroInterval} onValueChange={(v) => onMacroIntervalChange(v as Interval)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">{t['1d']}</SelectItem>
                <SelectItem value="1w">{t['1w']}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Micro timeframe */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">{language === 'es' ? 'Micro (Operativa)' : 'Micro (Execution)'}</Label>
            <Select value={microInterval} onValueChange={(v) => onMicroIntervalChange(v as Interval)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">{t['1h']}</SelectItem>
                <SelectItem value="4h">{t['4h']}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Auto refresh */}
          <div className="flex items-center gap-2 pt-5">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={onAutoRefreshChange}
            />
            <Label htmlFor="auto-refresh" className="text-sm cursor-pointer">
              {t.autoRefresh} 60s
            </Label>
          </div>

          {/* Refresh button */}
          <Button
            onClick={onRefresh}
            disabled={isLoading}
            className="mt-5"
            size="lg"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {t.refresh}
          </Button>
        </div>
      </div>
    </div>
  );
}
