// Public read of the model's track record. Aggregates signal_outcomes (joined to
// the score that was recorded at signal time) into hit rate + average forward
// return, overall and by score bucket — the proof that a higher score actually
// earns a higher forward return. Computed server-side with the service key so it
// works regardless of table RLS.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const BUCKETS = [
  { label: "<40", min: -1, max: 40 },
  { label: "40–55", min: 40, max: 55 },
  { label: "55–75", min: 55, max: 75 },
  { label: "75+", min: 75, max: 101 },
];
const HORIZONS = ["1d", "1w", "1m"];

interface Row {
  return_pct: number;
  max_drawdown: number;
  horizon: string;
  signal_snapshots: { score: number } | null;
}

const agg = (rows: Row[]) => {
  if (!rows.length) return { count: 0, hitRate: 0, avgReturn: 0, avgDrawdown: 0 };
  const rets = rows.map((r) => r.return_pct);
  const wins = rets.filter((r) => r > 0).length;
  return {
    count: rows.length,
    hitRate: Math.round((wins / rows.length) * 1000) / 10,
    avgReturn: Math.round((rets.reduce((a, b) => a + b, 0) / rows.length) * 100) / 100,
    avgDrawdown: Math.round((rows.reduce((a, b) => a + b.max_drawdown, 0) / rows.length) * 100) / 100,
  };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const [{ count: recorded }, { data }, { data: models }] = await Promise.all([
      supabase.from("signal_snapshots").select("*", { count: "exact", head: true }),
      supabase.from("signal_outcomes").select("return_pct, max_drawdown, horizon, signal_snapshots(score)").limit(5000),
      supabase.from("model_weights").select("asset_type, n_samples, updated_at"),
    ]);
    const rows = (data ?? []) as unknown as Row[];

    const byHorizon: Record<string, ReturnType<typeof agg>> = {};
    const byBucket: Record<string, { label: string; count: number; hitRate: number; avgReturn: number }[]> = {};
    for (const hz of HORIZONS) {
      const hzRows = rows.filter((r) => r.horizon === hz);
      byHorizon[hz] = agg(hzRows);
      byBucket[hz] = BUCKETS.map((b) => {
        const br = hzRows.filter((r) => (r.signal_snapshots?.score ?? -1) >= b.min && (r.signal_snapshots?.score ?? -1) < b.max);
        const a = agg(br);
        return { label: b.label, count: a.count, hitRate: a.hitRate, avgReturn: a.avgReturn };
      });
    }

    return new Response(
      JSON.stringify({ recorded: recorded ?? 0, resolved: rows.length, byHorizon, byBucket, models: models ?? [], updatedAt: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e), recorded: 0, resolved: 0 }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
