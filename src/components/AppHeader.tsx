import { Activity, Bot, Coins, LayoutDashboard, Rocket } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

const NAV = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
  { title: "Economy", url: "/economy", icon: Coins },
  { title: "Agent", url: "/agent", icon: Bot },
  { title: "Launchpad", url: "/launchpad", icon: Rocket },
];

export const AppHeader = () => {
  const location = useLocation();
  const active = (url: string) => url === "/" ? location.pathname === "/" : location.pathname.startsWith(url);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1500px] items-center justify-between gap-3 px-3 sm:h-16 sm:px-6">
        <Link to="/" className="flex-shrink-0"><Logo /></Link>
        <nav className="hidden lg:flex items-center gap-1">
          {NAV.map((item) => (
            <Button key={item.url} variant="ghost" size="sm" asChild
              className={cn("h-9 gap-1.5 px-3 text-[13px]", active(item.url) ? "bg-secondary text-foreground" : "text-muted-foreground")}>
              <Link to={item.url}><item.icon className="h-3.5 w-3.5" />{item.title}</Link>
            </Button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="hidden sm:inline-flex font-mono text-[10px]">ARC · GENESIS</Badge>
          <Button asChild size="sm" className="h-9 gap-1.5">
            <Link to="/launchpad"><Activity className="h-3.5 w-3.5" />Launch</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};
