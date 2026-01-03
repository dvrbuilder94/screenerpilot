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
      <TabsList className="w-full h-14 bg-muted/50 p-1 grid grid-cols-4 gap-1">
        <TabsTrigger 
          value="crypto" 
          className="flex items-center justify-center gap-2 h-full text-base font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          <Bitcoin className="h-5 w-5" />
          <span className="hidden sm:inline">Crypto</span>
        </TabsTrigger>
        <TabsTrigger 
          value="commodities" 
          className="flex items-center justify-center gap-2 h-full text-base font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          <Scale className="h-5 w-5" />
          <span className="hidden sm:inline">Commodities</span>
        </TabsTrigger>
        <TabsTrigger 
          value="stocks" 
          className="flex items-center justify-center gap-2 h-full text-base font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          <TrendingUp className="h-5 w-5" />
          <span className="hidden sm:inline">Stocks</span>
        </TabsTrigger>
        <TabsTrigger 
          value="fed" 
          className="flex items-center justify-center gap-2 h-full text-base font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          <Landmark className="h-5 w-5" />
          <span className="hidden sm:inline">Fed</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
