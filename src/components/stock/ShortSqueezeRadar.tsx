import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Loader2, RefreshCw, Info, AlertCircle, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Candidate {
  symbol: string;
  companyName: string;
  price: number;
  marketCap: number | null;
  marketCapLabel: string;
  squeezeScore: number;
  volumeRatio: number;
  drawdownFrom52w: number;
  change5d: number;
  rsi: number;
  bbWidth: number;
  components: {
    volume: number;
    compression: number;
    rsiRecovery: number;
    drawdown: number;
    sizeBias: number;
    momentum: number;
  };
}

interface ScanResult {
  scannedAt: string;
  scanned: number;
  valid: number;
  candidates: Candidate[];
}

function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 75
      ? "bg-red-500/15 text-red-400 border-red-500/30"
      : score >= 60
      ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
      : score >= 45
      ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
      : "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-semibold tabular-nums ${tone}`}>
      {score}
    </span>
  );
}

function PctCell({ value }: { value: number }) {
  const tone = value > 0 ? "text-emerald-400" : value < 0 ? "text-red-400" : "text-muted-foreground";
  const sign = value > 0 ? "+" : "";
  return <span className={`font-medium tabular-nums ${tone}`}>{sign}{value.toFixed(1)}%</span>;
}

interface Props {
  onAnalyze?: (symbol: string) => void;
}

export default function ShortSqueezeRadar({ onAnalyze }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const runScan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res, error: fnError } = await supabase.functions.invoke("squeeze-radar", {
        body: {},
      });
      if (fnError) throw new Error(fnError.message || "Scan failed");
      if (res?.error) throw new Error(res.error);
      setData(res as ScanResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run scan");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header / control */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Short Squeeze Radar</h2>
              </div>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Scans ~150 small/mid cap US tickers and ranks them by a 0-100 Squeeze Score built
                from free technical heuristics: volume spikes, Bollinger compression, RSI recovery,
                drawdown depth, market cap bias, and short-term momentum.
              </p>
            </div>
            <Button onClick={runScan} disabled={loading} className="px-5 self-start">
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Scanning...</>
              ) : (
                <><RefreshCw className="h-4 w-4 mr-2" /> {data ? "Rescan" : "Scan Now"}</>
              )}
            </Button>
          </div>
          {data && (
            <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[10px]">{data.valid} / {data.scanned} valid</Badge>
              <span>·</span>
              <span>Last scan: {new Date(data.scannedAt).toLocaleTimeString()}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
              <div>
                <p className="font-medium text-red-400">Scan Failed</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty */}
      {!data && !error && !loading && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Flame className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg font-medium text-muted-foreground">No scan run yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Press "Scan Now" to detect potential short squeeze candidates.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {data && data.candidates.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Top {data.candidates.length} Candidates</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Symbol</TableHead>
                    <TableHead className="hidden md:table-cell">Company</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Vol×</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Drawdown</TableHead>
                    <TableHead className="text-right hidden md:table-cell">5d %</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">RSI</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">Mkt Cap</TableHead>
                    <TableHead className="w-[90px] text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.candidates.map((c) => {
                    const isOpen = expanded === c.symbol;
                    return (
                      <>
                        <TableRow
                          key={c.symbol}
                          className="cursor-pointer hover:bg-muted/40"
                          onClick={() => setExpanded(isOpen ? null : c.symbol)}
                        >
                          <TableCell className="font-bold">{c.symbol}</TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground text-sm truncate max-w-[200px]">
                            {c.companyName}
                          </TableCell>
                          <TableCell className="text-right"><ScoreBadge score={c.squeezeScore} /></TableCell>
                          <TableCell className="text-right font-medium tabular-nums">${c.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right tabular-nums hidden sm:table-cell">
                            <span className={c.volumeRatio >= 2 ? "text-amber-400 font-medium" : ""}>
                              {c.volumeRatio.toFixed(1)}x
                            </span>
                          </TableCell>
                          <TableCell className="text-right hidden sm:table-cell"><PctCell value={c.drawdownFrom52w} /></TableCell>
                          <TableCell className="text-right hidden md:table-cell"><PctCell value={c.change5d} /></TableCell>
                          <TableCell className="text-right tabular-nums hidden lg:table-cell">{c.rsi}</TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground hidden lg:table-cell">{c.marketCapLabel}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => { e.stopPropagation(); onAnalyze?.(c.symbol); }}
                              className="h-7 px-2 text-xs"
                            >
                              Analyze
                              <ChevronRight className="h-3 w-3 ml-0.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        {isOpen && (
                          <TableRow key={`${c.symbol}-detail`} className="bg-muted/20 hover:bg-muted/20">
                            <TableCell colSpan={10} className="py-3">
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                                {[
                                  { k: "Volume Spike", v: c.components.volume, w: "25%" },
                                  { k: "Compression/Breakout", v: c.components.compression, w: "20%" },
                                  { k: "RSI Recovery", v: c.components.rsiRecovery, w: "15%" },
                                  { k: "Drawdown Setup", v: c.components.drawdown, w: "15%" },
                                  { k: "Size Bias", v: c.components.sizeBias, w: "15%" },
                                  { k: "Momentum 5d", v: c.components.momentum, w: "10%" },
                                ].map((x) => (
                                  <div key={x.k} className="rounded-md border border-border bg-background/50 px-2.5 py-2">
                                    <div className="flex items-center justify-between text-muted-foreground">
                                      <span>{x.k}</span>
                                      <span className="text-[10px] opacity-60">{x.w}</span>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2">
                                      <div className="flex-1 h-1.5 bg-muted rounded overflow-hidden">
                                        <div
                                          className="h-full bg-primary"
                                          style={{ width: `${x.v}%` }}
                                        />
                                      </div>
                                      <span className="font-semibold tabular-nums w-7 text-right">{x.v}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <p>
          The Squeeze Score is a <strong>technical heuristic</strong> based on price, volume, and
          volatility patterns. It does <strong>not</strong> use real short interest data (Days-to-Cover,
          % Float Shorted). High score ≠ guaranteed squeeze. Not financial advice.
        </p>
      </div>
    </div>
  );
}
