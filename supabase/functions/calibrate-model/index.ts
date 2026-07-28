// Self-calibration: re-fits the model's factor weights on realized outcomes.
// For each asset class, regresses "did the signal go up at the 1-week horizon?"
// on the per-factor z-scores recorded at signal time (logistic regression,
// ridge-regularized toward the priors so it degrades gracefully with little
// data). Writes the fitted weights to model_weights, which the scanners read.
// This feedback loop is what makes the model non-replicable — its weights are a
// function of the private outcome history. Daily/weekly schedule. Strict guard.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { CRYPTO_FACTORS, STOCK_FACTORS } from "../_shared/scan.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const HORIZON = "1w";
const MIN_SAMPLES = 60;

function fitLogit(X: number[][], y: number[], prior: number[]): number[] {
  const n = X.length, d = prior.length;
  const w = prior.slice();
  let b = 0;
  const lr = 0.08, l2 = 0.05, iters = 500;
  for (let it = 0; it < iters; it++) {
    const gw = new Array(d).fill(0);
    let gb = 0;
    for (let i = 0; i < n; i++) {
      let z = b;
      for (let k = 0; k < d; k++) z += w[k] * X[i][k];
      const p = 1 / (1 + Math.exp(-z));
      const e = p - y[i];
      for (let k = 0; k < d; k++) gw[k] += e * X[i][k];
      gb += e;
    }
    for (let k = 0; k < d; k++) w[k] -= lr * (gw[k] / n + l2 * (w[k] - prior[k]));
    b -= lr * gb / n;
  }
  return w.map((v) => Math.max(-3, Math.min(3, v)));
}

interface Row { return_pct: number; signal_snapshots: { asset_type: string; factors: Record<string, number> | null } | null }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const expected = Deno.env.get("CRON_SECRET");
  if (!expected || req.headers.get("x-cron-secret") !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data } = await supabase
      .from("signal_outcomes")
      .select("return_pct, signal_snapshots!inner(asset_type, factors)")
      .eq("horizon", HORIZON)
      .limit(8000);
    const rows = (data ?? []) as unknown as Row[];

    const results: Record<string, { fitted: boolean; n: number }> = {};

    for (const spec of [{ type: "crypto", base: CRYPTO_FACTORS }, { type: "stock", base: STOCK_FACTORS }]) {
      const keys = spec.base.map((f) => f.key);
      const prior = spec.base.map((f) => f.weight);
      const X: number[][] = [];
      const y: number[] = [];
      for (const r of rows) {
        const s = r.signal_snapshots;
        if (!s || s.asset_type !== spec.type || !s.factors) continue;
        const vec = keys.map((k) => s.factors![k]);
        if (vec.some((v) => typeof v !== "number" || !isFinite(v))) continue;
        X.push(vec);
        y.push(r.return_pct > 0 ? 1 : 0);
      }

      if (X.length < MIN_SAMPLES) {
        results[spec.type] = { fitted: false, n: X.length };
        continue;
      }

      const w = fitLogit(X, y, prior);
      const weights: Record<string, number> = {};
      keys.forEach((k, i) => (weights[k] = Math.round(w[i] * 1000) / 1000));

      await supabase
        .from("model_weights")
        .upsert(
          { asset_type: spec.type, horizon: HORIZON, weights, n_samples: X.length, updated_at: new Date().toISOString() },
          { onConflict: "asset_type,horizon" },
        );
      results[spec.type] = { fitted: true, n: X.length };
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
