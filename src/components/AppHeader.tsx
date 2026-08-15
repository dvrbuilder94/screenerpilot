import { LineChart, Search, LogOut, User, Star, Home, Flame, Database, Crosshair } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { BILLING_ENABLED } from "@/lib/billing";
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

type NavItem = { title: string; url: string; icon: typeof LineChart };

const NAV: NavItem[] = [
  { title: "Home", url: "/home", icon: Home },
  { title: "Setups", url: "/setups", icon: Crosshair },
  { title: "Markets", url: "/markets", icon: LineChart },
  { title: "RWA", url: "/rwa", icon: Database },
  { title: "Search", url: "/search", icon: Search },
  { title: "Squeeze", url: "/squeeze", icon: Flame },
  { title: "Watchlist", url: "/watchlist", icon: Star },
];

export const AppHeader = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isActive, isTrialing } = useSubscription();

  const isItemActive = (url: string) => location.pathname.startsWith(url);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-5 gap-3 max-w-full">
        <Link to={user ? "/home" : "/"} className="flex-shrink-0 min-w-0">
          <Logo />
        </Link>

        <nav className="hidden lg:flex items-center gap-1 flex-1 ml-4">
          {NAV.map((item) => {
            const active = isItemActive(item.url);
            return (
              <Button
                key={item.url}
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  "h-9 px-3 text-[13px] font-medium rounded-md gap-1.5",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )}
              >
                <Link to={item.url} className="flex items-center">
                  <item.icon className="w-3.5 h-3.5" />
                  {item.title}
                </Link>
              </Button>
            );
          })}
        </nav>

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
                  {BILLING_ENABLED && !isActive && (
                    <DropdownMenuItem asChild>
                      <Link to="/pricing">Upgrade to Pro</Link>
                    </DropdownMenuItem>
                  )}
                  {BILLING_ENABLED && (
                    <DropdownMenuItem asChild>
                      <Link to="/pricing">Billing & plan</Link>
                    </DropdownMenuItem>
                  )}
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
