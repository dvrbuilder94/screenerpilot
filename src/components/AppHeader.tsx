import { LineChart, Layers, GitCompareArrows, Star, Menu, TrendingUp, Search } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { AccountDropdown } from "./AccountDropdown";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Markets", url: "/markets", icon: LineChart },
  { title: "Macro", url: "/macro", icon: Layers },
  { title: "Ratios", url: "/ratios", icon: GitCompareArrows },
  { title: "Stock Intelligence", url: "/stock-intelligence", icon: Search },
  { title: "Watchlist", url: "/profile", icon: Star },
];

export const AppHeader = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-5 gap-4">
        {/* Logo + tagline */}
        <Link to="/" className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/15 border border-primary/30">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-[15px] font-semibold tracking-tight text-foreground">
              ScreenerPilot
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground mt-0.5">
              Macro Intelligence Terminal
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 ml-4">
          {navItems.map((item) => {
            const isActive =
              item.url === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.url);
            return (
              <Button
                key={item.url}
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  "h-9 px-3 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-md",
                  isActive && "bg-secondary text-foreground"
                )}
              >
                <Link to={item.url}>
                  <item.icon className="w-3.5 h-3.5 mr-2" />
                  {item.title}
                </Link>
              </Button>
            );
          })}
        </nav>

        {/* Right: Account + mobile trigger */}
        <div className="flex items-center gap-2 ml-auto flex-shrink-0">
          <AccountDropdown />

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-background border-border">
              <div className="mt-2 mb-6">
                <div className="text-[15px] font-semibold text-foreground">ScreenerPilot</div>
                <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mt-1">
                  Macro Intelligence Terminal
                </div>
              </div>
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const isActive = item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url);
                  return (
                    <Button
                      key={item.url}
                      variant={isActive ? "secondary" : "ghost"}
                      className="justify-start h-10"
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
