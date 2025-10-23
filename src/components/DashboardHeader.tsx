import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RefreshCw } from "lucide-react";
import { Symbol, Interval, AssetType, GroupKey, getSymbolsByType, getPresets } from "@/lib/binanceApi";

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
  const presets = getPresets();
  const symbols = getSymbolsByType(assetType);
  return (
    <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Crypto Multi-Timeframe Dashboard
          </h1>
          <p className="text-muted-foreground">
            Análisis técnico avanzado con indicadores múltiples
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Asset Type selector */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Tipo</Label>
            <Select value={assetType} onValueChange={(v) => onAssetTypeChange(v as AssetType)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="crypto">Crypto</SelectItem>
                <SelectItem value="stock">Stocks</SelectItem>
                <SelectItem value="index">Índices</SelectItem>
                <SelectItem value="etf">ETFs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Group selector (only for stocks) */}
          {assetType === 'stock' && (
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Grupo</Label>
              <Select 
                value={selectedGroup || "none"} 
                onValueChange={(v) => onGroupChange(v === "none" ? null : v as GroupKey)}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Símbolo individual</SelectItem>
                  <SelectItem value="magnificent_seven">Magnificent Seven</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Symbol selector (only when no group selected) */}
          {!selectedGroup && (
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Símbolo</Label>
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
            <Label className="text-xs text-muted-foreground">Macro (Tendencia)</Label>
            <Select value={macroInterval} onValueChange={(v) => onMacroIntervalChange(v as Interval)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">1 Día</SelectItem>
                <SelectItem value="1w">1 Semana</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Micro timeframe */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Micro (Operativa)</Label>
            <Select value={microInterval} onValueChange={(v) => onMicroIntervalChange(v as Interval)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1 Hora</SelectItem>
                <SelectItem value="4h">4 Horas</SelectItem>
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
              Auto 60s
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
            Actualizar
          </Button>
        </div>
      </div>
    </div>
  );
}
