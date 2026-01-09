import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Universe criteria
const MIN_MARKET_CAP = 300_000_000;  // 300M
const MAX_MARKET_CAP = 5_000_000_000; // 5B

// Sample universe - In production, this would be fetched from a screener API
// For now, we include representative small/mid-caps across sectors
const INITIAL_UNIVERSE = [
  // Technology
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
  { symbol: "FSLY", name: "Fastly Inc", sector: "Technology" },
  { symbol: "CFLT", name: "Confluent Inc", sector: "Technology" },
  { symbol: "BILL", name: "Bill Holdings", sector: "Technology" },
  { symbol: "APPF", name: "AppFolio Inc", sector: "Technology" },
  { symbol: "ALTR", name: "Altair Engineering", sector: "Technology" },
  
  // Healthcare
  { symbol: "DOCS", name: "Doximity Inc", sector: "Healthcare" },
  { symbol: "CERT", name: "Certara Inc", sector: "Healthcare" },
  { symbol: "RXRX", name: "Recursion Pharmaceuticals", sector: "Healthcare" },
  { symbol: "TALK", name: "Talkspace Inc", sector: "Healthcare" },
  { symbol: "HIMS", name: "Hims & Hers Health", sector: "Healthcare" },
  
  // Consumer
  { symbol: "FIGS", name: "FIGS Inc", sector: "Consumer Discretionary" },
  { symbol: "BIRD", name: "Allbirds Inc", sector: "Consumer Discretionary" },
  { symbol: "WRBY", name: "Warby Parker", sector: "Consumer Discretionary" },
  { symbol: "BROS", name: "Dutch Bros Inc", sector: "Consumer Discretionary" },
  { symbol: "SHAK", name: "Shake Shack Inc", sector: "Consumer Discretionary" },
  
  // Industrials
  { symbol: "JOBY", name: "Joby Aviation", sector: "Industrials" },
  { symbol: "ACHR", name: "Archer Aviation", sector: "Industrials" },
  { symbol: "LILM", name: "Lilium NV", sector: "Industrials" },
  { symbol: "RDW", name: "Redwire Corp", sector: "Industrials" },
  { symbol: "RKLB", name: "Rocket Lab USA", sector: "Industrials" },
  
  // Energy / Clean Tech
  { symbol: "ENPH", name: "Enphase Energy", sector: "Energy" },
  { symbol: "SEDG", name: "SolarEdge Technologies", sector: "Energy" },
  { symbol: "RUN", name: "Sunrun Inc", sector: "Energy" },
  { symbol: "NOVA", name: "Sunnova Energy", sector: "Energy" },
  { symbol: "ARRY", name: "Array Technologies", sector: "Energy" },
  
  // Financials
  { symbol: "SOFI", name: "SoFi Technologies", sector: "Financials" },
  { symbol: "HOOD", name: "Robinhood Markets", sector: "Financials" },
  { symbol: "LC", name: "LendingClub Corp", sector: "Financials" },
  { symbol: "OPEN", name: "Opendoor Technologies", sector: "Financials" },
  { symbol: "COIN", name: "Coinbase Global", sector: "Financials" },
  
  // EV / Auto
  { symbol: "RIVN", name: "Rivian Automotive", sector: "Consumer Discretionary" },
  { symbol: "LCID", name: "Lucid Group", sector: "Consumer Discretionary" },
  { symbol: "XPEV", name: "XPeng Inc", sector: "Consumer Discretionary" },
  { symbol: "GOEV", name: "Canoo Inc", sector: "Consumer Discretionary" },
  { symbol: "FSR", name: "Fisker Inc", sector: "Consumer Discretionary" },
];

async function fetchYahooQuote(symbol: string): Promise<{
  marketCap: number | null;
  avgVolume: number | null;
  price: number | null;
}> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=3mo`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    
    if (!res.ok) {
      console.log(`Yahoo fetch failed for ${symbol}: ${res.status}`);
      return { marketCap: null, avgVolume: null, price: null };
    }

    const data = await res.json();
    const meta = data.chart?.result?.[0]?.meta;
    const volumes = data.chart?.result?.[0]?.indicators?.quote?.[0]?.volume;
    
    const price = meta?.regularMarketPrice ?? null;
    const marketCap = meta?.marketCap ?? null;
    
    // Calculate 90-day average volume (we have ~60 trading days in 3 months)
    let avgVolume: number | null = null;
    if (volumes && volumes.length > 0) {
      const validVolumes = volumes.filter((v: number | null) => v !== null && v > 0);
      if (validVolumes.length > 0) {
        avgVolume = validVolumes.reduce((a: number, b: number) => a + b, 0) / validVolumes.length;
      }
    }

    return { marketCap, avgVolume, price };
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return { marketCap: null, avgVolume: null, price: null };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const updatedStocks: Array<{
      symbol: string;
      company_name: string;
      sector: string;
      country: string;
      market_cap: number | null;
      avg_volume_90d: number | null;
      current_price: number | null;
      is_active: boolean;
      last_updated: string;
    }> = [];

    console.log(`Processing ${INITIAL_UNIVERSE.length} stocks...`);

    // Fetch data for each stock (with rate limiting)
    for (const stock of INITIAL_UNIVERSE) {
      const { marketCap, avgVolume, price } = await fetchYahooQuote(stock.symbol);
      
      // Determine if stock meets universe criteria
      const meetsMarketCapCriteria = marketCap !== null && 
        marketCap >= MIN_MARKET_CAP && 
        marketCap <= MAX_MARKET_CAP;
      
      const hasVolume = avgVolume !== null && avgVolume > 0;
      
      updatedStocks.push({
        symbol: stock.symbol,
        company_name: stock.name,
        sector: stock.sector,
        country: "US",
        market_cap: marketCap,
        avg_volume_90d: avgVolume,
        current_price: price,
        is_active: meetsMarketCapCriteria && hasVolume,
        last_updated: new Date().toISOString(),
      });

      // Rate limiting: 200ms between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Upsert to database
    const { error } = await supabase
      .from("stock_universe")
      .upsert(updatedStocks, { onConflict: "symbol" });

    if (error) {
      console.error("Upsert error:", error);
      throw error;
    }

    const activeCount = updatedStocks.filter(s => s.is_active).length;
    console.log(`Updated ${updatedStocks.length} stocks, ${activeCount} active in universe`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        total: updatedStocks.length,
        active: activeCount,
        criteria: { minMarketCap: MIN_MARKET_CAP, maxMarketCap: MAX_MARKET_CAP }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Universe Collector Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
