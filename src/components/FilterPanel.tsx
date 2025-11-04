import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FilterOptions } from "@/types/trading";
import { Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  activeFiltersCount: number;
}

export default function FilterPanel({ filters, onFiltersChange, activeFiltersCount }: FilterPanelProps) {
  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <h3 className="text-lg font-bold">Filtros</h3>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">{activeFiltersCount}</Badge>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Trend Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block">Tendencia</label>
          <Select
            value={filters.trend || 'ALL'}
            onValueChange={(value) => onFiltersChange({ ...filters, trend: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas</SelectItem>
              <SelectItem value="BULLISH">📈 Alcista</SelectItem>
              <SelectItem value="BEARISH">📉 Bajista</SelectItem>
              <SelectItem value="NEUTRAL">➡️ Neutral</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Signal Type Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block">Tipo de Señal</label>
          <Select
            value={filters.signalType || 'ALL'}
            onValueChange={(value) => onFiltersChange({ ...filters, signalType: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas</SelectItem>
              <SelectItem value="STRONG_BUY">🚀 Strong Buy</SelectItem>
              <SelectItem value="BUY">📈 Buy</SelectItem>
              <SelectItem value="HOLD">➡️ Hold</SelectItem>
              <SelectItem value="SELL">📉 Sell</SelectItem>
              <SelectItem value="STRONG_SELL">⚠️ Strong Sell</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Asset Type Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block">Tipo de Activo</label>
          <Select
            value={filters.assetType || 'ALL'}
            onValueChange={(value) => onFiltersChange({ ...filters, assetType: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="crypto">Criptomonedas</SelectItem>
              <SelectItem value="stock">Acciones</SelectItem>
              <SelectItem value="index">Índices</SelectItem>
              <SelectItem value="etf">ETFs</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Min Confidence Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">Confianza Mínima</label>
            <span className="text-sm font-bold text-primary">{filters.minConfidence || 0}%</span>
          </div>
          <Slider
            value={[filters.minConfidence || 0]}
            onValueChange={(value) => onFiltersChange({ ...filters, minConfidence: value[0] })}
            min={0}
            max={100}
            step={5}
            className="w-full"
          />
        </div>
      </div>
    </Card>
  );
}
