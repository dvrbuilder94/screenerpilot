import { useMemo, useState } from "react";
import { Wallet, Search, Info, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { Seo } from "@/components/Seo";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import {
  SAMPLE_WALLET,
  SAMPLE_ANALYSIS,
  STATE_META,
  isEvmAddress,
  fmtUsd,
  WALLET_PERIODS,
  type WalletPnL,
  type WalletPeriod,
  type WalletPoint,
  type WalletAnalysis,
  type PositionAnalysis,
  type PositionState,
} from "@/lib/walletPnl";

const POS = "hsl(152 46% 56%)";
const NEG = "hsl(356 72% 66%)";
const ret = (v: number) => (v > 0 ? POS : v < 0 ? NEG : "hsl(var(--muted-foreground))");

function StateBadge({ state }: { state: PositionState }) {
  const meta = STATE_META[state];
  const color = meta.tone === "neg" ? NEG : meta.tone === "pos" ? POS : "hsl(var(--muted-foreground))";
  return (
    <span
      className="text-[9px] font-mono uppercase tracking-wider rounded px-1.5 py-0.5 border"
      style={{
        color,
        borderColor: `color-mix(in srgb, ${color}, transparent 62%)`,
        backgroundColor: `color-mix(in srgb, ${color}, transparent 88%)`,
      }}
    >
      {meta.label}
    </span>
  );
}

function Tile({ label, value, tone }: { label: string; value: number; tone?: "gain" | "plain" }) {
  const color = tone === "gain" ? ret(value) : undefined;
  const prefix = tone === "gain" && value > 0 ? "+" : "";
  return (
    <div className="fin-card p-4">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono">{label}</div>
      <div className="text-xl font-semibold mt-1 font-mono tabular-nums" style={{ color }}>{prefix}{fmtUsd(value)}</div>
    </div>
  );
}

function PortfolioChart({
  chart,
  period,
  onPeriod,
  loading,
  live,
}: {
  chart: WalletPoint[];
  period: WalletPeriod;
  onPeriod: (p: WalletPeriod) => void;
  loading: boolean;
  live: boolean;
}) {
  // Live data is already the requested period (server returns it). Sample data is
  // a fixed 90-day series, so we slice it client-side to mimic period switching.
  const view = useMemo(() => {
    if (live) return chart;
    const n = period === "week" ? 7 : period === "month" ? 30 : chart.length;
    return chart.slice(-n);
  }, [chart, period, live]);

  const first = view[0]?.v ?? 0;
  const last = view[view.length - 1]?.v ?? 0;
  const abs = last - first;
  const pct = first > 0 ? (abs / first) * 100 : 0;
  const up = abs >= 0;
  const color = up ? POS : NEG;

  const fmtTick = (t: number) => {
    const d = new Date(t);
    if (period === "week") return d.toLocaleDateString("en-US", { weekday: "short" });
    if (period === "year" || period === "max") return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const ChartTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;
    const p = payload[0].payload as WalletPoint;
    return (
      <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-[11px] text-muted-foreground mb-0.5">{new Date(p.t).toLocaleDateString()}</p>
        <p className="font-mono font-semibold text-foreground text-[13px] tabular-nums">{fmtUsd(p.v)}</p>
      </div>
    );
  };

  return (
    <section className="fin-card p-4 mt-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono">Portfolio evolution</div>
          <div className="text-[13px] font-mono mt-0.5 tabular-nums" style={{ color }}>
            {up ? "+" : ""}{fmtUsd(abs)} · {up ? "+" : ""}{pct.toFixed(1)}%
          </div>
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden flex-shrink-0">
          {WALLET_PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPeriod(p.id)}
              className={`px-2.5 h-8 text-[12px] font-medium transition-colors ${
                period === p.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-56 mt-3 relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40 text-[12px] text-muted-foreground">
            Loading…
          </div>
        )}
        {view.length < 2 ? (
          <div className="h-full flex items-center justify-center text-[12px] text-muted-foreground">
            No history for this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={view} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="walletGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="t"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickFormatter={fmtTick}
                interval="preserveStartEnd"
                minTickGap={44}
              />
              <YAxis
                domain={["dataMin", "dataMax"]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickFormatter={(v) => fmtUsd(v)}
                width={54}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill="url(#walletGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
        Total portfolio value across all chains over the selected window. The change is end value minus start value for the
        window — not realized PnL (see the tiles below for that).
      </p>
    </section>
  );
}

export default function WalletPnLPage() {
  const [address, setAddress] = useState("");
  const [analyzedAddr, setAnalyzedAddr] = useState("");
  const [data, setData] = useState<WalletPnL | null>(null);
  const [period, setPeriod] = useState<WalletPeriod>("month");
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [live, setLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<WalletAnalysis | null>(null);
  const [analysisLive, setAnalysisLive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const fetchWallet = async (addr: string, per: WalletPeriod): Promise<WalletPnL | null> => {
    const { data: res, error: err } = await supabase.functions.invoke("wallet-pnl", { body: { address: addr, period: per } });
    if (err || !res || (res as any).error || (res as any).needsKey) return null;
    return res as WalletPnL;
  };

  const analyze = async (e: React.FormEvent) => {
    e.preventDefault();
    const addr = address.trim();
    if (!isEvmAddress(addr)) { setError("Enter a valid EVM address (0x…)"); return; }
    setError(null);
    setLoading(true);
    setAnalysis(null); // a new wallet invalidates the previous position read
    setAnalysisLive(false);
    setAnalysisError(null);
    try {
      const res = await fetchWallet(addr, period);
      setData(res ?? SAMPLE_WALLET);
      setLive(!!res);
    } catch {
      setData(SAMPLE_WALLET);
      setLive(false);
    } finally {
      setAnalyzedAddr(addr);
      setLoading(false);
    }
  };

  // Period switch: live wallets re-fetch that period; sample data slices client-side.
  const changePeriod = async (per: WalletPeriod) => {
    if (per === period) return;
    setPeriod(per);
    if (!live || !analyzedAddr) return;
    setChartLoading(true);
    try {
      const res = await fetchWallet(analyzedAddr, per);
      if (res) setData(res);
    } finally {
      setChartLoading(false);
    }
  };

  // Technical read of each position worth > $10 (overbought / oversold / trend).
  // Real wallets score via wallet-pnl's analyze mode; the sample wallet shows the
  // sample read. A live wallet NEVER shows sample numbers — that would misstate
  // the user's real exposure.
  const runAnalysis = async () => {
    if (!analyzedAddr) return;
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      if (!live) { setAnalysis(SAMPLE_ANALYSIS); setAnalysisLive(false); return; }
      const { data: res, error: err } = await supabase.functions.invoke("wallet-pnl", {
        body: { address: analyzedAddr, period, analyze: true },
      });
      const payload = res as { analysis?: WalletAnalysis; error?: string; needsKey?: boolean } | null;
      if (err || !payload || payload.error || payload.needsKey || !payload.analysis) {
        setAnalysis(null);
        setAnalysisLive(false);
        setAnalysisError("Couldn't score your positions right now. Try again in a moment.");
      } else {
        setAnalysis(payload.analysis);
        setAnalysisLive(true);
      }
    } catch {
      setAnalysis(null);
      setAnalysisLive(false);
      setAnalysisError("Couldn't score your positions right now. Try again in a moment.");
    } finally {
      setAnalyzing(false);
    }
  };

  const posBySymbol = useMemo(() => {
    const m = new Map<string, PositionAnalysis>();
    (analysis?.positions ?? []).forEach((p) => m.set(p.symbol.toUpperCase(), p));
    return m;
  }, [analysis]);

  // Rollup is computed over SCORED positions only (those with enough price
  // history) — so percentages reflect what was actually measured, not tokens we
  // couldn't score.
  const rollup = useMemo(() => {
    const scored = (analysis?.positions ?? []).filter((p) => p.state !== "unknown");
    const total = scored.reduce((s, p) => s + p.value, 0);
    const ob = scored.filter((p) => p.state === "overbought");
    const obVal = ob.reduce((s, p) => s + p.value, 0);
    return {
      scoredCount: scored.length,
      total,
      obVal,
      obCount: ob.length,
      obPct: total > 0 ? (obVal / total) * 100 : 0,
      osCount: scored.filter((p) => p.state === "oversold").length,
    };
  }, [analysis]);

  const totalPnl = data ? data.realized + data.unrealized : 0;
  const maxChain = data ? Math.max(...data.byChain.map((c) => c.value), 1) : 1;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 lg:pb-12">
      <Seo title="Wallet PnL — ScreenerPilot" description="Multi-EVM wallet PnL: paste any address and see net invested, in/out flows, realized & unrealized gains across chains." path="/wallet" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight inline-flex items-center gap-2">
          <Wallet className="w-6 h-6 text-primary" /> Wallet PnL
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Paste any EVM address — see what you put in, took out and gained, across every chain.</p>

        <form onSubmit={analyze} className="relative mt-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x… wallet address"
            aria-label="Wallet address"
            autoComplete="off"
            spellCheck={false}
            className="h-14 pl-12 pr-28 text-[15px] font-mono bg-secondary/40"
          />
          <button type="submit" disabled={loading} className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium disabled:opacity-60">
            {loading ? "Reading…" : "Analyze"}
          </button>
        </form>
        {error && <p className="mt-2 text-[12px] text-destructive">{error}</p>}

        {data && (
          <>
            {!live && (
              <div className="mt-4 flex items-start gap-2 text-[12px] text-muted-foreground bg-secondary/40 border border-border rounded-xl px-3 py-2.5">
                <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary" />
                <span>Sample data. Set <span className="font-mono">ZERION_API_KEY</span> in Supabase and deploy <span className="font-mono">wallet-pnl</span> to read real wallets.</span>
              </div>
            )}

            {/* Headline */}
            <div className="fin-card p-5 mt-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono">Portfolio value</div>
                <div className="text-3xl font-semibold mt-1 font-mono tabular-nums">{fmtUsd(data.totalValue)}</div>
                <div className="text-[13px] font-mono mt-0.5 inline-flex items-center gap-1" style={{ color: ret(data.change1d) }}>
                  {data.change1d >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {data.change1d >= 0 ? "+" : ""}{data.change1d.toFixed(2)}% 24h
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono">Total PnL</div>
                <div className="text-2xl font-semibold mt-1 font-mono tabular-nums" style={{ color: ret(totalPnl) }}>
                  {totalPnl > 0 ? "+" : ""}{fmtUsd(totalPnl)}
                </div>
              </div>
            </div>

            {/* Portfolio value over time */}
            {data.chart && data.chart.length >= 2 && (
              <PortfolioChart
                chart={data.chart}
                period={period}
                onPeriod={changePeriod}
                loading={chartLoading}
                live={live}
              />
            )}

            {/* Flows + gains */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
              <Tile label="Net invested" value={data.netInvested} />
              <Tile label="Received in" value={data.received} />
              <Tile label="Sent out" value={data.sent} />
              <Tile label="Realized gain" value={data.realized} tone="gain" />
              <Tile label="Unrealized gain" value={data.unrealized} tone="gain" />
              <Tile label="Fees paid" value={data.fees} />
            </div>

            {/* Chain distribution */}
            {data.byChain.length > 0 && (
              <section className="mt-7">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-3">By chain</h2>
                <div className="fin-card divide-y divide-border/40 overflow-hidden">
                  {data.byChain.map((c) => (
                    <div key={c.chain} className="grid grid-cols-[90px_1fr_auto] gap-3 items-center px-4 py-2.5">
                      <span className="text-[13px] font-medium">{c.chain}</span>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-primary/70" style={{ width: `${(c.value / maxChain) * 100}%` }} />
                      </div>
                      <span className="font-mono text-[13px] text-right tabular-nums">{fmtUsd(c.value)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Holdings + per-position technical read */}
            {data.holdings.length > 0 && (
              <section className="mt-7">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Top holdings</h2>
                  <button
                    type="button"
                    onClick={runAnalysis}
                    disabled={analyzing}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-[12px] font-medium text-foreground hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-60"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    {analyzing ? "Analyzing…" : analysis ? "Re-analyze" : "Analyze positions"}
                  </button>
                </div>

                {analysisError && (
                  <div className="fin-card p-3.5 mb-3 flex items-start gap-2 text-[12.5px] text-muted-foreground">
                    <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary" />
                    <span>{analysisError}</span>
                  </div>
                )}

                {analysis && (
                  <div className="fin-card p-3.5 mb-3">
                    {rollup.scoredCount === 0 ? (
                      <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                        These holdings don't have enough price history on Zerion yet to score momentum — common for
                        newer on-chain tokens.
                      </p>
                    ) : (
                      <p className="text-[12.5px] leading-relaxed">
                        {rollup.obCount > 0 ? (
                          <>
                            <span className="font-mono font-semibold" style={{ color: NEG }}>{rollup.obPct.toFixed(0)}%</span> of scored
                            exposure ({fmtUsd(rollup.obVal)}) is in{" "}
                            <span style={{ color: NEG }}>overbought</span> tokens — momentum extended, higher pullback risk.
                          </>
                        ) : (
                          <>None of your scored positions are overbought right now.</>
                        )}
                        {rollup.osCount > 0 && (
                          <> {rollup.osCount} position{rollup.osCount > 1 ? "s are" : " is"}{" "}
                            <span style={{ color: POS }}>oversold</span>.</>
                        )}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      RSI(14) on ~30d of price · {rollup.scoredCount}/{analysis.analyzed} positions over ${analysis.minValue} scored
                      {!analysisLive && " · sample data"}.
                    </p>
                  </div>
                )}

                <div className="fin-card divide-y divide-border/40 overflow-hidden">
                  {data.holdings.map((h, i) => {
                    const a = posBySymbol.get(h.symbol.toUpperCase());
                    return (
                      <div key={`${h.symbol}-${i}`} className="flex items-start justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-semibold text-[14px]">{h.symbol}</span>
                            <span className="text-[12px] text-muted-foreground">{h.name}</span>
                            {h.chain && <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5">{h.chain}</span>}
                            {a && a.state !== "unknown" && <StateBadge state={a.state} />}
                          </div>
                          {a?.note && <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{a.note}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-mono text-[13px] tabular-nums">{fmtUsd(h.value)}</div>
                          {a?.rsi != null && (
                            <div className="text-[11px] font-mono text-muted-foreground tabular-nums mt-0.5">
                              RSI {a.rsi}
                              <span className="ml-1.5" style={{ color: ret(a.change1d) }}>
                                {a.change1d >= 0 ? "+" : ""}{a.change1d.toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <p className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
              PnL across 20+ EVM chains via Zerion. Net invested = value in − value out; realized/unrealized are computed from cost basis.
              Read-only, view any address. Not financial advice.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
