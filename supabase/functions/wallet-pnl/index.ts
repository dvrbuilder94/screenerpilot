// Wallet PnL — multi-EVM portfolio + profit/loss for an address via the Zerion
// API. The API key stays server-side. Set ZERION_API_KEY in Supabase to go live;
// without it the function returns needsKey and the UI falls back to sample data.
//
// Two modes on the same endpoint (so there's only one function to deploy):
//   default          → portfolio value, PnL, chain split, holdings, value chart.
//   { analyze: true } → per-position technical read (RSI → overbought/oversold)
//                       for holdings worth more than $10. Heavier (one price-
//                       history call per position), so it's opt-in behind the flag.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { rsiLast, sma } from "../_shared/ta.ts";

const ZERION = "https://api.zerion.io/v1";
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const isEvm = (a: string) => /^0x[0-9a-fA-F]{40}$/.test(a);

const MIN_VALUE = 10; // only analyze positions worth more than this
const MAX_POSITIONS = 12; // bound the number of per-token price-history calls

type State = "overbought" | "oversold" | "neutral" | "unknown";
const classify = (rsi: number): State =>
  !Number.isFinite(rsi) ? "unknown" : rsi >= 70 ? "overbought" : rsi <= 30 ? "oversold" : "neutral";

const POSITIONS_PATH = (addr: string) =>
  `/wallets/${addr}/positions?currency=usd&filter[trash]=only_non_trash&filter[position_types]=wallet&sort=-value&page[size]=100`;

function mapPositions(positions: any) {
  return ((positions?.data ?? []) as Array<Record<string, any>>).map((p) => ({
    fungibleId: p.relationships?.fungible?.data?.id ?? "",
    symbol: p.attributes?.fungible_info?.symbol ?? "?",
    name: p.attributes?.fungible_info?.name ?? "",
    chain: cap(p.relationships?.chain?.data?.id ?? ""),
    value: Number(p.attributes?.value) || 0,
    price: Number(p.attributes?.price) || 0,
    change1d: Number(p.attributes?.changes?.percent_1d) || 0,
  }));
}

async function buildAnalysis(raw: ReturnType<typeof mapPositions>, getJson: (p: string) => Promise<any>) {
  const candidates = raw
    .filter((p) => p.value > MIN_VALUE && p.fungibleId)
    .sort((a, b) => b.value - a.value)
    .slice(0, MAX_POSITIONS);

  const positions = [];
  for (const c of candidates) {
    // ~1 month of points → enough to read RSI(14) and a recent-range position.
    const chart = await getJson(`/fungibles/${c.fungibleId}/charts/month?currency=usd`);
    const pts = (chart?.data?.attributes?.points ?? []) as Array<[number, number]>;
    const closes = pts.map(([, v]) => Number(v)).filter((v) => Number.isFinite(v) && v > 0);

    let rsi: number | null = null;
    let state: State = "unknown";
    let trendUp = c.change1d >= 0;
    let pctFromHigh = 0;

    if (closes.length >= 15) {
      const r = rsiLast(closes, 14);
      rsi = Number.isFinite(r) ? Math.round(r) : null;
      state = classify(r);
      const last = closes[closes.length - 1];
      const hi = Math.max(...closes);
      pctFromHigh = hi > 0 ? ((last - hi) / hi) * 100 : 0; // <= 0
      const ref = sma(closes, Math.min(20, closes.length));
      if (Number.isFinite(ref)) trendUp = last >= ref;
    }

    const note =
      state === "overbought"
        ? `RSI ${rsi} — overbought (>70), ${Math.abs(pctFromHigh) < 3 ? "near its 30d high" : `${pctFromHigh.toFixed(0)}% off the 30d high`}. Momentum extended.`
        : state === "oversold"
        ? `RSI ${rsi} — oversold (<30). Momentum washed out; watch for stabilization.`
        : state === "neutral"
        ? `RSI ${rsi} — neutral. ${trendUp ? "Above" : "Below"} its 30d average.`
        : "No price history on Zerion yet — momentum can't be scored.";

    positions.push({
      symbol: c.symbol,
      name: c.name,
      chain: c.chain,
      value: c.value,
      price: c.price,
      change1d: c.change1d,
      rsi,
      state,
      trendUp,
      pctFromHigh,
      note,
    });
  }

  const scored = positions.filter((p) => p.state !== "unknown").length;
  return { minValue: MIN_VALUE, analyzed: positions.length, scored, positions };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const { address, period: reqPeriod, analyze } = await req.json().catch(() => ({ address: "" }));
    if (!address || !isEvm(String(address))) return json({ error: "Invalid EVM address" }, 400);

    // Portfolio-value chart period. Zerion accepts day/week/month/year/max.
    const PERIODS = new Set(["day", "week", "month", "year", "max"]);
    const period = PERIODS.has(String(reqPeriod)) ? String(reqPeriod) : "month";

    const key = Deno.env.get("ZERION_API_KEY");
    if (!key) return json({ needsKey: true });

    const auth = "Basic " + btoa(`${key}:`);
    const headers = { Authorization: auth, accept: "application/json" };
    const addr = String(address).toLowerCase();

    // Zerion throttles parallel calls on the same key (429), so fetch each
    // endpoint sequentially with a short backoff retry.
    const getJson = async (path: string): Promise<any | null> => {
      for (let attempt = 0; attempt < 3; attempt++) {
        const res = await fetch(`${ZERION}${path}`, { headers });
        if (res.ok) return await res.json();
        if (res.status === 429) {
          await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
          continue;
        }
        console.log("zerion error", path, res.status, (await res.text()).slice(0, 300));
        return null;
      }
      console.log("zerion throttled", path);
      return null;
    };

    // Analyze mode: only need positions + per-token price history. Keeps the
    // default portfolio load fast and avoids re-fetching data the client has.
    if (analyze) {
      const positions = await getJson(POSITIONS_PATH(addr));
      if (!positions) return json({ error: "Upstream error" }, 502);
      const analysis = await buildAnalysis(mapPositions(positions), getJson);
      return json({ analysis });
    }

    const portfolio = await getJson(`/wallets/${addr}/portfolio?currency=usd`);
    const pnl = await getJson(`/wallets/${addr}/pnl?currency=usd`);
    const positions = await getJson(POSITIONS_PATH(addr));
    const chart = await getJson(`/wallets/${addr}/charts/${period}?currency=usd`);

    if (!portfolio && !pnl) return json({ error: "Upstream error" }, 502);

    const pAttr = portfolio?.data?.attributes ?? {};
    const nAttr = pnl?.data?.attributes ?? {};

    const dist = (pAttr.positions_distribution_by_chain ?? {}) as Record<string, number>;
    const byChain = Object.entries(dist)
      .map(([chain, value]) => ({ chain: cap(chain), value: Number(value) || 0 }))
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const holdings = mapPositions(positions)
      .filter((h) => h.value > 0.01)
      .sort((a, b) => b.value - a.value)
      .slice(0, 15)
      .map(({ symbol, name, value, chain }) => ({ symbol, name, value, chain }));

    // Portfolio value over time. Zerion returns points as [unix_seconds, value].
    const points = (chart?.data?.attributes?.points ?? []) as Array<[number, number]>;
    const chartOut = points
      .map(([t, v]) => ({ t: Number(t) < 1e12 ? Number(t) * 1000 : Number(t), v: Number(v) || 0 }))
      .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.v));

    return json({
      period,
      chart: chartOut,
      totalValue: Number(pAttr.total?.positions) || 0,
      change1d: Number(pAttr.changes?.percent_1d) || 0,
      netInvested: Number(nAttr.net_invested) || 0,
      received: Number(nAttr.received_external) || 0,
      sent: Number(nAttr.sent_external) || 0,
      realized: Number(nAttr.realized_gain) || 0,
      unrealized: Number(nAttr.unrealized_gain) || 0,
      fees: Number(nAttr.total_fee) || 0,
      byChain,
      holdings,
    });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
