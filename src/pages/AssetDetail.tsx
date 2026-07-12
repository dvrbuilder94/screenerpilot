import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWatchlist } from "@/hooks/useWatchlist";
import { cleanTicker } from "@/lib/ticker";
import { Seo } from "@/components/Seo";
import { ChevronLeft, Loader2, Bell, Heart, Sparkles } from "lucide-react";

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
  priceAction?: { trend: string; momentum: string; volatility: string; support: string };
  indicators?: {
    rsi?: { value: number; label: string };
    macd?: { hist: number; label: string };
    bollinger?: { width: number; label: string };
    emas?: { ema20: number | null; ema50: number | null; ema200: number | null };
    range52w?: { high: number; low: number; position: number };
  };
  chart?: { close: number[]; timestamps?: number[] };
}

async function fetchAnalysis(symbol: string, tf: Timeframe): Promise<Analysis> {
  const { data, error } = await supabase.functions.invoke("analyze-stock", { body: { symbol, timeframe: tf } });
  if (error || data?.error) throw new Error(data?.error || "Could not load");
  return data as Analysis;
}

function InteractiveChart({
  close,
  timestamps,
  onHover,
}: {
  close: number[];
  timestamps?: number[];
  onHover: (info: { price: number; date: string } | null) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const pad = 6;

  useEffect(() => {
    const cv = ref.current;
    if (!cv || close.length < 2) return;
    const ctx = cv.getContext("2d")!;
    const r = cv.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = r.width * dpr; cv.height = r.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = r.width, H = r.height;
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

    if (hoverIdx != null) {
      const hx = X(hoverIdx), hy = Y(close[hoverIdx]);
      ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(hx, pad); ctx.lineTo(hx, H - pad); ctx.stroke();
      ctx.beginPath(); ctx.fillStyle = "#C9F73F"; ctx.arc(hx, hy, 4, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.strokeStyle = "rgba(201,247,63,0.4)"; ctx.lineWidth = 2; ctx.arc(hx, hy, 7, 0, 7); ctx.stroke();
    }
  }, [close, hoverIdx]);

  const move = (clientX: number) => {
    const cv = ref.current;
    if (!cv) return;
    const rect = cv.getBoundingClientRect();
    const t = (clientX - rect.left - pad) / (rect.width - pad * 2);
    const i = Math.max(0, Math.min(close.length - 1, Math.round(t * (close.length - 1))));
    setHoverIdx(i);
    const ts = timestamps?.[i];
    onHover({
      price: close[i],
      date: ts ? new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
    });
  };

  return (
    <canvas
      ref={ref}
      className="w-full h-[190px] block"
      style={{ touchAction: "none" }}
      onPointerMove={(e) => move(e.clientX)}
      onPointerDown={(e) => move(e.clientX)}
      onPointerLeave={() => { setHoverIdx(null); onHover(null); }}
    />
  );
}

export default function AssetDetail() {
  const { symbol = "" } = useParams<{ symbol: string }>();
  const sym = symbol.toUpperCase();
  const [tf, setTf] = useState<Timeframe>("daily");
  const [hover, setHover] = useState<{ price: number; date: string } | null>(null);
  const { has, toggle } = useWatchlist();
  const inWatchlist = has(sym);

  const analysisQ = useQuery({ queryKey: ["asset-analysis", sym, tf], queryFn: () => fetchAnalysis(sym, tf), enabled: !!sym });
  const a = analysisQ.data;
  const up = (a?.dayChangePercent ?? 0) >= 0;
  const ind = a?.indicators;
  const pa = a?.priceAction;

  return (
    <div className="assetdetail min-h-screen pb-28 lg:pb-12">
      <style>{`
        .assetdetail { --bg:#0A0A0A; --panel:#141414; --panel2:#1A1A1A; --ink:#FAFAFA; --ink2:#DADADA;
          --muted:#9A9AA5; --faint:#5A5A62; --line:rgba(255,255,255,0.08); --lime:#C9F73F; --up:#4ADE80; --down:#FF5252;
          --mono:ui-monospace,"SF Mono",Menlo,Monaco,Consolas,monospace;
          background:var(--bg); color:var(--ink); }
        .assetdetail .wrap { max-width:640px; margin:0 auto; padding:14px 20px 40px; }
        .assetdetail .mono { font-family:var(--mono); }
        .assetdetail .card { background:var(--panel); border:1px solid var(--line); border-radius:16px; }
        .assetdetail .stat { background:var(--bg); padding:11px 13px; }
        .assetdetail .per { font-family:var(--mono); font-size:11px; padding:6px 0; border-radius:8px; border:0; background:none; color:var(--muted); cursor:pointer; flex:1; }
        .assetdetail .per.on { background:var(--lime); color:#0A0A0A; font-weight:600; }
      `}</style>

      <Seo title={`${sym} | ScreenerPilot`} description={`Live chart and technicals for ${sym}.`} path={`/asset/${sym}`} />

      <div className="wrap">
        <Link to="/watchlist" className="inline-flex items-center gap-1 text-[13px]" style={{ color: "var(--muted)" }}>
          <ChevronLeft className="w-4 h-4" /> Watchlist
        </Link>

        {analysisQ.isLoading ? (
          <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--lime)" }} /></div>
        ) : analysisQ.error || !a ? (
          <div className="card p-8 text-center mt-6" style={{ color: "var(--muted)" }}>Couldn't load {sym}. Is the ticker correct?</div>
        ) : (
          <>
            {/* Header + heart */}
            <div className="mt-3 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-baseline gap-2.5 flex-wrap">
                  <span className="mono" style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}>{cleanTicker(a.symbol)}</span>
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
              </div>
              <button
                onClick={() => toggle(sym)}
                aria-label={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
                className="flex-shrink-0 w-10 h-10 rounded-full grid place-items-center border transition-colors"
                style={{
                  borderColor: inWatchlist ? "var(--lime)" : "var(--line)",
                  background: inWatchlist ? "rgba(201,247,63,0.12)" : "transparent",
                  color: inWatchlist ? "var(--lime)" : "var(--muted)",
                }}
              >
                <Heart className="w-5 h-5" fill={inWatchlist ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Summary stats */}
            <div className="mt-4 grid grid-cols-3 gap-px card overflow-hidden" style={{ background: "var(--line)" }}>
              <div className="stat"><div style={{ fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--faint)" }}>Market cap</div><div className="mono" style={{ fontSize: 15, fontWeight: 600, marginTop: 3 }}>{a.marketCap || "—"}</div></div>
              <div className="stat"><div style={{ fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--faint)" }}>RSI</div><div className="mono" style={{ fontSize: 15, fontWeight: 600, marginTop: 3 }}>{ind?.rsi?.value ?? "—"}</div></div>
              <div className="stat"><div style={{ fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--faint)" }}>52w range</div><div className="mono" style={{ fontSize: 12, fontWeight: 600, marginTop: 3 }}>{ind?.range52w ? `$${ind.range52w.low.toFixed(0)}–$${ind.range52w.high.toFixed(0)}` : "—"}</div></div>
            </div>

            {/* Chart — interactive */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex gap-1 flex-1">
                  {PERIODS.map((p) => (
                    <button key={p.tf} className={`per ${tf === p.tf ? "on" : ""}`} style={{ maxWidth: 70 }} onClick={() => setTf(p.tf)}>{p.label}</button>
                  ))}
                </div>
                {hover && (
                  <div className="mono text-right" style={{ minWidth: 120 }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>${hover.price.toFixed(2)}</div>
                    <div style={{ fontSize: 10.5, color: "var(--faint)" }}>{hover.date}</div>
                  </div>
                )}
              </div>
              {a.chart?.close && a.chart.close.length > 1 ? (
                <InteractiveChart close={a.chart.close} timestamps={a.chart.timestamps} onHover={setHover} />
              ) : (
                <div className="h-[190px] flex items-center justify-center" style={{ color: "var(--faint)" }}><Loader2 className="w-4 h-4 animate-spin" /></div>
              )}
              <p className="mono text-center mt-1" style={{ fontSize: 10, color: "var(--faint)" }}>Drag across the chart to see prices</p>
            </div>

            {/* AI thesis — upcoming */}
            <div className="card mt-6 p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl grid place-items-center flex-shrink-0" style={{ background: "rgba(201,247,63,0.12)" }}>
                <Sparkles className="w-5 h-5" style={{ color: "var(--lime)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 14, fontWeight: 600 }}>AI Thesis by BEN</span>
                  <span className="mono" style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--lime)", border: "1px solid rgba(201,247,63,0.4)", borderRadius: 5, padding: "2px 6px" }}>Upcoming</span>
                </div>
                <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3 }}>Auto-generated bull/bear thesis, coming soon. Ask BEN anything with the chat button.</p>
              </div>
            </div>

            {/* Technicals — scroll down for detail (like the old Stock Intelligence) */}
            <div className="mt-6">
              <div className="mono" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--faint)", marginBottom: 10 }}>Technicals</div>
              <div className="grid grid-cols-2 gap-2.5">
                <TechCard label="RSI (14)" value={ind?.rsi?.value ?? "—"} sub={ind?.rsi?.label} />
                <TechCard label="MACD hist" value={ind?.macd?.hist != null ? ind.macd.hist.toFixed(2) : "—"} sub={ind?.macd?.label} tone={ind?.macd?.hist != null ? (ind.macd.hist >= 0 ? "up" : "down") : undefined} />
                <TechCard label="Bollinger width" value={ind?.bollinger?.width != null ? `${ind.bollinger.width.toFixed(1)}%` : "—"} sub={ind?.bollinger?.label} />
                <TechCard label="52w position" value={ind?.range52w ? `${ind.range52w.position.toFixed(0)}%` : "—"} sub="of the range" />
                <TechCard label="EMA 50" value={ind?.emas?.ema50 != null ? `$${ind.emas.ema50.toFixed(2)}` : "—"} />
                <TechCard label="EMA 200" value={ind?.emas?.ema200 != null ? `$${ind.emas.ema200.toFixed(2)}` : "—"} />
              </div>

              {pa && (
                <div className="card mt-3 divide-y" style={{ borderColor: "var(--line)" }}>
                  <PaRow label="Trend" value={pa.trend} />
                  <PaRow label="Momentum" value={pa.momentum} />
                  <PaRow label="Volume" value={pa.volatility} />
                  <PaRow label="Support" value={pa.support} />
                </div>
              )}
            </div>

            {/* Alert */}
            <button className="w-full mt-6 inline-flex items-center justify-center gap-1.5 text-[13.5px] font-semibold py-3 rounded-xl" style={{ background: "var(--lime)", color: "#0A0A0A" }}>
              <Bell className="w-4 h-4" /> Create alert
            </button>

            <p className="text-center mt-6" style={{ fontSize: 11, color: "var(--faint)" }}>Educational · not investment advice.</p>
          </>
        )}
      </div>
    </div>
  );
}

function TechCard({ label, value, sub, tone }: { label: string; value: string | number; sub?: string; tone?: "up" | "down" }) {
  return (
    <div className="card p-3.5">
      <div className="mono" style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--faint)" }}>{label}</div>
      <div className="mono" style={{ fontSize: 17, fontWeight: 600, marginTop: 4, color: tone === "up" ? "var(--up)" : tone === "down" ? "var(--down)" : "var(--ink)" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function PaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500 }}>{value || "—"}</span>
    </div>
  );
}
