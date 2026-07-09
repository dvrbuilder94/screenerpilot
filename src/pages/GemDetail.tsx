import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Seo } from "@/components/Seo";
import { ChevronLeft, Loader2, Bell, Pencil } from "lucide-react";

type Timeframe = "daily" | "weekly" | "monthly";
const PERIODS: { label: string; tf: Timeframe }[] = [
  { label: "1A", tf: "daily" },
  { label: "5A", tf: "weekly" },
  { label: "10A", tf: "monthly" },
];

interface Analysis {
  symbol: string;
  companyName: string;
  price: number;
  marketCap: string;
  dayChangePercent?: number;
  verdict?: string;
  priceAction?: { trend: string; momentum: string };
  indicators?: {
    rsi?: { value: number; label: string };
    macd?: { hist: number; label: string };
    range52w?: { high: number; low: number; position: number };
  };
  chart?: { close: number[] };
}

interface Thesis {
  whatIs: string;
  bullCase: string;
  risks: string;
  setup: string;
}

async function fetchAnalysis(symbol: string, tf: Timeframe): Promise<Analysis> {
  const { data, error } = await supabase.functions.invoke("analyze-stock", { body: { symbol, timeframe: tf } });
  if (error || data?.error) throw new Error(data?.error || "No se pudo cargar");
  return data as Analysis;
}

async function fetchThesis(a: Analysis | undefined, symbol: string): Promise<Thesis> {
  const { data, error } = await supabase.functions.invoke("generate-gem-thesis", {
    body: {
      symbol,
      companyName: a?.companyName,
      price: a?.price,
      marketCap: a?.marketCap,
      rsi: a?.indicators?.rsi?.value,
      trend: a?.priceAction?.trend,
      verdict: a?.verdict,
    },
  });
  if (error || data?.error) throw new Error(data?.error || "thesis failed");
  return data as Thesis;
}

function Chart({ close }: { close: number[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv || close.length < 2) return;
    const ctx = cv.getContext("2d")!;
    const draw = () => {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = r.width * dpr; cv.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const W = r.width, H = r.height, pad = 6;
      const min = Math.min(...close), max = Math.max(...close);
      const X = (i: number) => pad + (i / (close.length - 1)) * (W - pad * 2);
      const Y = (v: number) => H - pad - ((v - min) / (max - min || 1)) * (H - pad * 2);
      ctx.clearRect(0, 0, W, H);
      ctx.beginPath(); ctx.moveTo(X(0), Y(close[0]));
      for (let i = 1; i < close.length; i++) ctx.lineTo(X(i), Y(close[i]));
      ctx.lineTo(X(close.length - 1), H - pad); ctx.lineTo(X(0), H - pad); ctx.closePath();
      const g = ctx.createLinearGradient(0, pad, 0, H);
      g.addColorStop(0, "rgba(200,97,63,0.16)"); g.addColorStop(1, "rgba(200,97,63,0)");
      ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); ctx.moveTo(X(0), Y(close[0]));
      for (let i = 1; i < close.length; i++) ctx.lineTo(X(i), Y(close[i]));
      ctx.strokeStyle = "#C8613F"; ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.stroke();
    };
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [close]);
  return <canvas ref={ref} className="w-full h-[148px] block" />;
}

export default function GemDetail() {
  const { symbol = "" } = useParams<{ symbol: string }>();
  const sym = symbol.toUpperCase();
  const [tf, setTf] = useState<Timeframe>("daily");

  const analysisQ = useQuery({ queryKey: ["gem-analysis", sym, tf], queryFn: () => fetchAnalysis(sym, tf), enabled: !!sym });
  const a = analysisQ.data;
  const thesisQ = useQuery({ queryKey: ["gem-thesis", sym], queryFn: () => fetchThesis(a, sym), enabled: !!sym && !!a });

  // personal note (device-local)
  const noteKey = `sp_note_${sym}`;
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);
  useEffect(() => { setNote(localStorage.getItem(noteKey) || ""); }, [noteKey]);
  const saveNote = () => { localStorage.setItem(noteKey, note); setEditing(false); };

  const up = (a?.dayChangePercent ?? 0) >= 0;

  return (
    <div className="gemwarm min-h-screen">
      <style>{`
        .gemwarm { --cream:#FAF9F5; --paper:#fff; --paper2:#F4F1E9; --ink:#1D1B16; --ink2:#3B382F;
          --muted:#6E6A60; --faint:#A29C8E; --line:#E8E3D6; --coral:#C8613F; --up:#3F7A5A; --down:#BE5340;
          --serif:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,ui-serif,serif;
          --mono:ui-monospace,"SF Mono",Menlo,Monaco,Consolas,monospace;
          background:var(--cream); color:var(--ink); }
        .gemwarm .wrap { max-width:640px; margin:0 auto; padding:14px 20px 40px; }
        .gemwarm .mono { font-family:var(--mono); }
        .gemwarm .serif { font-family:var(--serif); }
        .gemwarm .card { background:var(--paper); border:1px solid var(--line); border-radius:16px; }
        .gemwarm .stat { background:var(--cream); padding:11px 13px; }
        .gemwarm select, .gemwarm textarea:focus { outline:none; }
        .gemwarm .per { font-family:var(--mono); font-size:11px; padding:6px 0; border-radius:8px; border:0; background:none; color:var(--muted); cursor:pointer; flex:1; }
        .gemwarm .per.on { background:var(--ink); color:var(--cream); }
      `}</style>

      <Seo title={`${sym} — Tesis | ScreenerPilot`} description={`Resumen, gráfico y tesis de ${sym}.`} path={`/gem/${sym}`} />

      <div className="wrap">
        <Link to="/watchlist" className="inline-flex items-center gap-1 text-[13px]" style={{ color: "var(--muted)" }}>
          <ChevronLeft className="w-4 h-4" /> Gemas
        </Link>

        {analysisQ.isLoading ? (
          <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--coral)" }} /></div>
        ) : analysisQ.error || !a ? (
          <div className="card p-8 text-center mt-6" style={{ color: "var(--muted)" }}>
            No se pudo cargar {sym}. ¿El ticker es correcto?
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mt-3 flex items-baseline gap-2.5 flex-wrap">
              <span className="mono" style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}>{a.symbol}</span>
              <span style={{ fontSize: 14, color: "var(--muted)" }}>{a.companyName}</span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-3">
              <span className="mono" style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.02em" }}>${a.price?.toFixed(2)}</span>
              {a.dayChangePercent != null && (
                <span className="mono" style={{ fontSize: 15, fontWeight: 600, color: up ? "var(--up)" : "var(--down)" }}>
                  {up ? "+" : ""}{a.dayChangePercent.toFixed(2)}% hoy
                </span>
              )}
            </div>

            {/* Summary stats */}
            <div className="mt-4 grid grid-cols-3 gap-px card overflow-hidden" style={{ background: "var(--line)" }}>
              <div className="stat"><div style={{ fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--faint)" }}>Market cap</div><div className="mono" style={{ fontSize: 15, fontWeight: 600, marginTop: 3 }}>{a.marketCap || "—"}</div></div>
              <div className="stat"><div style={{ fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--faint)" }}>RSI</div><div className="mono" style={{ fontSize: 15, fontWeight: 600, marginTop: 3 }}>{a.indicators?.rsi?.value ?? "—"}</div></div>
              <div className="stat"><div style={{ fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--faint)" }}>Rango 52s</div><div className="mono" style={{ fontSize: 12, fontWeight: 600, marginTop: 3 }}>{a.indicators?.range52w ? `$${a.indicators.range52w.low.toFixed(0)}–$${a.indicators.range52w.high.toFixed(0)}` : "—"}</div></div>
            </div>

            {/* Chart */}
            <div className="mt-5">
              <div className="flex gap-1 mb-2.5">
                {PERIODS.map((p) => (
                  <button key={p.tf} className={`per ${tf === p.tf ? "on" : ""}`} onClick={() => setTf(p.tf)}>{p.label}</button>
                ))}
              </div>
              {a.chart?.close && a.chart.close.length > 1 ? <Chart close={a.chart.close} /> : <div className="h-[148px] flex items-center justify-center" style={{ color: "var(--faint)" }}><Loader2 className="w-4 h-4 animate-spin" /></div>}
            </div>

            {/* THESIS */}
            <div className="card mt-6 p-5" style={{ boxShadow: "0 2px 0 var(--paper2)" }}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--coral)", fontWeight: 600 }}>
                Tesis · generada por BEN
              </div>
              <h2 className="serif" style={{ fontSize: 21, fontWeight: 600, margin: "6px 0 0", letterSpacing: "-0.01em" }}>Por qué {a.symbol}</h2>

              {thesisQ.isLoading ? (
                <div className="flex items-center gap-2 py-6" style={{ color: "var(--muted)", fontSize: 13 }}>
                  <Loader2 className="w-4 h-4 animate-spin" /> BEN está armando la tesis…
                </div>
              ) : thesisQ.data ? (
                <>
                  <ThesisSection title="El caso" body={thesisQ.data.whatIs} />
                  <ThesisSection title="Bull case" tag="Alcista" tagColor="var(--up)" tagBg="#E6EFE7" body={thesisQ.data.bullCase} />
                  <ThesisSection title="Riesgos" tag="Bajista" tagColor="var(--down)" tagBg="#F4E3DE" body={thesisQ.data.risks} />
                  <ThesisSection title="El setup" tag="Técnico" tagColor="var(--coral)" tagBg="#F3E4DC" body={thesisQ.data.setup} />
                  <div className="mt-4 pt-3.5 flex flex-wrap gap-1.5 items-center" style={{ borderTop: "1px solid var(--line)" }}>
                    <span className="mono" style={{ fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--faint)" }}>Fuentes</span>
                    {["Precios en vivo", "Análisis técnico", "SEC EDGAR"].map((s) => (
                      <span key={s} className="mono" style={{ fontSize: 10.5, color: "var(--muted)", background: "var(--paper2)", border: "1px solid var(--line)", borderRadius: 6, padding: "3px 7px" }}>{s}</span>
                    ))}
                  </div>
                </>
              ) : (
                <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 12 }}>No se pudo generar la tesis ahora.</p>
              )}
            </div>

            {/* Your note */}
            <div className="mt-4 p-4" style={{ background: "linear-gradient(#FBF4EF,#F9EFE7)", border: "1px solid #E7C9BC", borderRadius: 16 }}>
              <div className="flex items-center justify-between">
                <span className="mono" style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--coral)", fontWeight: 600 }}>Tu tesis</span>
                {!editing && (
                  <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1" style={{ fontSize: 11, color: "var(--muted)" }}>
                    <Pencil className="w-3 h-3" /> {note ? "Editar" : "Agregar"}
                  </button>
                )}
              </div>
              {editing ? (
                <div className="mt-2">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    autoFocus
                    placeholder="Por qué la sigues, tu tesis, tu entrada…"
                    className="serif w-full text-[14px] p-2 rounded-lg"
                    style={{ background: "var(--paper)", border: "1px solid var(--line)", color: "var(--ink2)" }}
                  />
                  <button onClick={saveNote} className="mt-2 text-[13px] font-semibold px-3 py-1.5 rounded-lg" style={{ background: "var(--ink)", color: "var(--cream)" }}>Guardar</button>
                </div>
              ) : note ? (
                <p className="serif" style={{ fontSize: 14.5, lineHeight: 1.55, color: "var(--ink2)", margin: "8px 0 0", fontStyle: "italic" }}>"{note}"</p>
              ) : (
                <p style={{ fontSize: 13, color: "var(--muted)", margin: "8px 0 0" }}>Aún no escribiste tu tesis para {sym}.</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 mt-5">
              <button className="flex-1 inline-flex items-center justify-center gap-1.5 text-[13.5px] font-semibold py-3 rounded-xl" style={{ background: "var(--ink)", color: "var(--cream)" }}>
                <Bell className="w-4 h-4" /> Crear alerta
              </button>
            </div>

            <p className="text-center mt-6" style={{ fontSize: 11, color: "var(--faint)" }}>
              Educativo · no es asesoría de inversión.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function ThesisSection({ title, body, tag, tagColor, tagBg }: { title: string; body: string; tag?: string; tagColor?: string; tagBg?: string }) {
  return (
    <div className="mt-4">
      <h3 className="serif flex items-center gap-2" style={{ fontSize: 15, fontWeight: 600, margin: "0 0 5px" }}>
        {title}
        {tag && <span className="mono" style={{ fontSize: 8.5, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 6px", borderRadius: 5, fontWeight: 700, color: tagColor, background: tagBg }}>{tag}</span>}
      </h3>
      <p style={{ fontSize: 13.5, lineHeight: 1.62, color: "var(--ink2)", margin: 0 }}>{body}</p>
    </div>
  );
}
