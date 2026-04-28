// Quant Loaders v2.0 — On-demand scanner.
// Uses Firecrawl to scrape Fintel/MarketBeat for institutional + short-interest data,
// combines with our market_snapshots / asset_snapshots for price/RSI/volume,
// then scores each candidate 0–100.
//
// Input: { tickers?: string[]; limit?: number }
// Output: { results: ScoredTicker[]; warnings: string[] }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIRECRAWL_KEY = Deno.env.get("FIRECRAWL_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const QUANT_NAMES = [
  "Susquehanna", "SIG",
  "Citadel",
  "Two Sigma",
  "D. E. Shaw", "DE Shaw", "D E Shaw",
  "Balyasny",
  "Renaissance",
  "Millennium",
  "Jane Street",
  "Voloridge",
];

interface FundamentalSignals {
  marketCap: number | null;
  shortFloatPct: number | null;
  instOwnPct: number | null;
  quantOwnDeltaPct: number | null; // QoQ % change of summed quant positions
  quantHits: string[]; // names of quants with >+30% QoQ
  earningsInDays: number | null;
  insiderBuyCount30d: number | null;
  congressTradeCount30d: number | null;
  rsi: number | null;
  beta: number | null;
  volRatio: number | null; // current / avg
}

interface Scored {
  symbol: string;
  companyName?: string | null;
  price?: number | null;
  marketCap?: number | null;
  score: number;
  verdict: "Strong loader" | "Loader" | "Watch" | "Weak";
  signals: FundamentalSignals;
  catalystNote: string;
  warnings: string[];
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function firecrawlScrape(url: string): Promise<string | null> {
  if (!FIRECRAWL_KEY) return null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 25_000);
    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 1500,
      }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    // SDK shape vs REST
    return data?.data?.markdown ?? data?.markdown ?? null;
  } catch (_e) {
    return null;
  }
}

function pctFromText(re: RegExp, text: string): number | null {
  const m = text.match(re);
  if (!m) return null;
  const v = parseFloat(m[1].replace(/,/g, ""));
  return Number.isFinite(v) ? v : null;
}

function parseFintelOwnership(md: string): {
  instOwnPct: number | null;
  quantHits: string[];
  quantOwnDeltaPct: number | null;
} {
  const instOwnPct =
    pctFromText(/Institutional Ownership[^0-9-]{0,40}([\d.]+)\s*%/i, md) ??
    pctFromText(/Ownership[^0-9-]{0,40}([\d.]+)\s*%/i, md);

  const quantHits: string[] = [];
  let posDelta = 0;
  let negDelta = 0;
  let counted = 0;

  for (const name of QUANT_NAMES) {
    const idx = md.toLowerCase().indexOf(name.toLowerCase());
    if (idx === -1) continue;
    const window = md.slice(idx, idx + 400);
    // Look for percent change pattern, e.g. "+45.2%" or "(-12%)"
    const deltaMatch = window.match(/([+-]?\d{1,4}(?:\.\d+)?)\s*%/);
    if (deltaMatch) {
      const delta = parseFloat(deltaMatch[1]);
      if (Number.isFinite(delta)) {
        counted++;
        if (delta >= 30) quantHits.push(name);
        if (delta > 0) posDelta += delta;
        else negDelta += delta;
      }
    } else {
      // Mention without delta — count as hit (new position assumption)
      quantHits.push(name);
    }
  }

  const quantOwnDeltaPct = counted > 0 ? (posDelta + negDelta) / counted : null;
  return { instOwnPct, quantHits: Array.from(new Set(quantHits)), quantOwnDeltaPct };
}

function parseMarketBeatShort(md: string): { shortFloatPct: number | null } {
  const shortFloatPct =
    pctFromText(/Short\s*Interest\s*Ratio[\s\S]{0,40}([\d.]+)\s*%/i, md) ??
    pctFromText(/Short\s*%\s*of\s*Float[\s\S]{0,40}([\d.]+)\s*%/i, md) ??
    pctFromText(/Float\s*Short[\s\S]{0,40}([\d.]+)\s*%/i, md);
  return { shortFloatPct };
}

function parseEarningsDate(md: string): number | null {
  // Look for "Next Earnings" or "Earnings Date"
  const m = md.match(/(?:Next Earnings(?: Date)?|Earnings Date)[^A-Za-z]{0,20}([A-Z][a-z]+\s+\d{1,2},?\s*\d{4})/);
  if (!m) return null;
  const t = Date.parse(m[1]);
  if (!Number.isFinite(t)) return null;
  const days = Math.round((t - Date.now()) / 86400000);
  return days >= -2 ? days : null;
}

function scoreTicker(s: FundamentalSignals): { score: number; verdict: Scored["verdict"]; catalystNote: string } {
  let score = 0;
  const notes: string[] = [];

  // Quant loading (35 pts)
  if (s.quantHits.length >= 3) score += 35;
  else if (s.quantHits.length === 2) score += 25;
  else if (s.quantHits.length === 1) score += 15;
  if (s.quantOwnDeltaPct !== null && s.quantOwnDeltaPct >= 30) score += 5;

  // Short interest (20 pts)
  if (s.shortFloatPct !== null) {
    if (s.shortFloatPct >= 25) score += 20;
    else if (s.shortFloatPct >= 15) score += 14;
    else if (s.shortFloatPct >= 10) score += 7;
  }

  // Institutional ownership (10 pts)
  if (s.instOwnPct !== null) {
    if (s.instOwnPct >= 70) score += 10;
    else if (s.instOwnPct >= 40) score += 7;
    else if (s.instOwnPct >= 25) score += 3;
  }

  // RSI 30-50 (10 pts oversold sweet spot)
  if (s.rsi !== null) {
    if (s.rsi >= 30 && s.rsi <= 50) score += 10;
    else if (s.rsi < 30) score += 6;
    else if (s.rsi <= 60) score += 4;
  }

  // Catalyst (15 pts)
  if (s.earningsInDays !== null && s.earningsInDays <= 14 && s.earningsInDays >= 0) {
    score += 10;
    notes.push(`Earnings in ${s.earningsInDays}d`);
  }
  if ((s.insiderBuyCount30d ?? 0) > 0) {
    score += 3;
    notes.push(`${s.insiderBuyCount30d} insider buys 30d`);
  }
  if ((s.congressTradeCount30d ?? 0) > 0) {
    score += 2;
    notes.push(`${s.congressTradeCount30d} congress trades 30d`);
  }

  // Volume / volatility (10 pts)
  if (s.volRatio !== null && s.volRatio >= 1.5) score += 5;
  if (s.beta !== null && s.beta >= 2) score += 5;

  score = Math.max(0, Math.min(100, Math.round(score)));

  let verdict: Scored["verdict"] = "Weak";
  if (score >= 75) verdict = "Strong loader";
  else if (score >= 55) verdict = "Loader";
  else if (score >= 35) verdict = "Watch";

  return { score, verdict, catalystNote: notes.join(" · ") || "—" };
}

async function pLimit<T>(items: T[], concurrency: number, fn: (it: T) => Promise<unknown>) {
  const queue = items.slice();
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length) {
      const it = queue.shift()!;
      try {
        await fn(it);
      } catch {
        // swallow
      }
    }
  });
  await Promise.all(workers);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const inputTickers: string[] = Array.isArray(body.tickers)
      ? body.tickers
          .map((t: unknown) => String(t).toUpperCase().trim())
          .filter((t: string) => /^[A-Z.]{1,6}$/.test(t))
      : [];
    const limit = Math.min(Math.max(Number(body.limit) || 12, 1), 20);

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Determine candidate list
    let tickers = inputTickers.slice(0, limit);
    if (tickers.length === 0) {
      // Pull small/mid caps from stock_universe
      const { data: universe } = await supabase
        .from("stock_universe")
        .select("symbol, market_cap, current_price, company_name")
        .gte("market_cap", 500_000_000)
        .lte("market_cap", 10_000_000_000)
        .eq("is_active", true)
        .order("market_cap", { ascending: false })
        .limit(60);
      // Shuffle to vary scans, pick first `limit`
      const shuffled = (universe ?? []).sort(() => Math.random() - 0.5);
      tickers = shuffled.slice(0, limit).map((r: { symbol: string }) => r.symbol);
    }

    if (tickers.length === 0) {
      return json({ results: [], warnings: ["No candidate tickers available"] });
    }

    if (!FIRECRAWL_KEY) {
      return json({ results: [], warnings: ["FIRECRAWL_API_KEY not configured"] }, 500);
    }

    // Pre-fetch supplementary data we already have
    const [{ data: snaps }, { data: asnaps }] = await Promise.all([
      supabase
        .from("market_snapshots")
        .select("symbol, current_price, change_pct_1m, market_cap, display_name, volume")
        .in("symbol", tickers),
      supabase
        .from("asset_snapshots")
        .select("symbol, rsi, atr, current_price, interval")
        .in("symbol", tickers)
        .eq("interval", "1d"),
    ]);
    const snapMap = new Map((snaps ?? []).map((s) => [s.symbol, s]));
    const asnapMap = new Map((asnaps ?? []).map((s) => [s.symbol, s]));

    const results: Scored[] = [];
    const warnings: string[] = [];

    await pLimit(tickers, 5, async (sym) => {
      const warns: string[] = [];
      const [fintelMd, mbMd] = await Promise.all([
        firecrawlScrape(`https://fintel.io/sfh/us/${sym.toLowerCase()}`),
        firecrawlScrape(`https://www.marketbeat.com/stocks/NASDAQ/${sym}/short-interest/`),
      ]);

      if (!fintelMd) warns.push("Fintel scrape failed");
      if (!mbMd) warns.push("MarketBeat scrape failed");

      const ownership = fintelMd
        ? parseFintelOwnership(fintelMd)
        : { instOwnPct: null, quantHits: [], quantOwnDeltaPct: null };
      const { shortFloatPct } = mbMd ? parseMarketBeatShort(mbMd) : { shortFloatPct: null };
      const earningsInDays = mbMd ? parseEarningsDate(mbMd) : null;

      const snap = snapMap.get(sym);
      const asnap = asnapMap.get(sym);

      const signals: FundamentalSignals = {
        marketCap: (snap?.market_cap as number | null) ?? null,
        shortFloatPct,
        instOwnPct: ownership.instOwnPct,
        quantOwnDeltaPct: ownership.quantOwnDeltaPct,
        quantHits: ownership.quantHits,
        earningsInDays,
        insiderBuyCount30d: null,
        congressTradeCount30d: null,
        rsi: (asnap?.rsi as number | null) ?? null,
        beta: null,
        volRatio: null,
      };

      const { score, verdict, catalystNote } = scoreTicker(signals);

      results.push({
        symbol: sym,
        companyName: (snap?.display_name as string | undefined) ?? null,
        price: (snap?.current_price as number | null) ?? (asnap?.current_price as number | null) ?? null,
        marketCap: signals.marketCap,
        score,
        verdict,
        signals,
        catalystNote,
        warnings: warns,
      });
    });

    results.sort((a, b) => b.score - a.score);

    return json({
      results,
      warnings,
      meta: { scanned: tickers.length, generatedAt: new Date().toISOString() },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("quant-loaders-scan error", msg);
    return json({ results: [], warnings: [msg] }, 500);
  }
});
