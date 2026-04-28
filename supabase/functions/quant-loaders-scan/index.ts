// Quant Loaders v2.0 — On-demand institutional squeeze scanner.
// Uses Firecrawl to scrape MarketBeat (institutional ownership + short interest),
// combines with our market_snapshots / asset_snapshots for price/RSI,
// then scores each candidate 0–100.
//
// Input: { tickers?: string[]; limit?: number }
// Output: { results: ScoredTicker[]; warnings: string[]; meta: {...} }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIRECRAWL_KEY = Deno.env.get("FIRECRAWL_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Quant / market-maker shops to detect in the holders list.
const QUANT_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "Susquehanna",  re: /Susquehanna/i },
  { name: "Citadel",      re: /Citadel/i },
  { name: "Two Sigma",    re: /Two\s*Sigma/i },
  { name: "DE Shaw",      re: /D\.?\s*E\.?\s*Shaw/i },
  { name: "Balyasny",     re: /Balyasny/i },
  { name: "Renaissance",  re: /Renaissance\s*Tech/i },
  { name: "Millennium",   re: /Millennium\s*Mgmt|Millennium\s*Management/i },
  { name: "Jane Street",  re: /Jane\s*Street/i },
  { name: "Voloridge",    re: /Voloridge/i },
  { name: "Point72",      re: /Point72/i },
  { name: "Tower Research",re: /Tower\s*Research/i },
  { name: "Hudson River", re: /Hudson\s*River/i },
];

interface QuantHit {
  name: string;
  deltaPct: number | null; // QoQ change in shares
}

interface FundamentalSignals {
  marketCap: number | null;
  shortFloatPct: number | null;
  instOwnPct: number | null;
  quantHits: QuantHit[];
  earningsInDays: number | null;
  rsi: number | null;
}

interface Scored {
  symbol: string;
  exchange: "NASDAQ" | "NYSE" | null;
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

interface ScrapeResult {
  markdown: string | null;
  status: number | null;
  error?: string;
}

async function firecrawlScrape(url: string): Promise<ScrapeResult> {
  if (!FIRECRAWL_KEY) return { markdown: null, status: null, error: "missing_key" };
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 30_000);
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
      }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { markdown: null, status: res.status, error: txt.slice(0, 120) };
    }
    const data = await res.json();
    const root = data?.data ?? data ?? {};
    const md: string = root.markdown ?? "";
    const status: number = root.metadata?.statusCode ?? 200;
    if (status >= 400 || !md.trim()) {
      return { markdown: null, status, error: root.metadata?.error || "empty" };
    }
    return { markdown: md, status };
  } catch (e) {
    return { markdown: null, status: null, error: e instanceof Error ? e.message : "fetch_error" };
  }
}

async function fetchMarketBeat(
  ticker: string,
  page: "institutional-ownership" | "short-interest"
): Promise<{ md: string | null; exchange: "NASDAQ" | "NYSE" | null; error?: string }> {
  // Try NASDAQ first, fall back to NYSE
  for (const ex of ["NASDAQ", "NYSE"] as const) {
    const url = `https://www.marketbeat.com/stocks/${ex}/${ticker}/${page}/`;
    const r = await firecrawlScrape(url);
    if (r.markdown) return { md: r.markdown, exchange: ex };
  }
  return { md: null, exchange: null, error: "scrape_failed" };
}

function parseInstitutionalOwnership(md: string): {
  instOwnPct: number | null;
  quantHits: QuantHit[];
} {
  // "Percentage38.43%"
  const instMatch = md.match(/Institutional Ownership[\s\S]{0,80}?Percentage\s*([\d.]+)\s*%/i)
    || md.match(/Percentage\s*([\d.]+)\s*%/i);
  const instOwnPct = instMatch ? parseFloat(instMatch[1]) : null;

  const hitsMap = new Map<string, QuantHit>();

  // The shareholder rows look like:
  // | 4/28/2026 | Citadel Advisors LLC | 38,931 | $618K | 0.0% | +14.4% | 0.003% | [...] |
  const rowRegex = /\|\s*\d{1,2}\/\d{1,2}\/\d{4}\s*\|([^|]+)\|[^|]+\|[^|]+\|[^|]+\|\s*([+-]?[\d.,]+%|N\/A|—|-)\s*\|/g;
  let m: RegExpExecArray | null;
  while ((m = rowRegex.exec(md)) !== null) {
    const holder = m[1].trim();
    const deltaStr = m[2].trim();
    for (const q of QUANT_PATTERNS) {
      if (!q.re.test(holder)) continue;
      let delta: number | null = null;
      const dm = deltaStr.match(/([+-]?[\d.]+)\s*%/);
      if (dm) delta = parseFloat(dm[1].replace(/,/g, ""));
      const existing = hitsMap.get(q.name);
      if (!existing || (delta !== null && (existing.deltaPct === null || delta > existing.deltaPct))) {
        hitsMap.set(q.name, { name: q.name, deltaPct: delta });
      }
    }
  }

  return { instOwnPct, quantHits: Array.from(hitsMap.values()) };
}

function parseShortInterest(md: string): { shortFloatPct: number | null; earningsInDays: number | null } {
  // MarketBeat short page: "Short Interest40,500,000 shares"  "% of Float7.30%"
  const shortFloatPct =
    matchPct(md, /%\s*of\s*Float\s*([\d.]+)\s*%/i) ??
    matchPct(md, /Short\s*%\s*of\s*Float[\s\S]{0,40}?([\d.]+)\s*%/i) ??
    matchPct(md, /Float\s*Short[\s\S]{0,40}?([\d.]+)\s*%/i);

  // Earnings date — look for "Next Earnings Date"
  let earningsInDays: number | null = null;
  const em = md.match(/Next\s*Earnings\s*(?:Date)?[\s\S]{0,40}?([A-Z][a-z]+\s+\d{1,2},?\s*\d{4})/i);
  if (em) {
    const t = Date.parse(em[1]);
    if (Number.isFinite(t)) {
      const days = Math.round((t - Date.now()) / 86400000);
      if (days >= -2 && days <= 90) earningsInDays = days;
    }
  }
  return { shortFloatPct, earningsInDays };
}

function matchPct(text: string, re: RegExp): number | null {
  const m = text.match(re);
  if (!m) return null;
  const v = parseFloat(m[1].replace(/,/g, ""));
  return Number.isFinite(v) ? v : null;
}

function scoreTicker(s: FundamentalSignals): {
  score: number;
  verdict: Scored["verdict"];
  catalystNote: string;
} {
  let score = 0;
  const notes: string[] = [];

  // Quant loading (40 pts)
  const strongHits = s.quantHits.filter((h) => (h.deltaPct ?? 0) >= 30).length;
  const anyHits = s.quantHits.length;
  if (strongHits >= 3) score += 40;
  else if (strongHits === 2) score += 30;
  else if (strongHits === 1) score += 22;
  else if (anyHits >= 3) score += 18;
  else if (anyHits >= 1) score += 10;

  // Short interest (20 pts)
  if (s.shortFloatPct !== null) {
    if (s.shortFloatPct >= 25) score += 20;
    else if (s.shortFloatPct >= 15) score += 14;
    else if (s.shortFloatPct >= 10) score += 8;
    else if (s.shortFloatPct >= 5) score += 3;
  }

  // Institutional ownership (10 pts)
  if (s.instOwnPct !== null) {
    if (s.instOwnPct >= 70) score += 10;
    else if (s.instOwnPct >= 40) score += 7;
    else if (s.instOwnPct >= 25) score += 4;
  }

  // RSI (15 pts) — favor oversold 30-50
  if (s.rsi !== null) {
    if (s.rsi >= 30 && s.rsi <= 50) score += 15;
    else if (s.rsi < 30) score += 10;
    else if (s.rsi <= 60) score += 6;
  }

  // Catalyst — earnings (15 pts)
  if (s.earningsInDays !== null && s.earningsInDays >= 0 && s.earningsInDays <= 14) {
    score += 15;
    notes.push(`Earnings in ${s.earningsInDays}d`);
  } else if (s.earningsInDays !== null && s.earningsInDays <= 30) {
    score += 6;
    notes.push(`Earnings in ${s.earningsInDays}d`);
  }

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
      try { await fn(it); } catch { /* swallow */ }
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
    const limit = Math.min(Math.max(Number(body.limit) || 10, 1), 15);

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    let tickers = inputTickers.slice(0, limit);
    if (tickers.length === 0) {
      const { data: universe } = await supabase
        .from("stock_universe")
        .select("symbol, market_cap")
        .gte("market_cap", 500_000_000)
        .lte("market_cap", 10_000_000_000)
        .eq("is_active", true)
        .order("market_cap", { ascending: false })
        .limit(60);
      const shuffled = (universe ?? []).sort(() => Math.random() - 0.5);
      tickers = shuffled.slice(0, limit).map((r: { symbol: string }) => r.symbol);
    }

    if (tickers.length === 0) {
      return json({ results: [], warnings: ["No candidate tickers available"] });
    }

    if (!FIRECRAWL_KEY) {
      return json({ results: [], warnings: ["FIRECRAWL_API_KEY not configured"] }, 500);
    }

    const [{ data: snaps }, { data: asnaps }] = await Promise.all([
      supabase
        .from("market_snapshots")
        .select("symbol, current_price, market_cap, display_name")
        .in("symbol", tickers),
      supabase
        .from("asset_snapshots")
        .select("symbol, rsi, current_price, interval")
        .in("symbol", tickers)
        .eq("interval", "1d"),
    ]);
    const snapMap = new Map((snaps ?? []).map((s) => [s.symbol, s]));
    const asnapMap = new Map((asnaps ?? []).map((s) => [s.symbol, s]));

    const results: Scored[] = [];
    const globalWarnings: string[] = [];

    await pLimit(tickers, 4, async (sym) => {
      const warns: string[] = [];

      const [own, shrt] = await Promise.all([
        fetchMarketBeat(sym, "institutional-ownership"),
        fetchMarketBeat(sym, "short-interest"),
      ]);

      if (!own.md) warns.push("Ownership scrape failed");
      if (!shrt.md) warns.push("Short interest scrape failed");

      const ownership = own.md
        ? parseInstitutionalOwnership(own.md)
        : { instOwnPct: null, quantHits: [] };
      const shortData = shrt.md
        ? parseShortInterest(shrt.md)
        : { shortFloatPct: null, earningsInDays: null };

      const exchange = own.exchange || shrt.exchange || null;
      const snap = snapMap.get(sym);
      const asnap = asnapMap.get(sym);

      const signals: FundamentalSignals = {
        marketCap: (snap?.market_cap as number | null) ?? null,
        shortFloatPct: shortData.shortFloatPct,
        instOwnPct: ownership.instOwnPct,
        quantHits: ownership.quantHits,
        earningsInDays: shortData.earningsInDays,
        rsi: (asnap?.rsi as number | null) ?? null,
      };

      const { score, verdict, catalystNote } = scoreTicker(signals);

      results.push({
        symbol: sym,
        exchange,
        companyName: (snap?.display_name as string | undefined) ?? null,
        price:
          (snap?.current_price as number | null) ??
          (asnap?.current_price as number | null) ??
          null,
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
      warnings: globalWarnings,
      meta: { scanned: tickers.length, generatedAt: new Date().toISOString() },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("quant-loaders-scan error", msg);
    return json({ results: [], warnings: [msg] }, 500);
  }
});
