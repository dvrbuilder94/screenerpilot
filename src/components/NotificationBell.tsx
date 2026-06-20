import { useEffect, useState } from "react";
import { Bell, TrendingUp, Flame } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { useMarketAlerts } from "@/hooks/useMarketAlerts";
import { cn } from "@/lib/utils";

const LAST_SEEN_KEY = "sp_alerts_last_seen";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export const NotificationBell = () => {
  const { data: alerts = [] } = useMarketAlerts();
  const [lastSeen, setLastSeen] = useState<string>(() => localStorage.getItem(LAST_SEEN_KEY) ?? "");
  const [open, setOpen] = useState(false);

  const unreadCount = alerts.filter((a) => !lastSeen || a.created_at > lastSeen).length;

  useEffect(() => {
    if (open && alerts.length > 0) {
      const newest = alerts[0].created_at;
      localStorage.setItem(LAST_SEEN_KEY, newest);
      setLastSeen(newest);
    }
  }, [open, alerts]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 flex items-center justify-center text-[10px] leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-3 py-2.5 border-b border-border/40">
          <h3 className="text-sm font-medium text-foreground">Alerts</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Regime changes & squeeze candidates</p>
        </div>
        <ScrollArea className="max-h-80">
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground px-3 py-6 text-center">No alerts yet.</p>
          ) : (
            <div className="divide-y divide-border/40">
              {alerts.map((a) => {
                const Icon = a.alert_type === "squeeze" ? Flame : TrendingUp;
                return (
                  <div key={a.id} className="px-3 py-2.5 flex items-start gap-2.5">
                    <Icon
                      className={cn(
                        "h-3.5 w-3.5 mt-0.5 flex-shrink-0",
                        a.severity === "warning" ? "text-amber-400" : "text-muted-foreground"
                      )}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground leading-snug">{a.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{a.message}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">{timeAgo(a.created_at)} ago</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
