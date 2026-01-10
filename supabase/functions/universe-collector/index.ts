import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

/* =========================
   CORS
========================= */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/* =========================
   Universe seed
========================= */
const UNIVERSE = [
  { symbol: "CROX", name: "Crocs Inc", sector: "Consumer Discretionary" },
  { symbol: "UPST", name: "Upstart Holdings", sector: "Financials" },
  { symbol: "AFRM", name: "Affirm Holdings", sector: "Financials" },
  { symbol: "RBLX", name: "Roblox Corp", sector: "Technology" },
  { symbol: "DKNG", name: "DraftKings Inc", sector: "Consumer Discretionary" },
  { symbol: "U", name: "Unity Software", sector: "Technology" },
  { symbol: "PATH", name: "UiPath Inc", sector: "Technology" },
  { symbol: "ZI", name: "ZoomInfo Technologies", sector: "Technology" },
  { symbol: "GTLB", name: "GitLab Inc", sector: "Technology" },
  { symbol: "DOCN", name: "DigitalOcean Holdings", sector: "Technology" },

  { symbol: "DOCS", name: "Doximity Inc", sector: "Healthcare" },
  { symbol: "RXRX", name: "Recursion Pharmaceuticals", sector: "Healthcare" },
  { symbol: "HIMS", name: "Hims & Hers Health", sector: "Healthcare" },

  { symbol: "FIGS", name: "FIGS Inc", sector: "Consumer Discretionary" },
  { symbol: "BROS", name: "Dutch Bros Inc", sector: "Consumer Discretionary" },
  { symbol: "SHAK", name: "Shake Shack Inc", sector: "Consumer Discretionary" },

  { symbol: "JOBY", name: "Joby Aviation", sector: "Industrials" },
  { symbol: "ACHR", name: "Archer Aviation", sector: "Industrials" },
  { symbol: "RKLB", name: "Rocket Lab USA", sector: "Industrials" },

  { symbol: "ENPH", name: "Enphase Energy", sector: "Energy" },
  { symbol: "SEDG", name: "SolarEdge Technologies", sector: "Energy" },

  { symbol: "SOFI", name: "SoFi Technologies", sector: "Financials" },
  { symbol: "HOOD", name: "Robinhood Markets", sector: "Financials" },
  { symbol: "COIN", name: "Coinbase Global", sector: "Financials" },
];

/* =========================
   Yahoo lightweight fetch
========================= */
async function fetchYahooLight(symbol: string) {
  try {
    const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!res.ok) throw new Error("Yahoo failed");

    const json = await res.json();
    const q = json?.quoteResponse?.result?.[0];

    if (!q) throw new Error("No data");

    return {
      price: q.regularMarketPrice ?? null,
      marketCap: q.marketCap ?? null,
      avgVolume: q.averageDailyVolume3Month ?? q.averageDailyVolume10Day ?? null,
    };
  } catch {
    return {
      price: null,
      marketCap: null,
      avgVolume: null,
    };
  }
}

/* =========================
   Server
========================= */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const rows = [];

    for (const asset of UNIVERSE) {
      const data = await fetchYahooLight(asset.symbol);

      rows.push({
        symbol: asset.symbol,
        company_name: asset.name,
        sector: asset.sector,
        country: "US",
        market_cap: data.marketCap,
        avg_volume_90d: data.avgVolume,
        current_price: data.price,
        is_active: true, // ❗️NO desactivar por fallos temporales
        last_updated: new Date().toISOString(),
      });

      // Soft rate limit
      await new Promise((r) => setTimeout(r, 150));
    }

    const { error } = await supabase.from("stock_universe").upsert(rows, { onConflict: "symbol" });

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        total: rows.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 500, headers: corsHeaders },
    );
  }
});
