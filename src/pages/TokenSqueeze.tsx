import { useEffect, useState } from "react";
import { Flame, Info, RefreshCw } from "lucide-react";
import { Seo } from "@/components/Seo";
import { TrackRecord } from "@/components/TrackRecord";
import { supabase } from "@/integrations/supabase/client";
import {
  SAMPLE_SQUEEZE,
  SIGNAL_META,
  fmtFunding,
  fmtVolume,
  type SqueezeToken,
} from "@/lib/squeeze";

function fmtPrice(p: number): string {
  if (p >= 1000) return p.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (p >= 1) return p.toFixed(2);
  if (p >= 0.01) return p.toFixed(4);
  return p.toPrecision(3);
}

export default function TokenSqueeze() {
  const [tokens, setTokens] = useState<SqueezeToken[]>(SAMPLE_SQUEEZE);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [tab, setTab] = useState<"radar" | "record">("radar");

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("token-squeeze-scan", { body: {} });
      const list = (data?.tokens ?? []) as SqueezeToken[];
      if (error || list.length === 0) {
        setTokens(SAMPLE_SQUEEZE);
        setLive(false);
      } else {
        setTokens(list);
        setLive(true);
      }
    } catch {
      setTokens(SAMPLE_SQUEEZE);
      setLive(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 lg:pb-12">
      <Seo
        title="Token Squeeze Radar — ScreenerPilot"
        description="Crypto short-squeeze radar: liquid tokens where shorts are paying funding while price turns up. Ranked by squeeze score."
        path="/squeeze"
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight inline-flex items-center gap-2">
              <Flame className="w-6 h-6 text-primary" /> Squeeze Radar
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tokens where shorts are paying funding while price turns up — ranked by squeeze score.
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex-shrink-0 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {/* Tabs */}
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
        {!live && (
          <div className="mt-4 flex items-start gap-2 text-[12px] text-muted-foreground bg-secondary/40 border border-border rounded-xl px-3 py-2.5">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary" />
            <span>Showing sample data. Deploy the <span className="font-mono">token-squeeze-scan</span> function to go live with real funding &amp; volume.</span>
          </div>
        )}

        {/* Header row */}
        <div className="mt-5 grid grid-cols-[28px_1fr_auto_auto_auto] sm:grid-cols-[32px_1fr_100px_110px_90px] gap-2 sm:gap-3 px-3 pb-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono">
          <span>#</span>
          <span>Token</span>
          <span className="text-right hidden sm:block">Funding</span>
          <span className="text-right">Price · 24h</span>
          <span className="text-right">Score</span>
        </div>

        <div className="fin-card divide-y divide-border/40 overflow-hidden">
          {tokens.map((t, i) => {
            const meta = SIGNAL_META[t.signal];
            const up = t.change24h >= 0;
            return (
              <div
                key={t.symbol}
                className="grid grid-cols-[28px_1fr_auto_auto_auto] sm:grid-cols-[32px_1fr_100px_110px_90px] gap-2 sm:gap-3 items-center px-3 py-3 hover:bg-secondary/40 transition-colors"
              >
                <span className="font-mono text-[13px] text-muted-foreground">{i + 1}</span>
                <div className="min-w-0">
                  <span className="font-mono font-semibold text-[15px]">{t.symbol}</span>
                  <div className="flex items-center gap-1.5 mt-1" title={`Model confidence ${Math.round(t.confidence * 100)}%`}>
                    <div className="h-1 w-14 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full bg-primary/70" style={{ width: `${Math.round(t.confidence * 100)}%` }} />
                    </div>
                    <span className="text-[9px] font-mono text-muted-foreground">{Math.round(t.confidence * 100)}%</span>
                  </div>
                </div>
                {/* Funding — negative is the squeeze fuel, highlight it */}
                <span className="text-right hidden sm:block font-mono text-[13px] text-primary">
                  {fmtFunding(t.funding)}
                </span>
                <div className="text-right">
                  <div className="font-mono text-[13px]">{fmtPrice(t.price)}</div>
                  <div className={`font-mono text-[11px] ${up ? "text-[#4ADE80]" : "text-[#FF5252]"}`}>
                    {up ? "+" : ""}{t.change24h.toFixed(1)}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-semibold text-[15px]" style={{ color: meta.color }}>
                    {t.score}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider font-mono" style={{ color: meta.color }}>
                    {meta.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
          Score is a multi-factor model: each signal (negative funding, momentum, liquidity) is
          normalized against the whole universe and blended logistically. The bar under each ticker
          is model confidence. Not financial advice — a high score is a setup, not a guarantee.
          Crypto perps only; fresh on-chain memecoins without perp markets aren't covered.
        </p>
        </>
        )}
      </div>
    </div>
  );
}
