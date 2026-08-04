// Wallet position analysis — for each holding worth more than $10, pull the
// token's recent price series from Zerion and compute a technical read (RSI →
// overbought/oversold, trend, distance from the window high) so the user can
// see whether what they're exposed to is extended. Read-only; key stays
// server-side. Heavier than wallet-pnl (one chart call per position), so it's a
// separate on-demand endpoint rather than part of the initial portfolio load.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { rsiLast, sma } from "../_shared/ta.ts";

const ZERION = "https://api.zerion.io/v1";
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const isEvm = (a: string) => /^0x[0-9a-fA-F]{40}$/.test(a);

const MIN_VALUE = 10; // only analyze positions worth more than $10
const MAX_POSITIONS = 12; // bound the number of per-token chart calls

type State = "overbought" | "oversold" | "neutral" | "unknown";

function classify(rsi: number): State {
  if (!Number.isFinite(rsi)) return "unknown";
  if (rsi >= 70) return "overbought";
  if (rsi <= 30) return "oversold";
  return "neutral";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const { address } = await req.json().catch(() => ({ address: "" }));
    if (!address || !isEvm(String(address))) return json({ error: "Invalid EVM address" }, 400);

    const key = Deno.env.get("ZERION_API_KEY");
    if (!key) return json({ needsKey: true });

    const auth = "Basic " + btoa(`${key}:`);
    const headers = { Authorization: auth, accept: "application/json" };
    const addr = String(address).toLowerCase();

    // Zerion throttles parallel calls on the same key (429), so go sequential
    // with a short backoff retry.
    const getJson = async (path: string): Promise<any | null> => {
      for (let attempt = 0; attempt < 3; attempt++) {
        const res = await fetch(`${ZERION}${path}`, { headers });
        if (res.ok) return await res.json();
        if (res.status === 429) {
          await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
          continue;
        }
        console.log("zerion error", path, res.status, (await res.text()).slice(0, 200));
        return null;
      }
      console.log("zerion throttled", path);
      return null;
    };

    const positionsRes = await getJson(
      `/wallets/${addr}/positions?currency=usd&filter[trash]=only_non_trash&filter[position_types]=wallet&sort=-value&page[size]=100`,
    );
    if (!positionsRes) return json({ error: "Upstream error" }, 502);

    const raw = (positionsRes.data ?? []) as Array<Record<string, any>>;
    const candidates = raw
      .map((p) => ({
        fungibleId: p.relationships?.fungible?.data?.id ?? "",
        symbol: p.attributes?.fungible_info?.symbol ?? "?",
        name: p.attributes?.fungible_info?.name ?? "",
        chain: cap(p.relationships?.chain?.data?.id ?? ""),
        value: Number(p.attributes?.value) || 0,
        price: Number(p.attributes?.price) || 0,
        change1d: Number(p.attributes?.changes?.percent_1d) || 0,
      }))
      .filter((p) => p.value > MIN_VALUE && p.fungibleId)
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

      const note = (() => {
        if (state === "overbought") return `RSI ${rsi} — overbought (>70), ${Math.abs(pctFromHigh) < 3 ? "near its 30d high" : `${pctFromHigh.toFixed(0)}% off the 30d high`}. Momentum extended.`;
        if (state === "oversold") return `RSI ${rsi} — oversold (<30). Momentum washed out; watch for stabilization.`;
        if (state === "neutral") return `RSI ${rsi} — neutral. ${trendUp ? "Above" : "Below"} its 30d average.`;
        return "Not enough price history to score momentum.";
      })();

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

    return json({ minValue: MIN_VALUE, analyzed: positions.length, positions });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
