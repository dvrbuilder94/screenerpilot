// Market Snapshots Collector
// Pulls Yahoo Finance v8 chart API for macro tickers and upserts into market_snapshots.
// Runs via pg_cron every 15 minutes. No auth required (public market data).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TickerDef {
  symbol: string;        // Yahoo symbol
  category: string;      // equity | sector | factor | yield | fx | commodity | country | crypto
  display_name: string;
  region?: string;       // us | latam | global | europe | asia
}

const TICKERS: TickerDef[] = [
  // ---- US Equity Indices ----
  { symbol: "SPY",  category: "equity", display_name: "S&P 500",       region: "us" },
  { symbol: "QQQ",  category: "equity", display_name: "Nasdaq 100",    region: "us" },
  { symbol: "DIA",  category: "equity", display_name: "Dow Jones",     region: "us" },
  { symbol: "IWM",  category: "equity", display_name: "Russell 2000",  region: "us" },
  { symbol: "^VIX", category: "equity", display_name: "VIX",           region: "us" },

  // ---- US Sector ETFs ----
  { symbol: "XLK",  category: "sector", display_name: "Technology",            region: "us" },
  { symbol: "XLY",  category: "sector", display_name: "Cons. Discretionary",   region: "us" },
  { symbol: "XLV",  category: "sector", display_name: "Health Care",           region: "us" },
  { symbol: "XLF",  category: "sector", display_name: "Financials",            region: "us" },
  { symbol: "XLE",  category: "sector", display_name: "Energy",                region: "us" },
  { symbol: "XLI",  category: "sector", display_name: "Industrials",           region: "us" },
  { symbol: "XLP",  category: "sector", display_name: "Cons. Staples",         region: "us" },
  { symbol: "XLRE", category: "sector", display_name: "Real Estate",           region: "us" },
  { symbol: "XLU",  category: "sector", display_name: "Utilities",             region: "us" },
  { symbol: "XLB",  category: "sector", display_name: "Materials",             region: "us" },

  // ---- Factor / Style ETFs ----
  { symbol: "IWF",  category: "factor", display_name: "Growth",         region: "us" },
  { symbol: "IWD",  category: "factor", display_name: "Value",          region: "us" },
  { symbol: "MTUM", category: "factor", display_name: "Momentum",       region: "us" },
  { symbol: "IJR",  category: "factor", display_name: "Small-Cap",      region: "us" },
  { symbol: "VYM",  category: "factor", display_name: "High Dividend",  region: "us" },
  { symbol: "USMV", category: "factor", display_name: "Low Volatility", region: "us" },
  { symbol: "QUAL", category: "factor", display_name: "Quality",        region: "us" },

  // ---- US Treasury Yields ----
  { symbol: "^IRX", category: "yield", display_name: "US 3M",  region: "us" },
  { symbol: "^FVX", category: "yield", display_name: "US 5Y",  region: "us" },
  { symbol: "^TNX", category: "yield", display_name: "US 10Y", region: "us" },
  { symbol: "^TYX", category: "yield", display_name: "US 30Y", region: "us" },

  // ---- LATAM FX (Yahoo "USD<CCY>=X" format) ----
  { symbol: "USDCLP=X", category: "fx", display_name: "USD/CLP", region: "latam" },
  { symbol: "USDBRL=X", category: "fx", display_name: "USD/BRL", region: "latam" },
  { symbol: "USDMXN=X", category: "fx", display_name: "USD/MXN", region: "latam" },
  { symbol: "USDCOP=X", category: "fx", display_name: "USD/COP", region: "latam" },
  { symbol: "USDPEN=X", category: "fx", display_name: "USD/PEN", region: "latam" },
  { symbol: "USDARS=X", category: "fx", display_name: "USD/ARS", region: "latam" },

  // ---- Major FX Pairs ----
  { symbol: "EURUSD=X", category: "fx", display_name: "EUR/USD", region: "global" },
  { symbol: "GBPUSD=X", category: "fx", display_name: "GBP/USD", region: "global" },
  { symbol: "USDJPY=X", category: "fx", display_name: "USD/JPY", region: "global" },
  { symbol: "USDCHF=X", category: "fx", display_name: "USD/CHF", region: "global" },
  { symbol: "AUDUSD=X", category: "fx", display_name: "AUD/USD", region: "global" },
  { symbol: "USDCAD=X", category: "fx", display_name: "USD/CAD", region: "global" },

  // ---- Dollar Index ----
  { symbol: "DX-Y.NYB", category: "fx", display_name: "DXY", region: "global" },

  // ---- Commodities — Energy ----
  { symbol: "CL=F", category: "commodity", display_name: "WTI Crude Oil", region: "global" },
  { symbol: "BZ=F", category: "commodity", display_name: "Brent Crude",   region: "global" },
  { symbol: "NG=F", category: "commodity", display_name: "Natural Gas",   region: "global" },
  { symbol: "RB=F", category: "commodity", display_name: "Gasoline",      region: "global" },
  { symbol: "HO=F", category: "commodity", display_name: "Heating Oil",   region: "global" },

  // ---- Commodities — Metals ----
  { symbol: "GC=F", category: "commodity", display_name: "Gold",      region: "global" },
  { symbol: "SI=F", category: "commodity", display_name: "Silver",    region: "global" },
  { symbol: "HG=F", category: "commodity", display_name: "Copper",    region: "global" },
  { symbol: "PL=F", category: "commodity", display_name: "Platinum",  region: "global" },
  { symbol: "PA=F", category: "commodity", display_name: "Palladium", region: "global" },

  // ---- Commodities — Soft ----
  { symbol: "ZC=F", category: "commodity", display_name: "Corn",     region: "global" },
  { symbol: "ZW=F", category: "commodity", display_name: "Wheat",    region: "global" },
  { symbol: "ZS=F", category: "commodity", display_name: "Soybeans", region: "global" },
  { symbol: "SB=F", category: "commodity", display_name: "Sugar",    region: "global" },
  { symbol: "KC=F", category: "commodity", display_name: "Coffee",   region: "global" },
  { symbol: "CT=F", category: "commodity", display_name: "Cotton",   region: "global" },

  // ---- Country ETFs (Americas first) ----
  { symbol: "ECH",  category: "country", display_name: "Chile",         region: "latam" },
  { symbol: "EWZ",  category: "country", display_name: "Brasil",        region: "latam" },
  { symbol: "EWW",  category: "country", display_name: "México",        region: "latam" },
  { symbol: "EPU",  category: "country", display_name: "Peru",          region: "latam" },
  { symbol: "GXG",  category: "country", display_name: "Colombia",      region: "latam" },
  { symbol: "ARGT", category: "country", display_name: "Argentina",     region: "latam" },
  { symbol: "EWC",  category: "country", display_name: "Canada",        region: "global" },
  // Rest of world
  { symbol: "EWG",  category: "country", display_name: "Germany",       region: "europe" },
  { symbol: "EWJ",  category: "country", display_name: "Japan",         region: "asia" },
  { symbol: "FXI",  category: "country", display_name: "China",         region: "asia" },
  { symbol: "INDA", category: "country", display_name: "India",         region: "asia" },
  { symbol: "EWU",  category: "country", display_name: "United Kingdom",region: "europe" },
  { symbol: "EWA",  category: "country", display_name: "Australia",     region: "asia" },
];

interface YahooQuote {
  current: number;
  previousClose: number;
  closes: number[];        // historical daily closes (oldest -> newest)
  timestamps: number[];
  volume?: number;
  marketCap?: number;
}

async function fetchYahoo(symbol: string): Promise<YahooQuote | null> {
  const encoded = encodeURIComponent(symbol);
  // 1Y of daily candles is enough for 1D/1W/1M/YTD/1Y comps
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1d&range=1y`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
    });
    if (!res.ok) {
      console.warn(`Yahoo ${symbol}: HTTP ${res.status}`);
      return null;
    }
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta ?? {};
    const closes: number[] = (result.indicators?.quote?.[0]?.close ?? []).filter(
      (v: number | null) => v != null
    );
    const timestamps: number[] = result.timestamp ?? [];
    const current =
      meta.regularMarketPrice ?? closes[closes.length - 1] ?? null;
    // IMPORTANT: with range=1y, meta.chartPreviousClose is the close ~1Y ago, NOT yesterday.
    // Use penultimate daily close as the actual previous-day close.
    const previousClose =
      closes.length >= 2 ? closes[closes.length - 2] : (meta.chartPreviousClose ?? current);
    if (current == null) return null;

    return {
      current,
      previousClose: previousClose ?? current,
      closes,
      timestamps,
      volume: meta.regularMarketVolume ?? undefined,
      marketCap: meta.marketCap ?? undefined,
    };
  } catch (e) {
    console.error(`Yahoo fetch failed for ${symbol}:`, e);
    return null;
  }
}

function pctChange(from: number, to: number): number | null {
  if (!from || !isFinite(from)) return null;
  return ((to - from) / from) * 100;
}

function findClosestIndexBefore(
  timestamps: number[],
  targetSec: number
): number {
  // timestamps oldest -> newest, in seconds
  let lo = 0;
  let hi = timestamps.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (timestamps[mid] <= targetSec) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans;
}

function buildSnapshot(t: TickerDef, q: YahooQuote) {
  const nowSec = Math.floor(Date.now() / 1000);
  const day = 86400;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  const idxWeek  = findClosestIndexBefore(q.timestamps, nowSec - week);
  const idxMonth = findClosestIndexBefore(q.timestamps, nowSec - month);
  const idxYear  = findClosestIndexBefore(q.timestamps, nowSec - year);

  // YTD: first close of current calendar year
  const yearStart = new Date(new Date().getUTCFullYear(), 0, 1).getTime() / 1000;
  let idxYtd = -1;
  for (let i = 0; i < q.timestamps.length; i++) {
    if (q.timestamps[i] >= yearStart) { idxYtd = i; break; }
  }

  const change_1d = q.current - q.previousClose;
  const change_pct_1d = pctChange(q.previousClose, q.current);
  const change_pct_1w = idxWeek  >= 0 ? pctChange(q.closes[idxWeek],  q.current) : null;
  const change_pct_1m = idxMonth >= 0 ? pctChange(q.closes[idxMonth], q.current) : null;
  const change_pct_1y = idxYear  >= 0 ? pctChange(q.closes[idxYear],  q.current) : null;
  const change_pct_ytd = idxYtd  >= 0 ? pctChange(q.closes[idxYtd],   q.current) : null;

  return {
    symbol: t.symbol,
    category: t.category,
    display_name: t.display_name,
    region: t.region ?? null,
    current_price: q.current,
    previous_close: q.previousClose,
    change_1d,
    change_pct_1d,
    change_pct_1w,
    change_pct_1m,
    change_pct_ytd,
    change_pct_1y,
    volume: q.volume ?? null,
    market_cap: q.marketCap ?? null,
    raw_data: { source: "yahoo", lastClose: q.closes[q.closes.length - 1] ?? null },
    fetched_at: new Date().toISOString(),
  };
}

async function processBatch(batch: TickerDef[]) {
  const results = await Promise.all(
    batch.map(async (t) => {
      const q = await fetchYahoo(t.symbol);
      if (!q) return null;
      return buildSnapshot(t, q);
    })
  );
  return results.filter((r) => r !== null);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const startTs = Date.now();
  const allRows: any[] = [];
  const errors: string[] = [];
  const BATCH_SIZE = 8;

  for (let i = 0; i < TICKERS.length; i += BATCH_SIZE) {
    const batch = TICKERS.slice(i, i + BATCH_SIZE);
    try {
      const rows = await processBatch(batch);
      allRows.push(...rows);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Batch ${i}: ${msg}`);
    }
    // small delay between batches to avoid Yahoo rate-limit
    await new Promise((r) => setTimeout(r, 250));
  }

  if (allRows.length > 0) {
    const { error } = await supabase
      .from("market_snapshots")
      .upsert(allRows, { onConflict: "symbol" });
    if (error) {
      console.error("Upsert error:", error);
      return new Response(
        JSON.stringify({ ok: false, error: error.message, fetched: allRows.length }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  const elapsed = Date.now() - startTs;
  return new Response(
    JSON.stringify({
      ok: true,
      fetched: allRows.length,
      total_tickers: TICKERS.length,
      errors,
      elapsed_ms: elapsed,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
