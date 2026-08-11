// Blockscout proxy — on-chain data for Robinhood Chain (chain 4663).
// The Pro API key stays server-side. Two actions on one endpoint:
//   { action: "stats" }                      → chain stats (addresses, txs, gas)
//   { action: "tokens", addresses: [...] }   → per-token holders / supply / price
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const BASE = "https://robinhoodchain.blockscout.com/api/v2";
const isAddr = (a: unknown) => typeof a === "string" && /^0x[0-9a-fA-F]{40}$/.test(a);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action === "stats" ? "stats" : "tokens";

    const key = Deno.env.get("BLOCKSCOUT_API_KEY");
    const headers: Record<string, string> = { accept: "application/json" };
    if (key) headers.Authorization = `Bearer ${key}`;

    const get = async (path: string): Promise<any | null> => {
      for (let attempt = 0; attempt < 3; attempt++) {
        const res = await fetch(`${BASE}${path}`, { headers });
        if (res.ok) return await res.json();
        if (res.status === 429) {
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
          continue;
        }
        console.log("blockscout error", path, res.status);
        return null;
      }
      return null;
    };

    if (action === "stats") {
      const s = await get("/stats");
      if (!s) return json({ error: "Upstream error" }, 502);
      return json({
        totalAddresses: Number(s.total_addresses) || 0,
        totalTransactions: Number(s.total_transactions) || 0,
        transactionsToday: Number(s.transactions_today) || 0,
        averageBlockTime: Number(s.average_block_time) || 0,
        gasAverage: Number(s.gas_prices?.average) || 0,
      });
    }

    const addresses = (Array.isArray(body?.addresses) ? body.addresses : []).filter(isAddr).slice(0, 30);
    if (addresses.length === 0) return json({ error: "No valid addresses" }, 400);

    const out: Record<string, unknown> = {};
    for (const addr of addresses) {
      const t = await get(`/tokens/${addr}`);
      if (!t) continue;
      const decimals = Number(t.decimals) || 18;
      const supplyRaw = Number(t.total_supply) || 0;
      out[String(addr).toLowerCase()] = {
        symbol: t.symbol ?? "",
        holders: Number(t.holders_count) || 0,
        totalSupply: supplyRaw / 10 ** decimals,
        onchainPrice: Number(t.exchange_rate) || null,
        onchainMarketCap: Number(t.circulating_market_cap) || null,
        volume24h: Number(t.volume_24h) || null,
      };
    }

    return json({ tokens: out });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
