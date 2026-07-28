// Resolves matured signals (crypto + stocks) into signal_outcomes. Crypto prices
// come from Binance klines, stock prices from asset_candles. For each snapshot,
// once a horizon (1d / 1w / 1m) elapses it stores forward return + max drawdown.
// Idempotent. Daily schedule. Strict cron guard.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { isAuthorizedCron } from "../_shared/cron-guard.ts";


const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const HORIZONS: Record<string, number> = { "1d": 1, "1w": 7, "1m": 30 };
const DAY = 86_400_000;

type Bar = { t: number; low: number; close: number };

async function cryptoPath(symbol: string): Promise<Bar[]> {
  const res = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}USDT&interval=1d&limit=40`);
  if (!res.ok) return [];
  const raw = (await res.json()) as unknown[][];
  return raw.map((k) => ({ t: k[0] as number, low: parseFloat(k[3] as string), close: parseFloat(k[4] as string) }));
}

async function stockPath(sb: ReturnType<typeof createClient>, symbol: string): Promise<Bar[]> {
  const { data } = await sb
    .from("asset_candles")
    .select("timestamp, low, close")
    .eq("symbol", symbol)
    .eq("interval", "1d")
    .order("timestamp", { ascending: true })
    .limit(60);
  return ((data ?? []) as { timestamp: number; low: number; close: number }[]).map((r) => ({
    t: r.timestamp < 1e12 ? r.timestamp * 1000 : r.timestamp, // normalize s → ms
    low: Number(r.low),
    close: Number(r.close),
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  if (!(await isAuthorizedCron(req, supabase))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {

    const since = new Date(Date.now() - 35 * DAY).toISOString();

    const [{ data: snaps }, { data: outs }] = await Promise.all([
      supabase.from("signal_snapshots").select("id, symbol, asset_type, price_at_signal, created_at").gte("created_at", since).limit(800),
      supabase.from("signal_outcomes").select("snapshot_id, horizon"),
    ]);
    if (!snaps?.length) {
      return new Response(JSON.stringify({ ok: true, resolved: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const done = new Set((outs ?? []).map((o) => `${o.snapshot_id}:${o.horizon}`));
    const now = Date.now();
    const pathCache = new Map<string, Bar[]>();
    const rows: Record<string, unknown>[] = [];

    for (const s of snaps) {
      const start = new Date(s.created_at).getTime();
      const p0 = Number(s.price_at_signal);
      if (!p0) continue;

      for (const [hz, days] of Object.entries(HORIZONS)) {
        if (done.has(`${s.id}:${hz}`)) continue;
        const endTs = start + days * DAY;
        if (now < endTs) continue;

        const key = `${s.asset_type}:${s.symbol}`;
        if (!pathCache.has(key)) {
          pathCache.set(key, s.asset_type === "stock" ? await stockPath(supabase, s.symbol) : await cryptoPath(s.symbol));
        }
        const path = pathCache.get(key)!;
        const window = path.filter((k) => k.t >= start - DAY && k.t <= endTs + DAY);
        if (!window.length) continue;

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
