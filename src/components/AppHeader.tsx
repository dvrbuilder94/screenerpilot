import { TrendingUp, Menu, Home, Target, BarChart3, Scale } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { AccountDropdown } from "./AccountDropdown";
import GamificationBadge from "./GamificationBadge";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Track Record", url: "/track-record", icon: Target },
  { title: "Macro Analysis", url: "/macro", icon: BarChart3 },
  { title: "Commodities", url: "/commodities", icon: Scale },
];

export const AppHeader = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-card/95 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 gap-4">
        {/* Left section: Logo + Desktop Nav */}
        <div className="flex items-center gap-6 flex-shrink-0">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary shadow-sm">
              <TrendingUp className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="hidden sm:block text-lg font-semibold text-foreground">
              ScreenerPilot
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <Button
                  key={item.url}
                  variant="ghost"
                  size="sm"
                  asChild
                  className={cn(
                    "text-muted-foreground hover:text-foreground",
                    isActive && "bg-muted text-foreground font-medium"
                  )}
                >
                  <Link to={item.url}>
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.title}
                  </Link>
                </Button>
              );
            })}
          </nav>
        </div>

        {/* Right section: Gamification + Account + Mobile Menu */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {user && <GamificationBadge />}
          <AccountDropdown />

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <nav className="flex flex-col gap-2 mt-8">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <Button
                      key={item.url}
                      variant={isActive ? "secondary" : "ghost"}
                      className="justify-start"
                      asChild
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link to={item.url}>
                        <item.icon className="w-4 h-4 mr-3" />
                        {item.title}
                      </Link>
                    </Button>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
