// Wallet PnL — multi-EVM portfolio + profit/loss for an address via the Zerion
// API (one cross-chain call each for portfolio, pnl and positions). The API key
// stays server-side. Set ZERION_API_KEY in Supabase to go live; without it the
// function returns needsKey and the UI falls back to sample data.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const ZERION = "https://api.zerion.io/v1";
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const isEvm = (a: string) => /^0x[0-9a-fA-F]{40}$/.test(a);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const { address, period: reqPeriod } = await req.json().catch(() => ({ address: "" }));
    if (!address || !isEvm(String(address))) return json({ error: "Invalid EVM address" }, 400);

    // Portfolio-value chart period. Zerion accepts day/week/month/year/max.
    const PERIODS = new Set(["day", "week", "month", "year", "max"]);
    const period = PERIODS.has(String(reqPeriod)) ? String(reqPeriod) : "month";

    const key = Deno.env.get("ZERION_API_KEY");
    if (!key) return json({ needsKey: true });

    const auth = "Basic " + btoa(`${key}:`);
    const headers = { Authorization: auth, accept: "application/json" };
    const addr = String(address).toLowerCase();

    const [portfolioRes, pnlRes, positionsRes, chartRes] = await Promise.all([
      fetch(`${ZERION}/wallets/${addr}/portfolio?currency=usd`, { headers }),
      fetch(`${ZERION}/wallets/${addr}/pnl?currency=usd`, { headers }),
      fetch(`${ZERION}/wallets/${addr}/positions?currency=usd&filter[trash]=only_non_trash&sort=-value&page[size]=20`, { headers }),
      fetch(`${ZERION}/wallets/${addr}/charts/${period}?currency=usd`, { headers }),
    ]);

    const portfolio = portfolioRes.ok ? await portfolioRes.json() : null;
    const pnl = pnlRes.ok ? await pnlRes.json() : null;
    const positions = positionsRes.ok ? await positionsRes.json() : null;
    const chart = chartRes.ok ? await chartRes.json() : null;

    if (!portfolio && !pnl) return json({ error: "Upstream error" }, 502);

    const pAttr = portfolio?.data?.attributes ?? {};
    const nAttr = pnl?.data?.attributes ?? {};

    const dist = (pAttr.positions_distribution_by_chain ?? {}) as Record<string, number>;
    const byChain = Object.entries(dist)
      .map(([chain, value]) => ({ chain: cap(chain), value: Number(value) || 0 }))
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const holdings = ((positions?.data ?? []) as Array<Record<string, any>>)
      .map((p) => ({
        symbol: p.attributes?.fungible_info?.symbol ?? "?",
        name: p.attributes?.fungible_info?.name ?? "",
        value: Number(p.attributes?.value) || 0,
        chain: cap(p.relationships?.chain?.data?.id ?? ""),
      }))
      .filter((h) => h.value > 0)
      .slice(0, 15);

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
