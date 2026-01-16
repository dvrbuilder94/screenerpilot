import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";

export const assetCategories = [
  { value: "stock", label: "Stocks" },
  { value: "crypto", label: "Crypto" },
  { value: "etf", label: "ETFs" },
  { value: "index", label: "Index" },
  { value: "commodity", label: "Commodities" },
  { value: "ALL", label: "All" },
];

export const regionFilters = [
  { value: "ALL", label: "All Regions" },
  { value: "usa", label: "USA" },
  { value: "latam", label: "LATAM" },
  { value: "asia", label: "Asia" },
];

interface CategoryFilterTabsProps {
  category: string;
  onCategoryChange: (category: string) => void;
  region?: string;
  onRegionChange?: (region: string) => void;
}

export function CategoryFilterTabs({
  category,
  onCategoryChange,
  region = "ALL",
  onRegionChange,
}: CategoryFilterTabsProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      {/* Desktop: Pill-style tabs (Coinglass style) */}
      <div className="hidden sm:flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
        {assetCategories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => onCategoryChange(cat.value)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-all",
              category === cat.value
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Mobile: Dropdown select for category */}
      <div className="sm:hidden">
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {assetCategories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Region Filter - only show when stocks are selected */}
      {onRegionChange && (category === "stock" || category === "ALL") && (
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground hidden sm:block" />
          <Select value={region} onValueChange={onRegionChange}>
            <SelectTrigger className="w-36 h-9 text-sm">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              {regionFilters.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
