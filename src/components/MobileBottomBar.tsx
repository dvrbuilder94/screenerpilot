import { Bot, Coins, LayoutDashboard, Rocket } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const items = [
  { title: "Home", url: "/", icon: LayoutDashboard },
  { title: "Economy", url: "/economy", icon: Coins },
  { title: "Agent", url: "/agent", icon: Bot },
  { title: "Launch", url: "/launchpad", icon: Rocket },
];

export function MobileBottomBar() {
  const location = useLocation();
  const active = (url: string) => url === "/" ? location.pathname === "/" : location.pathname.startsWith(url);
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="grid grid-cols-4">
        {items.map((item) => (
          <Link key={item.url} to={item.url}
            className={cn("flex flex-col items-center justify-center gap-1 py-2.5 text-[9px] font-medium",
              active(item.url) ? "text-foreground" : "text-muted-foreground")}>
            <item.icon className={cn("h-[18px] w-[18px]", active(item.url) && "text-primary")} />
            <span>{item.title}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
