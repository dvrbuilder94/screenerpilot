// Refreshes live price + % return since entry for each founder pick.
// Pulls current price from Yahoo for any ticker (works beyond the collected
// universe). Call on a daily cron, or manually via the "Refresh" button.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function fetchCurrentPrice(symbol: string): Promise<number | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`;
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!r.ok) return null;
    const j = await r.json();
    const result = j?.chart?.result?.[0];
    const meta = result?.meta;
    if (meta?.regularMarketPrice != null) return meta.regularMarketPrice;
    const closes: number[] = result?.indicators?.quote?.[0]?.close ?? [];
    const last = closes.filter((c) => c != null).at(-1);
    return last ?? null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: picks, error } = await supabase
    .from("founder_picks")
    .select("id, symbol, entry_price");
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let updated = 0;
  await Promise.all(
    (picks ?? []).map(async (p) => {
      const price = await fetchCurrentPrice(p.symbol);
      if (price == null || !p.entry_price) return;
      const changePct = ((price - Number(p.entry_price)) / Number(p.entry_price)) * 100;
      const { error: upErr } = await supabase
        .from("founder_picks")
        .update({
          current_price: Math.round(price * 100) / 100,
          change_pct: Math.round(changePct * 10) / 10,
          updated_at: new Date().toISOString(),
        })
        .eq("id", p.id);
      if (!upErr) updated++;
    })
  );

  return new Response(
    JSON.stringify({ ok: true, updated }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
