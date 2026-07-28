import { useEffect, useState } from "react";
import { Activity, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface HorizonAgg { count: number; hitRate: number; avgReturn: number; avgDrawdown: number }
interface BucketRow { label: string; count: number; hitRate: number; avgReturn: number }
interface ModelInfo { asset_type: string; n_samples: number; updated_at: string }
interface TR {
  recorded: number;
  resolved: number;
  byHorizon: Record<string, HorizonAgg>;
  byBucket: Record<string, BucketRow[]>;
  models?: ModelInfo[];
  updatedAt: string;
}

const HORIZONS = ["1d", "1w", "1m"] as const;
const HZ_LABEL: Record<string, string> = { "1d": "1 day", "1w": "1 week", "1m": "1 month" };

const retColor = (v: number) => (v > 0 ? "#4ADE80" : v < 0 ? "#FF5252" : "#9A9AA5");

export function TrackRecord() {
  const [data, setData] = useState<TR | null>(null);
  const [loading, setLoading] = useState(true);
  const [hz, setHz] = useState<string>("1w");

  useEffect(() => {
    (async () => {
      try {
        const { data: d } = await supabase.functions.invoke("track-record", { body: {} });
        setData(d as TR);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Loading track record…</div>;
  }

  const resolved = data?.resolved ?? 0;
  const recorded = data?.recorded ?? 0;

  // Nothing resolved yet — the clock has started but no horizon has matured.
  if (resolved === 0) {
    return (
      <div className="mt-6 fin-card p-8 text-center">
        <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Activity className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-base font-semibold">Track record is building</h3>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">
          {recorded > 0
            ? `${recorded.toLocaleString()} signals recorded. Outcomes appear here once the first horizon (1 day) matures.`
            : "No signals recorded yet. Once the daily recorder runs, results will accrue here — timestamped and verifiable."}
        </p>
      </div>
    );
  }

  const h = data!.byHorizon[hz] ?? { count: 0, hitRate: 0, avgReturn: 0, avgDrawdown: 0 };
  const buckets = data!.byBucket[hz] ?? [];

  return (
    <div className="mt-5">
      {/* Horizon selector */}
      <div className="flex gap-1.5">
        {HORIZONS.map((x) => (
          <button
            key={x}
            onClick={() => setHz(x)}
            className={`text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors ${
              hz === x ? "bg-primary text-primary-foreground" : "text-muted-foreground border border-border hover:text-foreground"
            }`}
          >
            {HZ_LABEL[x]}
          </button>
        ))}
      </div>

      {/* Headline tiles */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="fin-card p-4">
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono">Hit rate</div>
          <div className="text-2xl font-semibold mt-1 font-mono">{h.hitRate}%</div>
        </div>
        <div className="fin-card p-4">
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono">Avg return</div>
          <div className="text-2xl font-semibold mt-1 font-mono" style={{ color: retColor(h.avgReturn) }}>
            {h.avgReturn > 0 ? "+" : ""}{h.avgReturn}%
          </div>
        </div>
        <div className="fin-card p-4">
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono">Resolved</div>
          <div className="text-2xl font-semibold mt-1 font-mono">{h.count.toLocaleString()}</div>
        </div>
      </div>

      {/* Score-bucket validation: does a higher score earn a higher forward return? */}
      <h3 className="mt-7 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground inline-flex items-center gap-1.5">
        <TrendingUp className="w-3 h-3" /> Forward return by score
      </h3>
      <p className="text-[12px] text-muted-foreground mt-1 mb-3">
        If the model works, average return should climb with the score bucket.
      </p>
      <div className="fin-card divide-y divide-border/40 overflow-hidden">
        {buckets.map((b) => (
          <div key={b.label} className="grid grid-cols-[70px_1fr_auto_auto] gap-3 items-center px-4 py-3">
            <span className="font-mono text-[13px] font-semibold">{b.label}</span>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, Math.abs(b.avgReturn) * 6)}%`,
                  background: retColor(b.avgReturn),
                }}
              />
            </div>
            <span className="font-mono text-[13px] text-right w-16" style={{ color: retColor(b.avgReturn) }}>
              {b.avgReturn > 0 ? "+" : ""}{b.avgReturn}%
            </span>
            <span className="font-mono text-[11px] text-muted-foreground text-right w-20">
              {b.hitRate}% · n={b.count}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[11px] text-muted-foreground">
        {recorded.toLocaleString()} signals recorded · {resolved.toLocaleString()} outcomes resolved.
        Timestamped on-record — not back-fitted.
      </p>

      {data!.models && data!.models.some((m) => m.n_samples > 0) && (
        <p className="mt-1.5 text-[11px] text-primary/90">
          ⚙︎ Self-calibrating — weights re-fit on realized outcomes:{" "}
          {data!.models.filter((m) => m.n_samples > 0).map((m) => `${m.asset_type} (n=${m.n_samples})`).join(" · ")}
        </p>
      )}
    </div>
  );
}
