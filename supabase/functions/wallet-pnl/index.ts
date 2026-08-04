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
    const { address } = await req.json().catch(() => ({ address: "" }));
    if (!address || !isEvm(String(address))) return json({ error: "Invalid EVM address" }, 400);

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

    const portfolio = await getJson(`/wallets/${addr}/portfolio?currency=usd`);
    const pnl = await getJson(`/wallets/${addr}/pnl?currency=usd`);
    const positions = await getJson(
      `/wallets/${addr}/positions?currency=usd&filter[trash]=only_non_trash&sort=-value&page[size]=20`,
    );

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
      .filter((h) => h.value > 0.01)
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);

    return json({
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
