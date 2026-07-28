import { LineChart, Search, Star, Home, Flame } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const items = [
  { title: "Home", url: "/home", icon: Home },
  { title: "Markets", url: "/markets", icon: LineChart },
  { title: "Search", url: "/search", icon: Search },
  { title: "Squeeze", url: "/squeeze", icon: Flame },
  { title: "Watchlist", url: "/watchlist", icon: Star },
];

export function MobileBottomBar() {
  const location = useLocation();
  const isActive = (url: string) => location.pathname.startsWith(url);

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-5">
        {items.map((it) => {
          const active = isActive(it.url);
          return (
            <Link
              key={it.url}
              to={it.url}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <it.icon className={cn("w-[19px] h-[19px]", active && "text-primary")} />
              <span className="tracking-wide">{it.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
