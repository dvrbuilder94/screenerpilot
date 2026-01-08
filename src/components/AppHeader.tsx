import { TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { AccountDropdown } from "./AccountDropdown";
import { SidebarTrigger } from "./ui/sidebar";
import GamificationBadge from "./GamificationBadge";
import { useAuth } from "@/contexts/AuthContext";

export const AppHeader = () => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-card/95 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 gap-4">
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

        {/* Right section: Gamification + Account */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {user && <GamificationBadge />}
          <AccountDropdown />
        </div>
      </div>
    </header>
  );
};
