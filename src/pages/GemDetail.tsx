import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Seo } from "@/components/Seo";
import { ChevronLeft, Loader2, Bell, Pencil } from "lucide-react";

type Timeframe = "daily" | "weekly" | "monthly";
const PERIODS: { label: string; tf: Timeframe }[] = [
  { label: "1Y", tf: "daily" },
  { label: "5Y", tf: "weekly" },
  { label: "10Y", tf: "monthly" },
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
  if (error || data?.error) throw new Error(data?.error || "Could not load");
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
      g.addColorStop(0, "rgba(201,247,63,0.18)"); g.addColorStop(1, "rgba(201,247,63,0)");
      ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); ctx.moveTo(X(0), Y(close[0]));
      for (let i = 1; i < close.length; i++) ctx.lineTo(X(i), Y(close[i]));
      ctx.strokeStyle = "#C9F73F"; ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.stroke();
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

  const noteKey = `sp_note_${sym}`;
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);
  useEffect(() => { setNote(localStorage.getItem(noteKey) || ""); }, [noteKey]);
  const saveNote = () => { localStorage.setItem(noteKey, note); setEditing(false); };

  const up = (a?.dayChangePercent ?? 0) >= 0;

  return (
    <div className="gemd min-h-screen pb-24 lg:pb-10">
      <style>{`
        .gemd { --bg:#0A0A0A; --panel:#141414; --panel2:#1A1A1A; --ink:#FAFAFA; --ink2:#DADADA;
          --muted:#9A9AA5; --faint:#5A5A62; --line:rgba(255,255,255,0.08); --lime:#C9F73F; --up:#4ADE80; --down:#FF5252;
          --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
          --mono:ui-monospace,"SF Mono",Menlo,Monaco,Consolas,monospace;
          background:var(--bg); color:var(--ink); }
        .gemd .wrap { max-width:640px; margin:0 auto; padding:14px 20px 40px; }
        .gemd .mono { font-family:var(--mono); }
        .gemd .card { background:var(--panel); border:1px solid var(--line); border-radius:16px; }
        .gemd .stat { background:var(--bg); padding:11px 13px; }
        .gemd select, .gemd textarea:focus { outline:none; }
        .gemd .per { font-family:var(--mono); font-size:11px; padding:6px 0; border-radius:8px; border:0; background:none; color:var(--muted); cursor:pointer; flex:1; }
        .gemd .per.on { background:var(--lime); color:#0A0A0A; font-weight:600; }
      `}</style>

      <Seo title={`${sym} — Thesis | ScreenerPilot`} description={`Summary, chart and BEN thesis for ${sym}.`} path={`/gem/${sym}`} />

      <div className="wrap">
        <Link to="/watchlist" className="inline-flex items-center gap-1 text-[13px]" style={{ color: "var(--muted)" }}>
          <ChevronLeft className="w-4 h-4" /> Watchlist
        </Link>

        {analysisQ.isLoading ? (
          <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--lime)" }} /></div>
        ) : analysisQ.error || !a ? (
          <div className="card p-8 text-center mt-6" style={{ color: "var(--muted)" }}>
            Couldn't load {sym}. Is the ticker correct?
          </div>
        ) : (
          <>
            <div className="mt-3 flex items-baseline gap-2.5 flex-wrap">
              <span className="mono" style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}>{a.symbol}</span>
              <span style={{ fontSize: 14, color: "var(--muted)" }}>{a.companyName}</span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-3">
              <span className="mono" style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.02em" }}>${a.price?.toFixed(2)}</span>
              {a.dayChangePercent != null && (
                <span className="mono" style={{ fontSize: 15, fontWeight: 600, color: up ? "var(--up)" : "var(--down)" }}>
                  {up ? "+" : ""}{a.dayChangePercent.toFixed(2)}% today
                </span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-px card overflow-hidden" style={{ background: "var(--line)" }}>
              <div className="stat"><div style={{ fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--faint)" }}>Market cap</div><div className="mono" style={{ fontSize: 15, fontWeight: 600, marginTop: 3 }}>{a.marketCap || "—"}</div></div>
              <div className="stat"><div style={{ fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--faint)" }}>RSI</div><div className="mono" style={{ fontSize: 15, fontWeight: 600, marginTop: 3 }}>{a.indicators?.rsi?.value ?? "—"}</div></div>
              <div className="stat"><div style={{ fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--faint)" }}>52w range</div><div className="mono" style={{ fontSize: 12, fontWeight: 600, marginTop: 3 }}>{a.indicators?.range52w ? `$${a.indicators.range52w.low.toFixed(0)}–$${a.indicators.range52w.high.toFixed(0)}` : "—"}</div></div>
            </div>

            <div className="mt-5">
              <div className="flex gap-1 mb-2.5">
                {PERIODS.map((p) => (
                  <button key={p.tf} className={`per ${tf === p.tf ? "on" : ""}`} onClick={() => setTf(p.tf)}>{p.label}</button>
                ))}
              </div>
              {a.chart?.close && a.chart.close.length > 1 ? <Chart close={a.chart.close} /> : <div className="h-[148px] flex items-center justify-center" style={{ color: "var(--faint)" }}><Loader2 className="w-4 h-4 animate-spin" /></div>}
            </div>

            <div className="card mt-6 p-5">
              <div className="mono" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--lime)", fontWeight: 600 }}>
                Thesis · by BEN
              </div>
              <h2 style={{ fontSize: 21, fontWeight: 700, margin: "6px 0 0", letterSpacing: "-0.01em" }}>Why {a.symbol}</h2>

              {thesisQ.isLoading ? (
                <div className="flex items-center gap-2 py-6" style={{ color: "var(--muted)", fontSize: 13 }}>
                  <Loader2 className="w-4 h-4 animate-spin" /> BEN is writing the thesis…
                </div>
              ) : thesisQ.data ? (
                <>
                  <ThesisSection title="The case" body={thesisQ.data.whatIs} />
                  <ThesisSection title="Bull case" tag="Bullish" tagColor="var(--up)" tagBg="rgba(74,222,128,0.14)" body={thesisQ.data.bullCase} />
                  <ThesisSection title="Risks" tag="Bearish" tagColor="var(--down)" tagBg="rgba(255,82,82,0.14)" body={thesisQ.data.risks} />
                  <ThesisSection title="The setup" tag="Technical" tagColor="var(--lime)" tagBg="rgba(201,247,63,0.14)" body={thesisQ.data.setup} />
                  <div className="mt-4 pt-3.5 flex flex-wrap gap-1.5 items-center" style={{ borderTop: "1px solid var(--line)" }}>
                    <span className="mono" style={{ fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--faint)" }}>Sources</span>
                    {["Live prices", "Technical analysis", "SEC EDGAR"].map((s) => (
                      <span key={s} className="mono" style={{ fontSize: 10.5, color: "var(--muted)", background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: 6, padding: "3px 7px" }}>{s}</span>
                    ))}
                  </div>
                </>
              ) : (
                <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 12 }}>Couldn't generate the thesis right now.</p>
              )}
            </div>

            <div className="mt-4 p-4" style={{ background: "var(--panel)", border: "1px solid rgba(201,247,63,0.22)", borderRadius: 16 }}>
              <div className="flex items-center justify-between">
                <span className="mono" style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--lime)", fontWeight: 600 }}>Your thesis</span>
                {!editing && (
                  <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1" style={{ fontSize: 11, color: "var(--muted)" }}>
                    <Pencil className="w-3 h-3" /> {note ? "Edit" : "Add"}
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
                    placeholder="Why you follow it, your thesis, your entry…"
                    className="w-full text-[14px] p-2 rounded-lg"
                    style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--ink2)" }}
                  />
                  <button onClick={saveNote} className="mt-2 text-[13px] font-semibold px-3 py-1.5 rounded-lg" style={{ background: "var(--lime)", color: "#0A0A0A" }}>Save</button>
                </div>
              ) : note ? (
                <p style={{ fontSize: 14.5, lineHeight: 1.55, color: "var(--ink2)", margin: "8px 0 0" }}>"{note}"</p>
              ) : (
                <p style={{ fontSize: 13, color: "var(--muted)", margin: "8px 0 0" }}>No thesis yet for {sym}.</p>
              )}
            </div>

            <div className="flex gap-2.5 mt-5">
              <button className="flex-1 inline-flex items-center justify-center gap-1.5 text-[13.5px] font-semibold py-3 rounded-xl" style={{ background: "var(--lime)", color: "#0A0A0A" }}>
                <Bell className="w-4 h-4" /> Create alert
              </button>
            </div>

            <p className="text-center mt-6" style={{ fontSize: 11, color: "var(--faint)" }}>
              Educational · not investment advice.
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
      <h3 className="flex items-center gap-2" style={{ fontSize: 15, fontWeight: 600, margin: "0 0 5px" }}>
        {title}
        {tag && <span className="mono" style={{ fontSize: 8.5, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 6px", borderRadius: 5, fontWeight: 700, color: tagColor, background: tagBg }}>{tag}</span>}
      </h3>
      <p style={{ fontSize: 13.5, lineHeight: 1.62, color: "var(--ink2)", margin: 0 }}>{body}</p>
    </div>
  );
}
