import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Loader2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Candidate {
  symbol: string;
  companyName: string;
  price: number;
  squeezeScore: number;
  change5d: number;
}

interface Props {
  onPick: (symbol: string) => void;
}

export function TopPicksStrip({ onPick }: Props) {
  const [picks, setPicks] = useState<Candidate[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.functions.invoke("squeeze-radar", { body: {} });
      if (cancelled) return;
      if (!error && data?.candidates) {
        setPicks(
          [...data.candidates]
            .sort((a: Candidate, b: Candidate) => b.squeezeScore - a.squeezeScore)
            .slice(0, 5)
        );
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loading && (!picks || picks.length === 0)) return null;

  return (
    <div className="fin-card p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Top Picks Today</h2>
        <span className="text-[11px] text-muted-foreground ml-auto">Squeeze Score · highest first</span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Scanning for setups…
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto">
          {picks!.map((p) => (
            <button
              key={p.symbol}
              onClick={() => onPick(p.symbol)}
              className="flex-shrink-0 flex items-center gap-3 rounded-lg border border-border bg-background/40 px-3 py-2 hover:border-primary/40 hover:bg-secondary/40 transition-colors text-left"
            >
              <div>
                <div className="font-bold text-sm text-foreground">{p.symbol}</div>
                <div
                  className={cn(
                    "text-[11px] tabular-nums",
                    p.change5d >= 0 ? "text-emerald-500" : "text-red-500"
                  )}
                >
                  {p.change5d >= 0 ? "+" : ""}
                  {p.change5d.toFixed(1)}% · 5d
                </div>
              </div>
              <span className="inline-flex items-center justify-center rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary tabular-nums">
                {p.squeezeScore}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
