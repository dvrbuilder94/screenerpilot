import { TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { AccountDropdown } from "./AccountDropdown";
import { SidebarTrigger } from "./ui/sidebar";
import GamificationBadge from "./GamificationBadge";
import { useAuth } from "@/contexts/AuthContext";

export const AppHeader = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Left section: Sidebar trigger + Logo */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="h-9 w-9" />
          <Link to="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="hidden sm:block text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ScreenerPilot
            </h1>
          </Link>
        </div>

        {/* Right section: Gamification + Account */}
        <div className="flex items-center gap-4">
          {useAuth().user && <GamificationBadge />}
          <AccountDropdown />
        </div>
      </div>
    </header>
  );
};
