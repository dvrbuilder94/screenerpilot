import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Briefcase, AlertCircle, ExternalLink, Info } from "lucide-react";

interface Holding {
  ticker: string;
  company: string;
  pctOfPortfolio: number | null;
  valueUsd: number | null;
  shares: number | null;
  deltaPct: number | null;
  asOf: string | null;
}

interface ScanResponse {
  fund: string;
  holdings: Holding[];
  asOf: string | null;
  sourceUrl: string;
  warnings: string[];
}

const FUNDS = [
  { key: "citadel", name: "Citadel Advisors" },
  { key: "renaissance", name: "Renaissance Technologies" },
  { key: "two-sigma", name: "Two Sigma Investments" },
  { key: "millennium", name: "Millennium Management" },
  { key: "de-shaw", name: "D. E. Shaw & Co" },
  { key: "susquehanna", name: "Susquehanna International" },
  { key: "balyasny", name: "Balyasny Asset Mgmt" },
  { key: "jane-street", name: "Jane Street Group" },
  { key: "point72", name: "Point72 Asset Mgmt" },
  { key: "voloridge", name: "Voloridge Investment Mgmt" },
];

const fmtMoney = (n: number | null) => {
  if (n === null) return "—";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

const fmtShares = (n: number | null) => {
  if (n === null) return "—";
  return n.toLocaleString("en-US");
};

interface Props {
  onAnalyze?: (symbol: string) => void;
}

export default function QuantLoadersRadar({ onAnalyze }: Props) {
  const [fund, setFund] = useState<string>("citadel");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res, error: fnError } = await supabase.functions.invoke(
        "quant-loaders-scan",
        { body: { fund } }
      );
      if (fnError) throw new Error(fnError.message || "Request failed");
      if (res?.error) throw new Error(res.error);
      setData(res as ScanResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [fund]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            Quant Holdings — Top posiciones por fondo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Mira las principales posiciones de los grandes quants y market makers
            (Citadel, Renaissance, Two Sigma, Millennium, etc.) con el % aprox que pesa
            cada una en su cartera 13F. Datos públicos vía Stockcircle / Firecrawl.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={fund} onValueChange={setFund} disabled={loading}>
              <SelectTrigger className="sm:w-[280px]">
                <SelectValue placeholder="Selecciona fondo" />
              </SelectTrigger>
              <SelectContent>
                {FUNDS.map((f) => (
                  <SelectItem key={f.key} value={f.key}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={load} disabled={loading} className="px-6">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cargando…
                </>
              ) : (
                "Ver holdings"
              )}
            </Button>
          </div>
          {data && (
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
              <span className="font-medium text-foreground">{data.fund}</span>
              {data.asOf && <span>· Filing: {data.asOf}</span>}
              <a
                href={data.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-primary"
              >
                fuente <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-400 text-sm">Error</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {data && data.warnings.length > 0 && (
        <div className="text-[11px] text-muted-foreground bg-muted/30 rounded p-2">
          <Info className="inline h-3 w-3 mr-1" />
          {data.warnings.join(" · ")}
        </div>
      )}

      {data && data.holdings.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Ticker</TableHead>
                    <TableHead>Compañía</TableHead>
                    <TableHead className="text-right">% Cartera</TableHead>
                    <TableHead className="text-right">Δ QoQ</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.holdings.map((h, i) => (
                    <TableRow key={h.ticker}>
                      <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {h.ticker}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[260px] truncate">
                        {h.company}
                      </TableCell>
                      <TableCell className="text-right">
                        {h.pctOfPortfolio !== null ? (
                          <span className="font-bold">{h.pctOfPortfolio.toFixed(2)}%</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {fmtMoney(h.valueUsd)}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {fmtShares(h.shares)}
                      </TableCell>
                      <TableCell>
                        {onAnalyze && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2"
                            onClick={() => onAnalyze(h.ticker)}
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

      {!data && !loading && !error && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <Briefcase className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Selecciona un fondo y pulsa <span className="font-medium">Ver holdings</span>
            </p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              Datos del último 13F. Heurística pública, no asesoramiento financiero.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
