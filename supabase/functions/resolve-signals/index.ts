// Resolves matured signals into signal_outcomes so the track record can be
// measured. For each recorded snapshot, once a horizon (1d / 1w / 1m) has
// elapsed it computes forward return + max drawdown from Binance daily klines
// and stores the outcome. Idempotent (skips already-resolved pairs). Meant to
// run daily. Strict cron guard.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const HORIZONS: Record<string, number> = { "1d": 1, "1w": 7, "1m": 30 }; // days
const DAY = 86_400_000;

type Kline = { t: number; high: number; low: number; close: number };

async function fetchKlines(symbol: string): Promise<Kline[]> {
  const url = `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}USDT&interval=1d&limit=40`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const raw = (await res.json()) as unknown[][];
  return raw.map((k) => ({
    t: k[0] as number,
    high: parseFloat(k[2] as string),
    low: parseFloat(k[3] as string),
    close: parseFloat(k[4] as string),
  }));
}

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
    const since = new Date(Date.now() - 35 * DAY).toISOString();

    const [{ data: snaps }, { data: outs }] = await Promise.all([
      supabase
        .from("signal_snapshots")
        .select("id, symbol, asset_type, price_at_signal, created_at")
        .eq("asset_type", "crypto")
        .gte("created_at", since)
        .limit(500),
      supabase.from("signal_outcomes").select("snapshot_id, horizon"),
    ]);

    if (!snaps?.length) {
      return new Response(JSON.stringify({ ok: true, resolved: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const done = new Set((outs ?? []).map((o) => `${o.snapshot_id}:${o.horizon}`));
    const now = Date.now();
    const klineCache = new Map<string, Kline[]>();
    const rows: Record<string, unknown>[] = [];

    for (const s of snaps) {
      const start = new Date(s.created_at).getTime();
      const p0 = Number(s.price_at_signal);
      if (!p0) continue;

      for (const [hz, days] of Object.entries(HORIZONS)) {
        if (done.has(`${s.id}:${hz}`)) continue;
        const endTs = start + days * DAY;
        if (now < endTs) continue; // not matured yet

        if (!klineCache.has(s.symbol)) klineCache.set(s.symbol, await fetchKlines(s.symbol));
        const kl = klineCache.get(s.symbol)!;
        if (!kl.length) continue;

        const window = kl.filter((k) => k.t >= start - DAY && k.t <= endTs + DAY);
        if (!window.length) continue;
        // end price = close of the kline nearest to (and not after) endTs
        const atEnd = window.filter((k) => k.t <= endTs).at(-1) ?? window.at(-1)!;
        const minLow = Math.min(...window.map((k) => k.low));

        rows.push({
          snapshot_id: s.id,
          horizon: hz,
          start_price: p0,
          end_price: atEnd.close,
          return_pct: ((atEnd.close - p0) / p0) * 100,
          max_drawdown: ((minLow - p0) / p0) * 100,
        });
      }
    }

    if (rows.length) {
      const { error } = await supabase.from("signal_outcomes").insert(rows);
      if (error) throw error;
    }

    return new Response(JSON.stringify({ ok: true, resolved: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
