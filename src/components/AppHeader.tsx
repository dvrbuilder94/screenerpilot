import { LineChart, Layers, GitCompareArrows, Search, LogOut, User, Brain, MoreHorizontal } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const LOGO_URL = "https://storage.googleapis.com/gpt-engineer-file-uploads/SwWQdnEgbuMrnR9f8RUe0qM0pTi1/uploads/1768527913536-WhatsApp Image 2026-01-15 at 11.30.09 AM.jpeg";

type NavItem = {
  title: string;
  url: string;
  icon: typeof LineChart;
  badge?: string;
};

// Primary items always visible; the rest collapse into "More" on small screens.
const primaryNav: NavItem[] = [
  { title: "Markets", url: "/markets", icon: LineChart },
  { title: "Macro", url: "/macro", icon: Layers },
  { title: "Committee", url: "/committee", icon: Brain, badge: "Beta" },
];

const secondaryNav: NavItem[] = [
  { title: "Ratios", url: "/ratios", icon: GitCompareArrows },
  { title: "Stock Intelligence", url: "/stock-intelligence", icon: Search },
];

const allNav: NavItem[] = [...primaryNav, ...secondaryNav];

export const AppHeader = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isActive, isTrialing } = useSubscription();

  const isItemActive = (url: string) =>
    url === "/" ? location.pathname === "/" : location.pathname.startsWith(url);

  const renderNavBtn = (item: NavItem, opts?: { compact?: boolean }) => {
    const active = isItemActive(item.url);
    return (
      <Button
        key={item.url}
        variant="ghost"
        size="sm"
        asChild
        className={cn(
          "h-9 px-2 sm:px-3 text-[12px] sm:text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-md",
          active && "bg-secondary text-foreground"
        )}
      >
        <Link to={item.url} className="flex items-center">
          <item.icon className="w-3.5 h-3.5 sm:mr-2" />
          <span className={cn("hidden sm:inline", opts?.compact && "lg:inline")}>{item.title}</span>
          {item.badge && (
            <span className="ml-1.5 hidden sm:inline-flex items-center text-[9px] font-semibold uppercase tracking-wider text-primary border border-primary/40 rounded px-1 py-px">
              {item.badge}
            </span>
          )}
        </Link>
      </Button>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-2 sm:px-5 gap-1 sm:gap-3 max-w-full overflow-hidden">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0 min-w-0">
          <img
            src={LOGO_URL}
            alt="ScreenerPilot logo"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-cover border border-primary/30"
          />
          <div className="hidden md:flex flex-col leading-none min-w-0">
            <span className="text-[15px] font-semibold tracking-tight text-foreground truncate">
              ScreenerPilot
            </span>
            <span className="hidden xl:block text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground mt-0.5 truncate">
              Macro Intelligence Terminal
            </span>
          </div>
        </Link>

        {/* Inline nav: primary always visible, secondary hidden behind More on < lg */}
        <nav className="flex items-center gap-0.5 sm:gap-1 flex-1 justify-center sm:justify-start sm:ml-2 min-w-0">
          {primaryNav.map((item) => renderNavBtn(item))}
          {/* Secondary visible from lg up */}
          <div className="hidden lg:flex items-center gap-1">
            {secondaryNav.map((item) => renderNavBtn(item))}
          </div>
          {/* More menu on < lg */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden h-9 px-2 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-md"
              >
                <MoreHorizontal className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Modules
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allNav.map((item) => (
                <DropdownMenuItem key={item.url} asChild>
                  <Link to={item.url} className="flex items-center">
                    <item.icon className="w-3.5 h-3.5 mr-2" />
                    <span>{item.title}</span>
                    {item.badge && (
                      <span className="ml-auto text-[9px] font-semibold uppercase tracking-wider text-primary border border-primary/40 rounded px-1 py-px">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Right: account */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {user ? (
            <>
              {isActive && (
                <span className="hidden md:inline-flex items-center text-[10px] uppercase tracking-[0.12em] text-muted-foreground border border-border rounded-full px-2 py-0.5">
                  {isTrialing ? "Trial" : "Pro"}
                </span>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {!isActive && (
                    <DropdownMenuItem asChild>
                      <Link to="/pricing">Upgrade to Pro</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/pricing">Billing & plan</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="h-3.5 w-3.5 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-1">
              <Button asChild size="sm" variant="ghost" className="h-9 text-[12px] sm:text-[13px] px-2 sm:px-3">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="h-9 text-[12px] sm:text-[13px] px-2 sm:px-3">
                <Link to="/signup">
                  <span className="hidden sm:inline">Start free trial</span>
                  <span className="sm:hidden">Start</span>
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
