import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Radar,
  AlertCircle,
  ExternalLink,
  Info,
  Play,
  Pause,
  History,
  Clock,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface QuantHit {
  name: string;
  deltaPct: number | null;
}

interface Signals {
  marketCap: number | null;
  shortFloatPct: number | null;
  instOwnPct: number | null;
  quantHits: QuantHit[];
  earningsInDays: number | null;
  rsi: number | null;
}

interface Row {
  symbol: string;
  exchange?: "NASDAQ" | "NYSE" | null;
  companyName?: string | null;
  price?: number | null;
  marketCap?: number | null;
  score: number;
  verdict: "Strong loader" | "Loader" | "Watch" | "Weak";
  signals: Signals;
  catalystNote: string;
  warnings: string[];
}

interface HistoryEntry {
  ts: number;
  scanned: number;
  topSymbol: string | null;
  topScore: number | null;
  rows: Row[];
  source: "manual" | "auto";
}

const STORAGE_KEY = "quant-loaders-history-v1";
const AUTO_INTERVAL_MS = 10 * 60 * 1000; // 10 min

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

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 10) : [];
  } catch {
    return [];
  }
}

function saveHistory(h: HistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(h.slice(0, 10)));
  } catch {
    // ignore quota errors
  }
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
  const [autoScan, setAutoScan] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const [nextRunAt, setNextRunAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const intervalRef = useRef<number | null>(null);
  const tickersRef = useRef(tickers);
  tickersRef.current = tickers;

  const runScan = useCallback(
    async (source: "manual" | "auto" = "manual") => {
      setLoading(true);
      setError(null);
      setWarnings([]);
      try {
        const parsed = tickersRef.current
          .split(/[\s,]+/)
          .map((t) => t.trim().toUpperCase())
          .filter(Boolean);

        const { data, error: fnError } = await supabase.functions.invoke(
          "quant-loaders-scan",
          { body: parsed.length ? { tickers: parsed } : { limit: 10 } }
        );

        if (fnError) throw new Error(fnError.message || "Scan failed");
        const newRows = (data?.results ?? []) as Row[];
        setRows(newRows);
        setWarnings((data?.warnings ?? []) as string[]);
        setMeta(data?.meta ?? null);

        const entry: HistoryEntry = {
          ts: Date.now(),
          scanned: data?.meta?.scanned ?? newRows.length,
          topSymbol: newRows[0]?.symbol ?? null,
          topScore: newRows[0]?.score ?? null,
          rows: newRows,
          source,
        };
        setHistory((prev) => {
          const next = [entry, ...prev].slice(0, 10);
          saveHistory(next);
          return next;
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Auto-scan loop
  useEffect(() => {
    if (!autoScan) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setNextRunAt(null);
      return;
    }

    // Kick one immediately, then schedule
    runScan("auto");
    setNextRunAt(Date.now() + AUTO_INTERVAL_MS);

    intervalRef.current = window.setInterval(() => {
      runScan("auto");
      setNextRunAt(Date.now() + AUTO_INTERVAL_MS);
    }, AUTO_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoScan, runScan]);

  // Tick "now" every second so the countdown updates
  useEffect(() => {
    if (!autoScan) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [autoScan]);

  const countdownStr = (() => {
    if (!nextRunAt) return null;
    const diff = Math.max(0, nextRunAt - now);
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, "0")}`;
  })();

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  const restoreFromHistory = (entry: HistoryEntry) => {
    setRows(entry.rows);
    setMeta({ scanned: entry.scanned, generatedAt: new Date(entry.ts).toISOString() });
    setError(null);
    setWarnings([]);
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
            (SIG, Citadel, Two Sigma, DE Shaw, Balyasny, Renaissance, Millennium, Jane Street, Voloridge, Point72),
            cruzado con short interest y RSI. Datos vía MarketBeat / Firecrawl.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Tickers opcionales separados por coma (ej: SOFI, PLTR, COIN). Vacío = candidatos automáticos."
              value={tickers}
              onChange={(e) => setTickers(e.target.value)}
              className="text-sm"
              disabled={loading}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => runScan("manual")}
                disabled={loading}
                className="px-6 flex-1 sm:flex-none"
              >
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
              <Button
                variant={autoScan ? "default" : "outline"}
                onClick={() => setAutoScan((v) => !v)}
                className="px-4"
                title="Auto-scan cada 10 min"
              >
                {autoScan ? (
                  <>
                    <Pause className="h-4 w-4 mr-1.5" />
                    Auto
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-1.5" />
                    Auto
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
            {meta && (
              <span>
                Último: {meta.scanned} tickers · {new Date(meta.generatedAt).toLocaleTimeString()}
              </span>
            )}
            {autoScan && countdownStr && (
              <span className="inline-flex items-center gap-1 text-primary">
                <Clock className="h-3 w-3" />
                Próximo en {countdownStr}
              </span>
            )}
          </div>
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
                    <TableHead className="w-[70px]">Score</TableHead>
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
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {r.signals.quantHits.slice(0, 3).map((q) => (
                              <Badge
                                key={q.name}
                                variant="secondary"
                                className="text-[9px] px-1.5 py-0"
                                title={
                                  q.deltaPct !== null
                                    ? `${q.name} ${q.deltaPct > 0 ? "+" : ""}${q.deltaPct.toFixed(1)}% QoQ`
                                    : q.name
                                }
                              >
                                {q.name.split(" ")[0]}
                                {q.deltaPct !== null && (
                                  <span
                                    className={`ml-1 ${
                                      q.deltaPct >= 30
                                        ? "text-emerald-400"
                                        : q.deltaPct < 0
                                          ? "text-red-400"
                                          : ""
                                    }`}
                                  >
                                    {q.deltaPct > 0 ? "+" : ""}
                                    {q.deltaPct.toFixed(0)}%
                                  </span>
                                )}
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
              Datos vía MarketBeat / Firecrawl. Heurística, no asesoramiento financiero.
            </p>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              Últimos {history.length} escaneos
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[10px] text-muted-foreground"
              onClick={clearHistory}
            >
              Limpiar
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hora</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead>Tickers</TableHead>
                    <TableHead>Top</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((h) => (
                    <TableRow key={h.ts}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {new Date(h.ts).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[9px] uppercase">
                          {h.source}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{h.scanned}</TableCell>
                      <TableCell className="text-xs font-medium">{h.topSymbol ?? "—"}</TableCell>
                      <TableCell className="text-xs font-bold">{h.topScore ?? "—"}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[10px]"
                          onClick={() => restoreFromHistory(h)}
                        >
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
