import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWatchlist } from "@/hooks/useWatchlist";
import { cleanTicker } from "@/lib/ticker";
import type { Analysis, Timeframe } from "@/types/analysis";
import { buildDecisionSnapshot } from "@/lib/analysis/decisionSnapshot";
import { readAssetState, diffAssetState } from "@/lib/analysis/assetChanges";
import { loadAssetState, saveAssetState } from "@/lib/analysis/assetHistory";
import { Seo } from "@/components/Seo";
import { Activity, Bell, ChevronLeft, Heart, Loader2, ShieldAlert, Sparkles } from "lucide-react";

const PERIODS: { label: string; tf: Timeframe }[] = [
  { label: "1Y", tf: "daily" },
  { label: "5Y", tf: "weekly" },
  { label: "10Y", tf: "monthly" },
];

async function fetchAnalysis(symbol: string, tf: Timeframe): Promise<Analysis> {
  const { data, error } = await supabase.functions.invoke("analyze-stock", {
    body: { symbol, timeframe: tf },
  });
  if (error || data?.error) throw new Error(data?.error || "Could not load");
  return data as Analysis;
}

function InteractiveChart({ close, timestamps, onHover }: {
  close: number[];
  timestamps?: number[];
  onHover: (info: { price: number; date: string } | null) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const hoverRef = useRef<number | null>(null);
  const pad = 6;

  const draw = useCallback(() => {
    const canvas = ref.current;
    if (!canvas || close.length < 2) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const min = Math.min(...close);
    const max = Math.max(...close);
    const x = (index: number) => pad + (index / (close.length - 1)) * (rect.width - pad * 2);
    const y = (value: number) => rect.height - pad - ((value - min) / (max - min || 1)) * (rect.height - pad * 2);

    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.beginPath();
    ctx.moveTo(x(0), y(close[0]));
    for (let i = 1; i < close.length; i += 1) ctx.lineTo(x(i), y(close[i]));
    ctx.lineTo(x(close.length - 1), rect.height - pad);
    ctx.lineTo(x(0), rect.height - pad);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, pad, 0, rect.height);
    gradient.addColorStop(0, "rgba(142,155,227,0.22)");
    gradient.addColorStop(1, "rgba(142,155,227,0)");
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x(0), y(close[0]));
    for (let i = 1; i < close.length; i += 1) ctx.lineTo(x(i), y(close[i]));
    ctx.strokeStyle = "#8E9BE3";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();

    const hoverIndex = hoverRef.current;
    if (hoverIndex != null) {
      const hoverX = x(hoverIndex);
      const hoverY = y(close[hoverIndex]);
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hoverX, pad);
      ctx.lineTo(hoverX, rect.height - pad);
      ctx.stroke();
      ctx.beginPath();
      ctx.fillStyle = "#8E9BE3";
      ctx.arc(hoverX, hoverY, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [close]);

  useEffect(() => {
    draw();
    const canvas = ref.current;
    if (!canvas || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [draw]);

  const move = (clientX: number) => {
    const canvas = ref.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const progress = (clientX - rect.left - pad) / (rect.width - pad * 2);
    const index = Math.max(0, Math.min(close.length - 1, Math.round(progress * (close.length - 1))));
    hoverRef.current = index;
    draw();
    const timestamp = timestamps?.[index];
    onHover({
      price: close[index],
      date: timestamp
        ? new Date(timestamp * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "",
    });
  };

  return (
    <canvas
      ref={ref}
      className="block h-[190px] w-full"
      style={{ touchAction: "none" }}
      onPointerMove={(event) => move(event.clientX)}
      onPointerDown={(event) => move(event.clientX)}
      onPointerLeave={() => {
        hoverRef.current = null;
        draw();
        onHover(null);
      }}
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

  const analysisQ = useQuery({
    queryKey: ["asset-analysis", sym, tf],
    queryFn: () => fetchAnalysis(sym, tf),
    enabled: Boolean(sym),
    staleTime: 60_000,
    retry: 1,
  });

  const analysis = analysisQ.data;
  const snapshot = useMemo(() => (analysis ? buildDecisionSnapshot(analysis, { timeframe: tf }) : null), [analysis, tf]);

  // "What changed" — diff the current read against the user's last view of this
  // asset (device-local), then persist the new state. Real deltas only.
  const currentState = useMemo(
    () => (analysis && snapshot ? readAssetState(analysis, snapshot) : null),
    [analysis, snapshot],
  );
  const changes = useMemo(
    () => (currentState ? diffAssetState(loadAssetState(sym), currentState) : null),
    [currentState, sym],
  );
  useEffect(() => {
    if (currentState) saveAssetState(sym, currentState);
  }, [currentState, sym]);
  const indicators = analysis?.indicators;
  const priceAction = analysis?.priceAction;
  const up = (analysis?.dayChangePercent ?? 0) >= 0;

  return (
    <div className="assetdetail min-h-screen pb-28 lg:pb-12">
      <style>{`
        .assetdetail { --bg:#13161F; --panel:#1B1F29; --ink:#F0F1F7; --muted:#9A9AA5; --faint:#656975; --line:rgba(255,255,255,0.08); --accent:#8E9BE3; --up:#4ADE80; --down:#FF6262; background:var(--bg); color:var(--ink); }
        .assetdetail .wrap { max-width:720px; margin:0 auto; padding:14px 20px 40px; }
        .assetdetail .mono { font-family:ui-monospace,"SF Mono",Menlo,Monaco,Consolas,monospace; }
        .assetdetail .card { background:var(--panel); border:1px solid var(--line); border-radius:16px; }
        .assetdetail .stat { background:var(--bg); padding:11px 13px; }
        .assetdetail .period { font-family:ui-monospace,"SF Mono",monospace; font-size:11px; padding:6px 0; border-radius:8px; background:none; color:var(--muted); flex:1; }
        .assetdetail .period.active { background:var(--accent); color:#0A0A0A; font-weight:700; }
      `}</style>

      <Seo title={`${sym} | ScreenerPilot`} description={`Decision snapshot, chart and technicals for ${sym}.`} path={`/asset/${sym}`} />

      <div className="wrap">
        <Link to="/watchlist" className="inline-flex items-center gap-1 text-[13px]" style={{ color: "var(--muted)" }}>
          <ChevronLeft className="h-4 w-4" /> Watchlist
        </Link>

        {analysisQ.isLoading ? (
          <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : analysisQ.error || !analysis || !snapshot ? (
          <div className="card mt-6 p-8 text-center" style={{ color: "var(--muted)" }}>Could not load {sym}. Check the ticker and try again.</div>
        ) : (
          <>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-baseline gap-2.5">
                  <span className="mono text-[30px] font-bold tracking-tight">{cleanTicker(analysis.symbol)}</span>
                  <span className="text-sm" style={{ color: "var(--muted)" }}>{analysis.companyName}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
                  <span className="mono text-[32px] font-semibold tracking-tight">${analysis.price?.toFixed(2)}</span>
                  {analysis.dayChangePercent != null && (
                    <span className="mono text-[15px] font-semibold" style={{ color: up ? "var(--up)" : "var(--down)" }}>
                      {up ? "+" : ""}{analysis.dayChangePercent.toFixed(2)}% today
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => toggle(sym)}
                aria-label={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
                className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full border"
                style={{
                  borderColor: inWatchlist ? "var(--accent)" : "var(--line)",
                  background: inWatchlist ? "rgba(142,155,227,0.12)" : "transparent",
                  color: inWatchlist ? "var(--accent)" : "var(--muted)",
                }}
              >
                <Heart className="h-5 w-5" fill={inWatchlist ? "currentColor" : "none"} />
              </button>
            </div>

            <div className="card mt-5 overflow-hidden">
              <div className="flex items-start justify-between gap-4 p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" style={{ color: "var(--accent)" }} />
                    <span className="mono text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--faint)" }}>Decision snapshot</span>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold">{snapshot.bias} setup</h2>
                  <p className="mt-2 text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>{snapshot.summary}</p>
                  <div className="mono mt-2 text-[10px]" style={{ color: "var(--faint)" }}>
                    {snapshot.horizon} · {snapshot.methodologyVersion} · as of {new Date(snapshot.computedAt).toLocaleString()}
                  </div>
                  {snapshot.warnings.length > 0 && (
                    <p className="mt-1.5 text-[11.5px]" style={{ color: "var(--down)" }}>{snapshot.warnings.join(" ")}</p>
                  )}
                </div>
                <div className="mono rounded-full border px-3 py-1.5 text-center text-[11px]" title={snapshot.confidenceBasis} style={{ borderColor: "var(--line)", color: "var(--accent)" }}>
                  {snapshot.confidence}%
                  <div className="text-[8.5px]" style={{ color: "var(--faint)" }}>signal alignment</div>
                </div>
              </div>

              <div className="grid gap-px border-t md:grid-cols-2" style={{ background: "var(--line)", borderColor: "var(--line)" }}>
                <Evidence title="Supporting evidence" items={snapshot.evidenceFor} tone="up" />
                <Evidence title="Risks and contradictions" items={snapshot.evidenceAgainst} tone="down" />
              </div>

              <div className="flex gap-3 border-t p-4" style={{ borderColor: "var(--line)" }}>
                <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: "var(--accent)" }} />
                <div>
                  <div className="mono text-[9px] uppercase tracking-[0.12em]" style={{ color: "var(--faint)" }}>Invalidation</div>
                  <p className="mt-1 text-[12.5px]" style={{ color: "var(--muted)" }}>{snapshot.invalidation}</p>
                </div>
              </div>
            </div>

            {changes && (changes.firstLook || changes.changes.length > 0) && (
              <div className="card mt-4 p-4">
                <div className="mono mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--faint)" }}>
                  <Activity className="h-3 w-3" /> What changed
                </div>
                {changes.firstLook ? (
                  <p className="text-[12.5px]" style={{ color: "var(--muted)" }}>First look at this asset — we'll track changes from here.</p>
                ) : (
                  <>
                    <ul className="space-y-1.5">
                      {changes.changes.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-[12.5px]">
                          <span style={{ color: c.tone === "positive" ? "var(--up)" : c.tone === "negative" ? "var(--down)" : "var(--muted)" }}>•</span>
                          <span>{c.label}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mono mt-2 text-[10px]" style={{ color: "var(--faint)" }}>since your last view</div>
                  </>
                )}
              </div>
            )}

            <div className="card mt-4 grid grid-cols-3 gap-px overflow-hidden" style={{ background: "var(--line)" }}>
              <Stat label="Market cap" value={analysis.marketCap || "—"} />
              <Stat label="RSI" value={indicators?.rsi?.value ?? "—"} />
              <Stat label="52w range" value={indicators?.range52w ? `$${indicators.range52w.low.toFixed(0)}–$${indicators.range52w.high.toFixed(0)}` : "—"} />
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex flex-1 gap-1">
                  {PERIODS.map((period) => (
                    <button key={period.tf} className={`period ${tf === period.tf ? "active" : ""}`} style={{ maxWidth: 70 }} onClick={() => setTf(period.tf)}>
                      {period.label}
                    </button>
                  ))}
                </div>
                {hover && (
                  <div className="mono min-w-[120px] text-right">
                    <div className="text-[15px] font-semibold">${hover.price.toFixed(2)}</div>
                    <div className="text-[10.5px]" style={{ color: "var(--faint)" }}>{hover.date}</div>
                  </div>
                )}
              </div>
              {analysis.chart?.close && analysis.chart.close.length > 1 ? (
                <InteractiveChart close={analysis.chart.close} timestamps={analysis.chart.timestamps} onHover={setHover} />
              ) : (
                <div className="flex h-[190px] items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>
              )}
            </div>

            <div className="mt-6">
              <div className="mono mb-2.5 text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--faint)" }}>Technicals</div>
              <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
                <TechCard label="RSI (14)" value={indicators?.rsi?.value ?? "—"} sub={indicators?.rsi?.label} />
                <TechCard label="MACD hist" value={indicators?.macd?.hist != null ? indicators.macd.hist.toFixed(2) : "—"} sub={indicators?.macd?.label} tone={indicators?.macd?.hist != null ? (indicators.macd.hist >= 0 ? "up" : "down") : undefined} />
                <TechCard label="Bollinger width" value={indicators?.bollinger?.width != null ? `${indicators.bollinger.width.toFixed(1)}%` : "—"} sub={indicators?.bollinger?.label} />
                <TechCard label="52w position" value={indicators?.range52w ? `${indicators.range52w.position.toFixed(0)}%` : "—"} sub="of the range" />
                <TechCard label="EMA 50" value={indicators?.emas?.ema50 != null ? `$${indicators.emas.ema50.toFixed(2)}` : "—"} />
                <TechCard label="EMA 200" value={indicators?.emas?.ema200 != null ? `$${indicators.emas.ema200.toFixed(2)}` : "—"} />
              </div>

              {priceAction && (
                <div className="card mt-3 divide-y" style={{ borderColor: "var(--line)" }}>
                  <PaRow label="Trend" value={priceAction.trend} />
                  <PaRow label="Momentum" value={priceAction.momentum} />
                  <PaRow label="Volatility" value={priceAction.volatility} />
                  <PaRow label="Support" value={priceAction.support} />
                </div>
              )}
            </div>

            <button className="mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-[13.5px] font-semibold" style={{ background: "var(--accent)", color: "#0A0A0A" }}>
              <Bell className="h-4 w-4" /> Create alert
            </button>

            <p className="mt-6 text-center text-[11px]" style={{ color: "var(--faint)" }}>
              Rules-based interpretation of current data · educational, not investment advice.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Evidence({ title, items, tone }: { title: string; items: string[]; tone: "up" | "down" }) {
  return (
    <div className="min-h-[150px] bg-[var(--panel)] p-4">
      <div className="mono text-[9px] uppercase tracking-[0.12em]" style={{ color: tone === "up" ? "var(--up)" : "var(--down)" }}>{title}</div>
      {items.length ? (
        <ul className="mt-3 space-y-2">
          {items.map((item) => <li key={item} className="text-[12.5px] leading-relaxed" style={{ color: "var(--muted)" }}>• {item}</li>)}
        </ul>
      ) : (
        <p className="mt-3 text-[12.5px]" style={{ color: "var(--faint)" }}>No strong signal detected.</p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <div className="text-[9.5px] uppercase tracking-[0.1em]" style={{ color: "var(--faint)" }}>{label}</div>
      <div className="mono mt-1 text-[14px] font-semibold">{value}</div>
    </div>
  );
}

function TechCard({ label, value, sub, tone }: { label: string; value: string | number; sub?: string; tone?: "up" | "down" }) {
  return (
    <div className="card p-3.5">
      <div className="mono text-[9px] uppercase tracking-[0.08em]" style={{ color: "var(--faint)" }}>{label}</div>
      <div className="mono mt-1 text-[17px] font-semibold" style={{ color: tone === "up" ? "var(--up)" : tone === "down" ? "var(--down)" : "var(--ink)" }}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px]" style={{ color: "var(--muted)" }}>{sub}</div>}
    </div>
  );
}

function PaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-[12.5px]" style={{ color: "var(--muted)" }}>{label}</span>
      <span className="text-[13px] font-medium">{value || "—"}</span>
    </div>
  );
}
