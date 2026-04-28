import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Radar, AlertCircle, ExternalLink, Info } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Signals {
  marketCap: number | null;
  shortFloatPct: number | null;
  instOwnPct: number | null;
  quantOwnDeltaPct: number | null;
  quantHits: string[];
  earningsInDays: number | null;
  rsi: number | null;
}

interface Row {
  symbol: string;
  companyName?: string | null;
  price?: number | null;
  marketCap?: number | null;
  score: number;
  verdict: "Strong loader" | "Loader" | "Watch" | "Weak";
  signals: Signals;
  catalystNote: string;
  warnings: string[];
}

const fmtMcap = (n?: number | null) => {
  if (!n) return "—";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(0)}`;
};

const fmtPct = (n?: number | null, digits = 1) =>
  n === null || n === undefined ? "—" : `${n.toFixed(digits)}%`;

function VerdictPill({ v }: { v: Row["verdict"] }) {
  const map: Record<Row["verdict"], string> = {
    "Strong loader": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    Loader: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Watch: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    Weak: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge variant="outline" className={`text-[10px] uppercase ${map[v]}`}>
      {v}
    </Badge>
  );
}

interface Props {
  onAnalyze?: (symbol: string) => void;
}

export default function QuantLoadersRadar({ onAnalyze }: Props) {
  const [tickers, setTickers] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [meta, setMeta] = useState<{ scanned: number; generatedAt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runScan = async () => {
    setLoading(true);
    setError(null);
    setWarnings([]);
    try {
      const parsed = tickers
        .split(/[\s,]+/)
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean);

      const { data, error: fnError } = await supabase.functions.invoke(
        "quant-loaders-scan",
        { body: parsed.length ? { tickers: parsed } : { limit: 12 } }
      );

      if (fnError) throw new Error(fnError.message || "Scan failed");
      setRows((data?.results ?? []) as Row[]);
      setWarnings((data?.warnings ?? []) as string[]);
      setMeta(data?.meta ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Radar className="h-4 w-4 text-primary" />
            Quant Loaders v2.0 — Institutional Squeeze Radar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Detecta small/mid caps ($500M–$10B) con cargas de quants top
            (SIG, Citadel, Two Sigma, DE Shaw, Balyasny, Renaissance, Millennium, Jane Street, Voloridge),
            cruzado con short interest, earnings &lt;14d e indicadores técnicos.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Tickers opcionales separados por coma (ej: SOFI, PLTR, COIN). Vacío = candidatos automáticos."
              value={tickers}
              onChange={(e) => setTickers(e.target.value)}
              className="text-sm"
            />
            <Button onClick={runScan} disabled={loading} className="px-6">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Escaneando…
                </>
              ) : (
                <>
                  <Radar className="h-4 w-4 mr-2" />
                  Scan
                </>
              )}
            </Button>
          </div>
          {meta && (
            <p className="text-[10px] text-muted-foreground">
              Escaneo de {meta.scanned} tickers · {new Date(meta.generatedAt).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-400 text-sm">Scan failed</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {warnings.length > 0 && (
        <div className="text-[10px] text-muted-foreground bg-muted/30 rounded p-2">
          <Info className="inline h-3 w-3 mr-1" />
          {warnings.join(" · ")}
        </div>
      )}

      {rows.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Score</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Mcap</TableHead>
                    <TableHead>Quants</TableHead>
                    <TableHead>Short %</TableHead>
                    <TableHead>Inst %</TableHead>
                    <TableHead>RSI</TableHead>
                    <TableHead>Catalyst</TableHead>
                    <TableHead>Verdict</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.symbol}>
                      <TableCell>
                        <div className="font-bold text-base">{r.score}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{r.symbol}</div>
                        {r.companyName && (
                          <div className="text-[10px] text-muted-foreground truncate max-w-[160px]">
                            {r.companyName}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{fmtMcap(r.marketCap)}</TableCell>
                      <TableCell>
                        {r.signals.quantHits.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {r.signals.quantHits.slice(0, 3).map((q) => (
                              <Badge key={q} variant="secondary" className="text-[9px] px-1.5 py-0">
                                {q.split(" ")[0]}
                              </Badge>
                            ))}
                            {r.signals.quantHits.length > 3 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{r.signals.quantHits.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{fmtPct(r.signals.shortFloatPct)}</TableCell>
                      <TableCell className="text-sm">{fmtPct(r.signals.instOwnPct, 0)}</TableCell>
                      <TableCell className="text-sm">
                        {r.signals.rsi !== null ? r.signals.rsi.toFixed(0) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">
                        {r.catalystNote}
                      </TableCell>
                      <TableCell>
                        <VerdictPill v={r.verdict} />
                      </TableCell>
                      <TableCell>
                        {onAnalyze && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2"
                            onClick={() => onAnalyze(r.symbol)}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {rows.length === 0 && !loading && !error && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <Radar className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Pulsa <span className="font-medium">Scan</span> para detectar acciones con cargas institucionales activas.
            </p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              Datos de Fintel.io y MarketBeat vía Firecrawl. Heurística, no asesoramiento financiero.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
