import { TrendingUp, BarChart3 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { AccountDropdown } from "./AccountDropdown";
import { Button } from "./ui/button";

export const AppHeader = () => {
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo / Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ScreenerPilot
            </h1>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-2">
            <Button
              variant={location.pathname === "/" ? "default" : "ghost"}
              size="sm"
              asChild
            >
              <Link to="/">Dashboard</Link>
            </Button>
            <Button
              variant={location.pathname === "/crypto-macro" ? "default" : "ghost"}
              size="sm"
              asChild
            >
              <Link to="/crypto-macro" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Crypto Macro
              </Link>
            </Button>
          </nav>
        </div>

        {/* Account Module */}
        <AccountDropdown />
      </div>
    </header>
  );
};
