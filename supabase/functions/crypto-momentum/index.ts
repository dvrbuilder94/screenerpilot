import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const CMC_KEY = Deno.env.get("COINMARKETCAP_API_KEY")!;

interface CmcCoin {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  cmc_rank: number;
  quote: {
    USD: {
      price: number;
      volume_24h: number;
      market_cap: number;
      percent_change_1h: number;
      percent_change_24h: number;
      percent_change_7d: number;
      percent_change_30d: number;
      percent_change_60d: number;
      percent_change_90d: number;
    };
  };
}

// In-memory cache (per isolate)
let cache: { data: any; ts: number } | null = null;
const TTL_MS = 5 * 60 * 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (cache && Date.now() - cache.ts < TTL_MS) {
      return new Response(JSON.stringify({ ...cache.data, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=250&convert=USD";
    const res = await fetch(url, {
      headers: { "X-CMC_PRO_API_KEY": CMC_KEY, Accept: "application/json" },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("CMC error", res.status, text);
      return new Response(JSON.stringify({ error: `CMC ${res.status}`, detail: text }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await res.json();
    const coins: CmcCoin[] = json.data ?? [];

    const mapped = coins.map((c) => {
      const q = c.quote.USD;
      return {
        id: c.id,
        name: c.name,
        symbol: c.symbol,
        slug: c.slug,
        rank: c.cmc_rank,
        price: q.price,
        volume_24h: q.volume_24h,
        market_cap: q.market_cap,
        change_1h: q.percent_change_1h,
        change_24h: q.percent_change_24h,
        change_7d: q.percent_change_7d,
        change_30d: q.percent_change_30d,
        change_60d: q.percent_change_60d,
        change_90d: q.percent_change_90d,
      };
    });

    const payload = {
      coins: mapped,
      fetched_at: new Date().toISOString(),
      total: mapped.length,
      cached: false,
    };

    cache = { data: payload, ts: Date.now() };

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("crypto-momentum error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
