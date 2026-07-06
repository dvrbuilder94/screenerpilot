// Live quotes for ANY ticker (not just the collected universe). Takes a list
// of symbols, returns current price + 1-day change from Yahoo. Powers the
// watchlist so you can add any stock and see it live.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function fetchQuote(symbol: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`;
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!r.ok) return null;
    const j = await r.json();
    const res = j?.chart?.result?.[0];
    const meta = res?.meta;
    if (!meta) return null;
    const price = meta.regularMarketPrice ?? null;
    const prev = meta.chartPreviousClose ?? meta.previousClose ?? null;
    const changePct = price != null && prev ? ((price - prev) / prev) * 100 : null;
    return {
      symbol: symbol.toUpperCase(),
      name: meta.shortName || meta.longName || symbol.toUpperCase(),
      price,
      changePct: changePct != null ? Math.round(changePct * 100) / 100 : null,
      currency: meta.currency ?? "USD",
    };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const body = await req.json().catch(() => ({ symbols: [] }));
  const list: string[] = Array.isArray(body?.symbols) ? body.symbols.slice(0, 50) : [];
  const quotes = (await Promise.all(list.map(fetchQuote))).filter(Boolean);

  return new Response(JSON.stringify({ quotes }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
