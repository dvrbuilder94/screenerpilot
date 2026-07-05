import { LineChart, Layers, GitCompareArrows, Search, LogOut, User, Brain, Star, ChevronDown, Flame, Droplets } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { NotificationBell } from "./NotificationBell";
import { Logo } from "./Logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

type NavItem = {
  title: string;
  url: string;
  icon: typeof LineChart;
  badge?: string;
  desc?: string;
};

// Grouped navigation for a "pro terminal" feel.
const marketsGroup: NavItem[] = [
  { title: "Markets", url: "/markets", icon: LineChart, desc: "Sectors, factors, yields, FX" },
  { title: "Macro", url: "/macro", icon: Layers, desc: "Regime, indicators, calendar" },
  { title: "Commodities", url: "/commodities", icon: Droplets, desc: "Energy, metals, softs" },
  { title: "Ratios", url: "/ratios", icon: GitCompareArrows, desc: "Cross-asset relative strength" },
];

const intelligenceGroup: NavItem[] = [
  { title: "Stock Intelligence", url: "/stock-intelligence", icon: Search, desc: "Deep dive on any ticker" },
  { title: "Committee", url: "/committee", icon: Brain, badge: "Beta", desc: "Multi-agent AI debate" },
  { title: "Squeeze Radar", url: "/squeeze-radar", icon: Flame, desc: "Short squeeze setups" },
];

export const AppHeader = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isActive, isTrialing } = useSubscription();

  const isItemActive = (url: string) =>
    url === "/" ? location.pathname === "/" : location.pathname.startsWith(url);

  const anyActive = (items: NavItem[]) => items.some((i) => isItemActive(i.url));

  const GroupMenu = ({ label, items }: { label: string; items: NavItem[] }) => {
    const active = anyActive(items);
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-9 px-3 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-md gap-1",
              active && "text-foreground"
            )}
          >
            {label}
            <ChevronDown className="w-3 h-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {items.map((item) => (
            <DropdownMenuItem key={item.url} asChild>
              <Link to={item.url} className="flex items-start gap-2.5 py-2">
                <item.icon className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.title}</span>
                    {item.badge && (
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-primary border border-primary/40 rounded px-1 py-px">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {item.desc && <div className="text-[11px] text-muted-foreground">{item.desc}</div>}
                </div>
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const WatchlistLink = () => {
    const active = isItemActive("/watchlist");
    return (
      <Button
        variant="ghost"
        size="sm"
        asChild
        className={cn(
          "h-9 px-3 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-md",
          active && "bg-secondary text-foreground"
        )}
      >
        <Link to="/watchlist" className="flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5" />
          Watchlist
        </Link>
      </Button>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-5 gap-2 sm:gap-3 max-w-full">
        <Link to="/" className="flex-shrink-0 min-w-0">
          <Logo />
        </Link>

        {/* Desktop grouped nav (hidden on mobile — mobile uses bottom bar) */}
        <nav className="hidden lg:flex items-center gap-1 flex-1 ml-4">
          <GroupMenu label="Markets" items={marketsGroup} />
          <GroupMenu label="Intelligence" items={intelligenceGroup} />
          {user && <WatchlistLink />}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-auto">
          <NotificationBell />
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
                  <DropdownMenuItem asChild>
                    <Link to="/watchlist">
                      <Star className="h-3.5 w-3.5 mr-2" /> My Watchlist
                    </Link>
                  </DropdownMenuItem>
                  {!isActive && (
                    <DropdownMenuItem asChild>
                      <Link to="/pricing">Upgrade to Pro</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/pricing">Billing & plan</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings">Settings</Link>
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
              <Button asChild size="sm" variant="ghost" className="h-9 text-[13px] px-3">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="h-9 text-[13px] px-3">
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
