import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FilterOptions } from "@/types/trading";
import { Filter } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
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
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <h3 className="text-lg font-bold">{t.filters}</h3>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">{activeFiltersCount}</Badge>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Trend Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block">{t.trend}</label>
          <Select
            value={filters.trend || 'ALL'}
            onValueChange={(value) => onFiltersChange({ ...filters, trend: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t.allTrends}</SelectItem>
              <SelectItem value="BULLISH">📈 {t.bullish}</SelectItem>
              <SelectItem value="BEARISH">📉 {t.bearish}</SelectItem>
              <SelectItem value="NEUTRAL">➡️ {t.neutral}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Signal Type Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block">{t.signalType}</label>
          <Select
            value={filters.signalType || 'ALL'}
            onValueChange={(value) => onFiltersChange({ ...filters, signalType: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t.allSignals}</SelectItem>
              <SelectItem value="STRONG_BUY">🚀 {t.strongBuy}</SelectItem>
              <SelectItem value="BUY">📈 {t.buy}</SelectItem>
              <SelectItem value="HOLD">➡️ {t.hold}</SelectItem>
              <SelectItem value="SELL">📉 {t.sell}</SelectItem>
              <SelectItem value="STRONG_SELL">⚠️ {t.strongSell}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Asset Type Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block">{t.assetTypeFilter}</label>
          <Select
            value={filters.assetType || 'ALL'}
            onValueChange={(value) => onFiltersChange({ ...filters, assetType: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t.allAssets}</SelectItem>
              <SelectItem value="crypto">{t.cryptocurrencies}</SelectItem>
              <SelectItem value="stock">{t.stocks}</SelectItem>
              <SelectItem value="index">{t.indices}</SelectItem>
              <SelectItem value="etf">{t.etfs}</SelectItem>
              <SelectItem value="commodity">{t.commodities}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Min Confidence Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">{t.minConfidence}</label>
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
