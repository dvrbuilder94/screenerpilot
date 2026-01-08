import { TrendingUp, Search } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { AccountDropdown } from "./AccountDropdown";
import { SidebarTrigger } from "./ui/sidebar";
import GamificationBadge from "./GamificationBadge";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  assetCategory?: string;
  onCategoryChange?: (category: string) => void;
  showAssetFilters?: boolean;
}

const assetCategories = [
  { value: "ALL", label: "All" },
  { value: "stock", label: "Stocks" },
  { value: "crypto", label: "Crypto" },
  { value: "etf", label: "ETFs" },
  { value: "index", label: "Indices" },
  { value: "commodity", label: "Commodities" },
];

export const AppHeader = ({
  searchQuery = "",
  onSearchChange,
  assetCategory = "ALL",
  onCategoryChange,
  showAssetFilters = false,
}: AppHeaderProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const isDashboard = location.pathname === "/";

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-card/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 gap-4">
        {/* Left section: Sidebar trigger + Logo */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <SidebarTrigger className="h-9 w-9" />
          <Link to="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary shadow-sm">
              <TrendingUp className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="hidden md:block text-lg font-semibold text-foreground">
              ScreenerPilot
            </h1>
          </Link>
        </div>

        {/* Center section: Search + Asset Tabs (only on Dashboard) */}
        {isDashboard && showAssetFilters && (
          <div className="flex-1 flex items-center justify-center gap-6 max-w-3xl">
            {/* Global Search */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="pl-9 h-9 bg-muted/50 border-border/50 rounded-lg"
              />
            </div>

            {/* Asset Class Tabs */}
            <nav className="hidden lg:flex items-center gap-1">
              {assetCategories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => onCategoryChange?.(cat.value)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                    assetCategory === cat.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Right section: Gamification + Account */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {user && <GamificationBadge />}
          <AccountDropdown />
        </div>
      </div>
    </header>
  );
};
