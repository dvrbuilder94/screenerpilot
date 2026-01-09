import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Gem } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface HiddenGem {
  symbol: string;
  company_name: string | null;
  sector: string | null;
  market_cap: number | null;
  hidden_gem_score: number;
  fundamentals_score: number;
  valuation_score: number;
  balance_sheet_score: number;
  price_structure_score: number;
  market_neglect_score: number;
  explanation: string;
  rank: number;
  calculated_at: string;
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70
    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    : score >= 50
    ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
    : "bg-slate-500/20 text-slate-400 border-slate-500/30";

  return (
    <span className={`inline-flex items-center justify-center w-12 h-6 text-sm font-medium rounded border ${color}`}>
      {Math.round(score)}
    </span>
  );
}

function TableSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export default function HiddenGems() {
  const [gems, setGems] = useState<HiddenGem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const fetchGems = async () => {
      const { data, error } = await supabase
        .from("hidden_gems_scores")
        .select("*")
        .order("rank", { ascending: true })
        .limit(20);

      if (!error && data) {
        setGems(data);
        if (data.length > 0) {
          setLastUpdated(data[0].calculated_at);
        }
      }
      setLoading(false);
    };

    fetchGems();
  }, []);

  const formatMarketCap = (cap: number | null) => {
    if (!cap) return "-";
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`;
    return `$${(cap / 1e6).toFixed(0)}M`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header with BETA Badge */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Gem className="h-6 w-6 text-amber-500" />
          <h1 className="text-2xl font-semibold text-foreground">Hidden Gems</h1>
          {/* BETA Badge - Pure CSS, no JS tooltips */}
          <span 
            className="px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30 cursor-help"
            title="Experimental ranking based on improving fundamentals and market neglect."
          >
            BETA
          </span>
        </div>
        <p className="text-muted-foreground mt-2 text-sm max-w-2xl">
          Small and mid-cap stocks with improving fundamentals that haven't yet attracted market attention.
        </p>
        {lastUpdated && (
          <p className="text-xs text-muted-foreground mt-1">
            Data updated {formatDate(lastUpdated)}
          </p>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Top 20 Hidden Gems</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton />
          ) : gems.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Gem className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No data available yet</p>
              <p className="text-sm mt-1">Hidden Gems are calculated daily. Check back soon.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="hidden sm:table-cell">Sector</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Mkt Cap</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="hidden lg:table-cell">Why It's a Gem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gems.map((gem) => (
                  <TableRow key={gem.symbol} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-muted-foreground">
                      {gem.rank}
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium text-foreground">{gem.symbol}</span>
                        {gem.company_name && (
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {gem.company_name}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {gem.sector && (
                        <Badge variant="outline" className="text-xs font-normal">
                          {gem.sector}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm hidden md:table-cell">
                      {formatMarketCap(gem.market_cap)}
                    </TableCell>
                    <TableCell className="text-center">
                      <ScoreBadge score={gem.hidden_gem_score} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden lg:table-cell max-w-[300px]">
                      {gem.explanation}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Methodology Note */}
      <p className="text-xs text-muted-foreground mt-4 max-w-2xl">
        Scores are based on sequential (QoQ) improvements in revenue, margins, and cash flow, 
        combined with relative valuation compression and market neglect indicators. 
        This is not financial advice.
      </p>
    </div>
  );
}
