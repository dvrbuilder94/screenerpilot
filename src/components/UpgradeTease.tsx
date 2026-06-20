import { Link } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UpgradeTeaseProps {
  hiddenCount: number;
  label?: string;
}

export function UpgradeTease({ hiddenCount, label = "assets" }: UpgradeTeaseProps) {
  if (hiddenCount <= 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Lock className="w-3.5 h-3.5 flex-shrink-0" />
        +{hiddenCount} more {label} — unlock the full terminal
      </div>
      <Button asChild size="sm" variant="outline">
        <Link to="/pricing">
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          Start free trial
        </Link>
      </Button>
    </div>
  );
}
