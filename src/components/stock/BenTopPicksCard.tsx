import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Sparkles, Crown, RefreshCw, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Pick {
  rank: number;
  symbol: string;
  company_name: string | null;
  price: number | null;
  squeeze_score: number | null;
  change_5d: number | null;
  conviction: "HIGH" | "MEDIUM";
  thesis: string;
}

interface LatestPicks {
  date: string;
  picks: Pick[];
}

async function fetchLatestPicks(): Promise<LatestPicks | null> {
  const { data, error } = await supabase
    .from("ben_top_picks")
    .select("pick_date,rank,symbol,company_name,price,squeeze_score,change_5d,conviction,thesis")
    .order("pick_date", { ascending: false })
    .order("rank", { ascending: true })
    .limit(3);
  if (error) throw error;
  if (!data || data.length === 0) return null;
  return { date: data[0].pick_date as string, picks: data as unknown as Pick[] };
}

const RANK_BADGE = [
  "bg-gradient-to-br from-amber-400 to-orange-500 text-white",
  "bg-gradient-to-br from-slate-300 to-slate-400 text-white",
  "bg-gradient-to-br from-orange-300 to-amber-600 text-white",
];

export function BenTopPicksCard() {
  const [generating, setGenerating] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["ben-top-picks-latest"],
    queryFn: fetchLatestPicks,
    staleTime: 10 * 60 * 1000,
  });

  const today = new Date().toISOString().split("T")[0];
  const isToday = data?.date === today;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { error } = await supabase.functions.invoke("generate-ben-top-picks");
      if (error) throw error;
      await refetch();
      toast.success("BEN's picks are in");
    } catch {
      toast.error("Could not generate picks");
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border p-5 mb-6">
        <Skeleton className="h-4 w-48 mb-4" />
        <Skeleton className="h-16 w-full mb-2" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="relative mb-6 rounded-xl">
      <div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-60 blur-md"
        style={{
          background:
            "linear-gradient(120deg, rgba(249,115,22,0.5), rgba(236,72,153,0.4), rgba(59,130,246,0.4))",
        }}
      />
      <div className="relative rounded-xl border border-orange-500/20 bg-card p-5 overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
            <h2 className="text-sm font-bold tracking-tight bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500 bg-clip-text text-transparent">
              BEN'S TOP PICKS
            </h2>
            <span className="inline-flex items-center rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-600">
              Pro
            </span>
          </div>
          {(!isToday || !data) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleGenerate}
              disabled={generating}
              className="h-7 px-2 text-[11px] gap-1.5"
            >
              <RefreshCw className={cn("h-3 w-3", generating && "animate-spin")} />
              {generating ? "Scanning…" : "Run BEN's scan"}
            </Button>
          )}
        </div>

        {!data ? (
          <p className="text-sm text-muted-foreground">
            BEN hasn't picked today's highest-conviction setups yet.
          </p>
        ) : (
          <div className="space-y-3">
            {data.picks.map((p, i) => (
              <Link
                key={p.symbol}
                to={`/squeeze-radar/${p.symbol}`}
                className="flex items-start gap-3 rounded-lg border border-border bg-background/40 p-3 hover:border-orange-500/40 hover:bg-secondary/30 transition-colors group"
              >
                <span
                  className={cn(
                    "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                    RANK_BADGE[i] ?? RANK_BADGE[2]
                  )}
                >
                  {i === 0 ? <Crown className="h-3.5 w-3.5" /> : `#${i + 1}`}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-foreground">{p.symbol}</span>
                    {p.company_name && (
                      <span className="text-xs text-muted-foreground truncate">{p.company_name}</span>
                    )}
                    <span
                      className={cn(
                        "ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        p.conviction === "HIGH"
                          ? "bg-red-500/15 text-red-600"
                          : "bg-amber-500/15 text-amber-600"
                      )}
                    >
                      <Sparkles className="h-2.5 w-2.5" /> {p.conviction}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">{p.thesis}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] tabular-nums">
                    {p.squeeze_score != null && (
                      <span className="font-semibold text-primary">Score {p.squeeze_score}</span>
                    )}
                    {p.price != null && <span className="text-muted-foreground">${p.price.toFixed(2)}</span>}
                    {p.change_5d != null && (
                      <span className={p.change_5d >= 0 ? "text-emerald-600" : "text-red-600"}>
                        {p.change_5d >= 0 ? "+" : ""}
                        {p.change_5d.toFixed(1)}% · 5d
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1.5 group-hover:text-orange-500 transition-colors" />
              </Link>
            ))}
          </div>
        )}

        <p className="text-[10px] text-muted-foreground mt-3">
          AI-curated technical setups · not investment advice · Gemini 2.5
        </p>
      </div>
    </div>
  );
}
