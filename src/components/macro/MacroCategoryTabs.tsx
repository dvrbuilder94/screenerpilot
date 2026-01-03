import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bitcoin, Scale, TrendingUp, Landmark } from "lucide-react";

export type MacroCategory = 'crypto' | 'commodities' | 'stocks' | 'fed';

interface MacroCategoryTabsProps {
  activeCategory: MacroCategory;
  onCategoryChange: (category: MacroCategory) => void;
}

export function MacroCategoryTabs({ activeCategory, onCategoryChange }: MacroCategoryTabsProps) {
  return (
    <Tabs value={activeCategory} onValueChange={(v) => onCategoryChange(v as MacroCategory)}>
      <TabsList className="grid w-full grid-cols-4 bg-muted/50">
        <TabsTrigger value="crypto" className="flex items-center gap-2">
          <Bitcoin className="h-4 w-4" />
          <span className="hidden sm:inline">Crypto</span>
        </TabsTrigger>
        <TabsTrigger value="commodities" className="flex items-center gap-2">
          <Scale className="h-4 w-4" />
          <span className="hidden sm:inline">Commodities</span>
        </TabsTrigger>
        <TabsTrigger value="stocks" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          <span className="hidden sm:inline">Stocks</span>
        </TabsTrigger>
        <TabsTrigger value="fed" className="flex items-center gap-2">
          <Landmark className="h-4 w-4" />
          <span className="hidden sm:inline">Fed & Economy</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
