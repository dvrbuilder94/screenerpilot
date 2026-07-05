import { Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useWatchlist } from "@/hooks/useWatchlist";
import { toast } from "sonner";

interface Props {
  symbol: string;
  assetType?: string;
  size?: "sm" | "md";
  className?: string;
}

export function WatchlistStar({ symbol, assetType = "stock", size = "sm", className }: Props) {
  const { has, toggle, isAuthed } = useWatchlist();
  const navigate = useNavigate();
  const active = has(symbol);
  const dim = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isAuthed) {
      toast.info("Sign in to build your watchlist");
      navigate("/login");
      return;
    }
    toggle(symbol, assetType);
  };

  return (
    <button
      onClick={onClick}
      aria-label={active ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
      className={cn(
        "inline-flex items-center justify-center rounded-md p-1 hover:bg-muted transition-colors",
        active ? "text-amber-400" : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      <Star className={cn(dim, active && "fill-current")} />
    </button>
  );
}
