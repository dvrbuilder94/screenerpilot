import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Sparkles, RefreshCw, Trophy, Target, Bot } from "lucide-react";

interface FounderPick {
  id: string;
  symbol: string;
  company_name: string | null;
  entry_date: string;
  entry_price: number;
  thesis: string;
  ben_note: string | null;
  conviction: string;
  status: string;
  is_live_logged: boolean;
  current_price: number | null;
  change_pct: number | null;
  rank: number;
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  active: { label: "Activa", cls: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
  playing_out: { label: "Jugándose", cls: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  closed: { label: "Cerrada", cls: "text-muted-foreground border-border bg-secondary/40" },
  broken: { label: "Rota", cls: "text-red-400 border-red-500/30 bg-red-500/10" },
};

// Fallback so the page is never empty even before the DB migration is applied.
// Illustrative entries/prices — replaced by real DB data + live prices once wired.
export const FALLBACK_PICKS: FounderPick[] = [
  { id: "f1", symbol: "PLTR", company_name: "Palantir Technologies", entry_date: "2023-01-15", entry_price: 6.5, thesis: "AI/data platform mal entendido — el mercado no veía el pivote de gobierno a comercial.", ben_note: null, conviction: "HIGH", status: "playing_out", is_live_logged: false, current_price: 165, change_pct: 2438, rank: 1 },
  { id: "f2", symbol: "RGTI", company_name: "Rigetti Computing", entry_date: "2023-11-01", entry_price: 1.1, thesis: "Quantum de superconductores a valuación de descarte — opción asimétrica.", ben_note: null, conviction: "MEDIUM", status: "playing_out", is_live_logged: false, current_price: 14, change_pct: 1173, rank: 2 },
  { id: "f3", symbol: "HIMS", company_name: "Hims & Hers Health", entry_date: "2024-02-01", entry_price: 9, thesis: "Telehealth con marca real y márgenes; GLP-1 como catalizador ignorado.", ben_note: null, conviction: "HIGH", status: "playing_out", is_live_logged: false, current_price: 55, change_pct: 511, rank: 3 },
  { id: "f4", symbol: "IONQ", company_name: "IonQ Inc.", entry_date: "2023-05-01", entry_price: 7.2, thesis: "Trapped-ion es la arquitectura correcta y ya factura, algo raro en quantum.", ben_note: null, conviction: "HIGH", status: "playing_out", is_live_logged: false, current_price: 42, change_pct: 483, rank: 4 },
  { id: "f5", symbol: "AMD", company_name: "Advanced Micro Devices", entry_date: "2023-01-10", entry_price: 65, thesis: "El único retador real de NVIDIA en AI; el mercado subestimaba MI300.", ben_note: null, conviction: "HIGH", status: "playing_out", is_live_logged: false, current_price: 170, change_pct: 162, rank: 5 },
  { id: "f6", symbol: "OSCR", company_name: "Oscar Health", entry_date: "2024-04-01", entry_price: 6.5, thesis: "Insurtech dada por muerta; el camino a rentabilidad no estaba en precio.", ben_note: null, conviction: "MEDIUM", status: "active", is_live_logged: false, current_price: 16, change_pct: 146, rank: 6 },
  { id: "f7", symbol: "LAC", company_name: "Lithium Americas", entry_date: "2025-03-01", entry_price: 3.5, thesis: "Litio en el fondo del ciclo; Thacker Pass + respaldo de GM. Pick actual.", ben_note: null, conviction: "HIGH", status: "active", is_live_logged: false, current_price: 3.1, change_pct: -11, rank: 7 },
];

async function fetchPicks(): Promise<FounderPick[]> {
  const { data, error } = await (supabase as any)
    .from("founder_picks")
    .select("*")
    .order("rank", { ascending: true });
  if (error || !data || data.length === 0) return FALLBACK_PICKS;
  return data as FounderPick[];
}

function fmtDate(d: string) {
  return new Date(d + "T12:00:00Z").toLocaleDateString("es-ES", { month: "short", year: "numeric" });
}

export default function TopPicks() {
  const { data: picks = [], isLoading, refetch } = useQuery({ queryKey: ["founder-picks"], queryFn: fetchPicks });
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await supabase.functions.invoke("refresh-founder-picks", { body: {} });
    await refetch();
    setRefreshing(false);
  };

  const usingFallback = picks.length > 0 && picks[0].id.startsWith("f");
  const scored = picks.filter((p) => p.change_pct != null);
  const avg = scored.length ? scored.reduce((a, p) => a + (p.change_pct ?? 0), 0) / scored.length : null;
  const best = scored.length ? scored.reduce((a, p) => ((p.change_pct ?? 0) > (a.change_pct ?? 0) ? p : a)) : null;
  const winRate = scored.length ? Math.round((scored.filter((p) => (p.change_pct ?? 0) > 0).length / scored.length) * 100) : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8 pb-24 lg:pb-12">
      <Seo title="Top Picks & Track Record — ScreenerPilot" description="High-conviction calls with the thesis at the moment of the call, and verifiable performance since entry." path="/top-picks" />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-[10px] font-bold uppercase tracking-[0.12em] text-primary mb-3">
            <Sparkles className="w-3 h-3" /> Alfa · asistido por BEN
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Top Picks &amp; Track Record</h1>
          <p className="text-muted-foreground mt-1.5 text-sm max-w-xl">
            Llamadas de alta convicción con la tesis del momento. El humano encuentra el alfa; BEN la
            estructura y la vigila. Performance real desde la entrada.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="flex-shrink-0">
          <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", refreshing && "animate-spin")} />
          Actualizar precios
        </Button>
      </div>

      {/* Track record summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="fin-card p-4">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground"><Target className="w-3 h-3" /> Llamadas</div>
          <div className="text-2xl font-mono font-semibold mt-1 tabular-nums">{picks.length}</div>
        </div>
        <div className="fin-card p-4">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground"><TrendingUp className="w-3 h-3" /> Retorno prom.</div>
          <div className={cn("text-2xl font-mono font-semibold mt-1 tabular-nums", avg == null ? "text-muted-foreground" : avg >= 0 ? "text-emerald-400" : "text-red-400")}>
            {avg == null ? "—" : `${avg >= 0 ? "+" : ""}${avg.toFixed(0)}%`}
          </div>
        </div>
        <div className="fin-card p-4">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground"><Trophy className="w-3 h-3" /> Mejor</div>
          <div className="text-2xl font-mono font-semibold mt-1 tabular-nums text-emerald-400">
            {best?.change_pct != null ? `+${best.change_pct.toFixed(0)}%` : "—"}
          </div>
          {best && best.change_pct != null && <div className="text-[11px] text-muted-foreground mt-0.5">{best.symbol}</div>}
        </div>
      </div>

      {usingFallback && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-[12.5px] text-amber-300/90">
          <span className="font-semibold">Datos de ejemplo.</span> Así se ve el producto. Los números y tesis reales
          se cargan cuando conectemos la base de datos y tus entradas verdaderas.
        </div>
      )}

      {isLoading ? (
        <div className="fin-card p-10 text-center text-sm text-muted-foreground">Cargando…</div>
      ) : picks.length === 0 ? (
        <div className="fin-card p-10 text-center text-sm text-muted-foreground">Aún no hay picks.</div>
      ) : (
        <div className="space-y-3">
          {picks.map((p) => {
            const pct = p.change_pct;
            const up = (pct ?? 0) >= 0;
            const st = STATUS_LABEL[p.status] ?? STATUS_LABEL.active;
            return (
              <div key={p.id} className="fin-card p-5 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg font-semibold text-foreground">{p.symbol}</span>
                      {p.company_name && <span className="text-[13px] text-muted-foreground">{p.company_name}</span>}
                      <span className={cn("text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border", st.cls)}>{st.label}</span>
                      {p.conviction === "HIGH" && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-primary/30 bg-primary/10 text-primary">Alta convicción</span>
                      )}
                    </div>
                    <div className="text-[12px] text-muted-foreground mt-1 font-mono">
                      Llamada: {fmtDate(p.entry_date)} · ${Number(p.entry_price).toFixed(2)}
                      {!p.is_live_logged && <span className="ml-1.5 opacity-60">(histórica)</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={cn("inline-flex items-center gap-1 text-xl font-mono font-bold tabular-nums", pct == null ? "text-muted-foreground" : up ? "text-emerald-400" : "text-red-400")}>
                      {pct != null && (up ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />)}
                      {pct == null ? "—" : `${up ? "+" : ""}${pct.toFixed(0)}%`}
                    </div>
                    {p.current_price != null && <div className="text-[12px] text-muted-foreground font-mono mt-0.5">${p.current_price.toFixed(2)}</div>}
                  </div>
                </div>

                {/* The "what's behind this" */}
                <p className="mt-3.5 text-[14px] text-foreground/90 leading-relaxed">{p.thesis}</p>

                {p.ben_note && (
                  <div className="mt-3 flex items-start gap-2 text-[12.5px] text-muted-foreground bg-secondary/40 rounded-lg p-2.5">
                    <Bot className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary" />
                    <span><span className="font-medium text-foreground/80">BEN:</span> {p.ben_note}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground text-center leading-relaxed max-w-lg mx-auto">
        Opiniones personales y educativas — no es asesoría de inversión. "Histórica" = registrada retroactivamente,
        no en vivo. Haz tu propia investigación.
      </p>
    </div>
  );
}
