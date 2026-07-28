import { useEffect, useState, useCallback } from "react";
import { Flame, Info, RefreshCw, ChevronDown } from "lucide-react";
import { Seo } from "@/components/Seo";
import { TrackRecord } from "@/components/TrackRecord";
import { supabase } from "@/integrations/supabase/client";
import {
  SAMPLE_SQUEEZE,
  SAMPLE_SQUEEZE_STOCKS,
  SIGNAL_META,
  FACTOR_LABELS,
  fmtFunding,
  type SqueezeToken,
  type SqueezeAsset,
} from "@/lib/squeeze";

function fmtPrice(p: number): string {
  if (p >= 1000) return p.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (p >= 1) return p.toFixed(2);
  if (p >= 0.01) return p.toFixed(4);
  return p.toPrecision(3);
}

const FN: Record<SqueezeAsset, string> = { crypto: "token-squeeze-scan", stock: "stock-squeeze-scan" };
const SAMPLE: Record<SqueezeAsset, SqueezeToken[]> = { crypto: SAMPLE_SQUEEZE, stock: SAMPLE_SQUEEZE_STOCKS };

// A z-score factor bar: centered, lime right / red left.
function FactorBar({ label, z }: { label: string; z: number }) {
  const pct = Math.min(50, (Math.abs(z) / 4) * 50);
  const pos = z >= 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-muted-foreground w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 flex items-center h-2">
        <div className="w-1/2 flex justify-end">
          {!pos && <div className="h-1.5 rounded-l-full bg-[#FF5252]/70" style={{ width: `${pct * 2}%` }} />}
        </div>
        <div className="w-px h-2 bg-border" />
        <div className="w-1/2">
          {pos && <div className="h-1.5 rounded-r-full bg-primary/70" style={{ width: `${pct * 2}%` }} />}
        </div>
      </div>
      <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{z.toFixed(1)}</span>
    </div>
  );
}

export default function TokenSqueeze() {
  const [asset, setAsset] = useState<SqueezeAsset>("crypto");
  const [tokens, setTokens] = useState<SqueezeToken[]>(SAMPLE_SQUEEZE);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [tab, setTab] = useState<"radar" | "record">("radar");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async (a: SqueezeAsset) => {
    setLoading(true);
    setExpanded(null);
    try {
      const { data, error } = await supabase.functions.invoke(FN[a], { body: {} });
      const list = (data?.tokens ?? []) as SqueezeToken[];
      if (error || list.length === 0) {
        setTokens(SAMPLE[a]);
        setLive(false);
      } else {
        setTokens(list);
        setLive(true);
      }
    } catch {
      setTokens(SAMPLE[a]);
      setLive(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(asset);
  }, [asset, load]);

  const primaryLabel = asset === "crypto" ? "Funding" : "Setup";

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 lg:pb-12">
      <Seo
        title="Squeeze Radar — ScreenerPilot"
        description="Short-squeeze radar for stocks and crypto — a multi-factor model with a live track record."
        path="/squeeze"
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight inline-flex items-center gap-2">
              <Flame className="w-6 h-6 text-primary" /> Squeeze Radar
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Multi-factor squeeze model for stocks &amp; crypto — with a live track record.
            </p>
          </div>
          <button
            onClick={() => load(asset)}
            disabled={loading}
            className="flex-shrink-0 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {/* Radar / Track record tabs */}
        <div className="flex gap-1.5 mt-5 border-b border-border/40 pb-3">
          {([["radar", "Radar"], ["record", "Track record"]] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`text-[13px] font-medium px-3 py-1.5 rounded-lg transition-colors ${
                tab === k ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "record" && <TrackRecord />}

        {tab === "radar" && (
          <>
            {/* Asset lane */}
            <div className="flex gap-1.5 mt-4">
              {([["crypto", "Crypto"], ["stock", "Stocks"]] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setAsset(k)}
                  className={`text-[12px] font-medium px-3.5 py-1.5 rounded-lg transition-colors ${
                    asset === k ? "bg-primary text-primary-foreground" : "text-muted-foreground border border-border hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {!live && (
              <div className="mt-4 flex items-start gap-2 text-[12px] text-muted-foreground bg-secondary/40 border border-border rounded-xl px-3 py-2.5">
                <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary" />
                <span>
                  Sample data. Deploy <span className="font-mono">{FN[asset]}</span> to go live.
                </span>
              </div>
            )}

            <div className="mt-5 grid grid-cols-[28px_1fr_auto_auto_auto] sm:grid-cols-[32px_1fr_100px_110px_90px] gap-2 sm:gap-3 px-3 pb-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono">
              <span>#</span>
              <span>Ticker</span>
              <span className="text-right hidden sm:block">{primaryLabel}</span>
              <span className="text-right">Price · 24h</span>
              <span className="text-right">Score</span>
            </div>

            <div className="fin-card divide-y divide-border/40 overflow-hidden">
              {tokens.map((t, i) => {
                const meta = SIGNAL_META[t.signal];
                const up = t.change24h >= 0;
                const isOpen = expanded === t.symbol;
                return (
                  <div key={t.symbol}>
                    <button
                      onClick={() => setExpanded(isOpen ? null : t.symbol)}
                      className="w-full grid grid-cols-[28px_1fr_auto_auto_auto] sm:grid-cols-[32px_1fr_100px_110px_90px] gap-2 sm:gap-3 items-center px-3 py-3 hover:bg-secondary/40 transition-colors text-left"
                    >
                      <span className="font-mono text-[13px] text-muted-foreground">{i + 1}</span>
                      <div className="min-w-0 flex items-center gap-1.5">
                        <div>
                          <span className="font-mono font-semibold text-[15px]">{t.symbol}</span>
                          <div className="flex items-center gap-1.5 mt-1" title={`Model confidence ${Math.round(t.confidence * 100)}%`}>
                            <div className="h-1 w-14 rounded-full bg-secondary overflow-hidden">
                              <div className="h-full bg-primary/70" style={{ width: `${Math.round(t.confidence * 100)}%` }} />
                            </div>
                            <span className="text-[9px] font-mono text-muted-foreground">{Math.round(t.confidence * 100)}%</span>
                          </div>
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </div>
                      <span className="text-right hidden sm:block font-mono text-[13px] text-primary">
                        {asset === "crypto" ? fmtFunding(t.funding ?? 0) : t.setup}
                      </span>
                      <div className="text-right">
                        <div className="font-mono text-[13px]">{fmtPrice(t.price)}</div>
                        <div className={`font-mono text-[11px] ${up ? "text-[#4ADE80]" : "text-[#FF5252]"}`}>
                          {up ? "+" : ""}{t.change24h.toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-semibold text-[15px]" style={{ color: meta.color }}>{t.score}</div>
                        <div className="text-[9px] uppercase tracking-wider font-mono" style={{ color: meta.color }}>{meta.label}</div>
                      </div>
                    </button>
                    {isOpen && t.factors && (
                      <div className="px-4 pb-4 pt-1 space-y-1.5 bg-secondary/20">
                        <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono mb-1.5">Why — factor z-scores</div>
                        {Object.entries(t.factors).map(([k, z]) => (
                          <FactorBar key={k} label={FACTOR_LABELS[k] ?? k} z={z} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
              Each factor is normalized against the whole universe and blended logistically into a 0–100
              score. Stocks use a TTM-squeeze read (Bollinger coiled inside Keltner + momentum); crypto uses
              perp funding + momentum + liquidity. Tap a row for the factor breakdown. Not financial advice.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
