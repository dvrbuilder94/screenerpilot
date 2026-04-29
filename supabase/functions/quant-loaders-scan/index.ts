// Quant Holdings Viewer — Returns the top portfolio holdings of a quant fund
// with approximate % of their portfolio. Uses Firecrawl to scrape public 13F
// summary pages from Stockcircle.
//
// Input: { fund: string }   // fund slug or display name
// Output: { fund, holdings: [{ ticker, company, pctOfPortfolio, valueUsd, shares }], asOf, sourceUrl, warnings }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIRECRAWL_KEY = Deno.env.get("FIRECRAWL_API_KEY");

// Curated list of quant / market-maker funds with their Stockcircle slugs.
const FUNDS: Record<string, { name: string; slug: string }> = {
  citadel:        { name: "Citadel Advisors",         slug: "citadel-advisors-llc" },
  renaissance:    { name: "Renaissance Technologies", slug: "renaissance-technologies-llc" },
  "two-sigma":    { name: "Two Sigma Investments",    slug: "two-sigma-investments-lp" },
  millennium:     { name: "Millennium Management",    slug: "millennium-management-llc" },
  "de-shaw":      { name: "D. E. Shaw & Co",          slug: "d-e-shaw-co-inc" },
  susquehanna:    { name: "Susquehanna International",slug: "susquehanna-international-group-llp" },
  balyasny:       { name: "Balyasny Asset Management",slug: "balyasny-asset-management-llc" },
  "jane-street":  { name: "Jane Street Group",        slug: "jane-street-group-llc" },
  point72:        { name: "Point72 Asset Management", slug: "point72-asset-management-l-p" },
  voloridge:      { name: "Voloridge Investment Mgmt",slug: "voloridge-investment-management-llc" },
};

interface Holding {
  ticker: string;
  company: string;
  pctOfPortfolio: number | null;
  valueUsd: number | null;
  shares: number | null;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function firecrawlScrape(url: string): Promise<{ md: string | null; error?: string }> {
  if (!FIRECRAWL_KEY) return { md: null, error: "missing_key" };
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 30_000);
    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return { md: null, error: `http_${res.status}` };
    const data = await res.json();
    const root = data?.data ?? data ?? {};
    const md: string = root.markdown ?? "";
    if (!md.trim()) return { md: null, error: "empty" };
    return { md };
  } catch (e) {
    return { md: null, error: e instanceof Error ? e.message : "fetch_error" };
  }
}

function parseNumber(s: string): number | null {
  const cleaned = s.replace(/[$,\s]/g, "").replace(/[KMB]$/i, "");
  const v = parseFloat(cleaned);
  if (!Number.isFinite(v)) return null;
  const last = s.trim().slice(-1).toUpperCase();
  if (last === "K") return v * 1e3;
  if (last === "M") return v * 1e6;
  if (last === "B") return v * 1e9;
  return v;
}

// Stockcircle markdown rows look like:
// | [NVDA](/stocks/NVDA) | NVIDIA Corp | 12.34% | $1.2B | 5,000,000 |
// We look for any row containing a percentage that plausibly is "% of portfolio".
function parseHoldings(md: string): Holding[] {
  const out: Holding[] = [];
  const lines = md.split("\n");
  // Generic table row regex with at least 4 cells
  const rowRe = /^\s*\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|(.+)$/;

  for (const line of lines) {
    const m = line.match(rowRe);
    if (!m) continue;

    // Try to extract a ticker from any cell (links like [NVDA](...))
    const cells = [m[1], m[2], m[3], m[4], m[5]].map((c) => c.trim());
    let ticker: string | null = null;
    let company: string | null = null;

    for (const c of cells) {
      const linkMatch = c.match(/\[([A-Z][A-Z0-9.\-]{0,5})\]\(/);
      if (linkMatch) { ticker = linkMatch[1]; break; }
    }
    if (!ticker) {
      // Plain uppercase ticker pattern in first cell
      const plain = cells[0].match(/^([A-Z][A-Z0-9.\-]{0,5})$/);
      if (plain) ticker = plain[1];
    }
    if (!ticker) continue;

    // Find the pct (small number with %), value (with $), shares (large bare integer)
    let pct: number | null = null;
    let value: number | null = null;
    let shares: number | null = null;

    for (const c of cells) {
      const pctM = c.match(/^([\d.]+)\s*%$/);
      if (pctM && pct === null) {
        const v = parseFloat(pctM[1]);
        if (Number.isFinite(v) && v <= 100) pct = v;
        continue;
      }
      if (c.includes("$") && value === null) {
        value = parseNumber(c);
        continue;
      }
      // Shares: pure number with commas, no $ no %
      if (/^[\d,]+$/.test(c) && shares === null) {
        shares = parseNumber(c);
      }
    }

    // Company is usually the cell that's not the ticker, not numeric
    for (const c of cells) {
      if (/^\s*$/.test(c)) continue;
      if (c.includes(ticker)) continue;
      if (/[%$]/.test(c)) continue;
      if (/^[\d,]+$/.test(c)) continue;
      if (/^\-+$/.test(c)) continue;
      company = c.replace(/[*_`]/g, "").trim();
      break;
    }

    if (pct === null && value === null) continue; // not a holdings row

    out.push({
      ticker,
      company: company || ticker,
      pctOfPortfolio: pct,
      valueUsd: value,
      shares,
    });
  }

  // Dedup by ticker keeping first
  const seen = new Set<string>();
  const dedup = out.filter((h) => {
    if (seen.has(h.ticker)) return false;
    seen.add(h.ticker);
    return true;
  });

  // Sort by % desc (fallback to value)
  dedup.sort((a, b) => {
    const ap = a.pctOfPortfolio ?? -1;
    const bp = b.pctOfPortfolio ?? -1;
    if (bp !== ap) return bp - ap;
    return (b.valueUsd ?? 0) - (a.valueUsd ?? 0);
  });

  return dedup.slice(0, 20);
}

function parseAsOf(md: string): string | null {
  const m = md.match(/(?:as of|reported|filing date|quarter ended)[^\n]{0,40}?([A-Z][a-z]+ \d{1,2},? \d{4}|\d{1,2}\/\d{1,2}\/\d{4}|Q[1-4] \d{4})/i);
  return m ? m[1] : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const fundKey = String(body.fund || "").toLowerCase().trim();

    if (!fundKey || !FUNDS[fundKey]) {
      return json({
        error: "Unknown fund",
        availableFunds: Object.entries(FUNDS).map(([key, f]) => ({ key, name: f.name })),
      }, 400);
    }

    if (!FIRECRAWL_KEY) {
      return json({ error: "FIRECRAWL_API_KEY not configured" }, 500);
    }

    const fund = FUNDS[fundKey];
    const url = `https://stockcircle.com/portfolio/${fund.slug}`;

    const { md, error } = await firecrawlScrape(url);
    if (!md) {
      return json({
        fund: fund.name,
        holdings: [],
        sourceUrl: url,
        warnings: [`Scrape failed: ${error || "unknown"}`],
      });
    }

    const holdings = parseHoldings(md);
    const asOf = parseAsOf(md);

    return json({
      fund: fund.name,
      slug: fund.slug,
      holdings,
      asOf,
      sourceUrl: url,
      warnings: holdings.length === 0 ? ["No holdings parsed — page format may have changed"] : [],
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("quant-loaders-scan error", msg);
    return json({ error: msg }, 500);
  }
});
