// Saves today's top squeeze picks to squeeze_daily_picks, then fills in
// next-day prices for yesterday's picks so performance tracking works.
// Call once daily before market open (e.g. 8am ET via Supabase cron).
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TOP_N = 5;

async function fetchCurrentPrice(symbol: string): Promise<number | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=5d&interval=1d&includePrePost=false`;
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!r.ok) return null;
    const j = await r.json();
    const closes: number[] = j?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
    const last = closes.filter((c) => c != null).at(-1);
    return last ?? null;
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const today = new Date().toISOString().slice(0, 10);

  // ── 1. Update next-day prices for yesterday's picks ──────────────────────
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const { data: prevPicks } = await supabase
    .from("squeeze_daily_picks")
    .select("id, symbol, price_at_pick")
    .eq("pick_date", yesterday)
    .is("price_next_day", null);

  if (prevPicks?.length) {
    await Promise.all(
      prevPicks.map(async (p) => {
        const price = await fetchCurrentPrice(p.symbol);
        if (price == null) return;
        const changePct = ((price - p.price_at_pick) / p.price_at_pick) * 100;
        await supabase
          .from("squeeze_daily_picks")
          .update({ price_next_day: price, change_pct: Math.round(changePct * 100) / 100 })
          .eq("id", p.id);
      })
    );
  }

  // ── 2. Save today's top picks (skip if already saved) ────────────────────
  const { count } = await supabase
    .from("squeeze_daily_picks")
    .select("id", { count: "exact", head: true })
    .eq("pick_date", today);

  if ((count ?? 0) > 0) {
    return new Response(
      JSON.stringify({ ok: true, skipped: true, reason: "already saved today" }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  const scanRes = await fetch(`${SUPABASE_URL}/functions/v1/squeeze-radar`, {
    headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
  });
  if (!scanRes.ok) {
    return new Response(JSON.stringify({ error: "squeeze-radar failed" }), { status: 502 });
  }
  const scan = await scanRes.json();
  const top = (scan?.candidates ?? []).slice(0, TOP_N);

  if (!top.length) {
    return new Response(JSON.stringify({ error: "no candidates" }), { status: 500 });
  }

  const rows = top.map((c: any, i: number) => ({
    pick_date: today,
    rank: i + 1,
    symbol: c.symbol,
    company_name: c.companyName,
    squeeze_score: c.squeezeScore,
    volume_ratio: c.volumeRatio,
    change_5d: c.change5d,
    price_at_pick: c.price,
  }));

  const { error } = await supabase.from("squeeze_daily_picks").insert(rows);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(
    JSON.stringify({ ok: true, date: today, saved: rows.length }),
    { headers: { "Content-Type": "application/json" } }
  );
});
