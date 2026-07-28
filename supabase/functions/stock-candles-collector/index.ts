// Daily stock candle collector. Keeps asset_candles populated with '1d' bars for
// the active stock_universe symbols so the Stock Squeeze Radar has real data.
// Cron-only (x-cron-secret). Source: Yahoo Finance chart API (no key needed).
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { isAuthorizedCron } from "../_shared/cron-guard.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface Row {
  symbol: string; asset_type: string; interval: string; timestamp: number;
  open: number; high: number; low: number; close: number; volume: number;
}

async function fetchDaily(symbol: string): Promise<Row[]> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1y&interval=1d`,
      { headers: { "User-Agent": "Mozilla/5.0" } },
    );
    if (!res.ok) return [];
    const j = await res.json();
    const r = j?.chart?.result?.[0];
    const ts: number[] = r?.timestamp ?? [];
    const q = r?.indicators?.quote?.[0];
    if (!ts.length || !q) return [];
    const out: Row[] = [];
    for (let i = 0; i < ts.length; i++) {
      const o = q.open?.[i], h = q.high?.[i], l = q.low?.[i], c = q.close?.[i], v = q.volume?.[i];
      if ([o, h, l, c].some((x) => typeof x !== "number" || !isFinite(x))) continue;
      out.push({
        symbol, asset_type: "stock", interval: "1d",
        timestamp: ts[i] * 1000, open: o, high: h, low: l, close: c, volume: v ?? 0,
      });
    }
    return out.slice(-120);
  } catch {
    return [];
  }
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
    const { data: uni } = await supabase
      .from("stock_universe")
      .select("symbol")
      .eq("is_active", true)
      .limit(120);
    const symbols = ((uni ?? []) as { symbol: string }[]).map((u) => u.symbol);

    let inserted = 0, failed = 0;
    for (let i = 0; i < symbols.length; i += 8) {
      const chunk = symbols.slice(i, i + 8);
      const results = await Promise.all(chunk.map(fetchDaily));
      const rows = results.flat();
      if (rows.length) {
        const { error } = await supabase
          .from("asset_candles")
          .upsert(rows, { onConflict: "symbol,asset_type,interval,timestamp" });
        if (error) failed += chunk.length; else inserted += rows.length;
      }
      await new Promise((r) => setTimeout(r, 250));
    }

    return new Response(JSON.stringify({ ok: true, symbols: symbols.length, inserted, failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
