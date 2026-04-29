// Quant Holdings Viewer — Returns the top portfolio holdings of a quant fund
// with approximate % of their portfolio. Uses Firecrawl to scrape public 13F
// summary pages from HedgeFollow.
//
// Input: { fund: string }   // fund key
// Output: { fund, holdings: [...], asOf, sourceUrl, warnings }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIRECRAWL_KEY = Deno.env.get("FIRECRAWL_API_KEY");

// Curated list of quant / market-maker funds with HedgeFollow URL slugs.
// HedgeFollow URLs use "Fund+Name" format with + as space.
const FUNDS: Record<string, { name: string; slug: string }> = {
  citadel:        { name: "Citadel Advisors",          slug: "Citadel+Advisors" },
  renaissance:    { name: "Renaissance Technologies",  slug: "Renaissance+Technologies" },
  "two-sigma":    { name: "Two Sigma Investments",     slug: "Two+Sigma+Investments" },
  millennium:     { name: "Millennium Management",     slug: "Millennium+Management" },
  "de-shaw":      { name: "D. E. Shaw & Co",           slug: "D+E+Shaw" },
  susquehanna:    { name: "Susquehanna International", slug: "Susquehanna+International+Group" },
  balyasny:       { name: "Balyasny Asset Mgmt",       slug: "Balyasny+Asset+Management" },
  "jane-street":  { name: "Jane Street Group",         slug: "Jane+Street+Group" },
  point72:        { name: "Point72 Asset Mgmt",        slug: "Point72+Asset+Management" },
  voloridge:      { name: "Voloridge Investment Mgmt", slug: "Voloridge+Investment+Management" },
};

interface Holding {
  ticker: string;
  company: string;
  pctOfPortfolio: number | null;
  valueUsd: number | null;
  shares: number | null;
  deltaPct: number | null;     // QoQ change in shares (when available)
  asOf: string | null;
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

function parseShares(s: string): number | null {
  // "21.6M", "5.5M", "700k", "13.1M", "5864"
  const m = s.trim().match(/^([\d.,]+)\s*([KMB])?$/i);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  const suf = (m[2] || "").toUpperCase();
  if (suf === "K") return n * 1e3;
  if (suf === "M") return n * 1e6;
  if (suf === "B") return n * 1e9;
  return n;
}

function parseMoney(s: string): number | null {
  // "$ 4B", "$ 967M", "$1.5B"
  const m = s.replace(/[$,\s]/g, "").match(/^([\d.]+)([KMB])?$/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return null;
  const suf = (m[2] || "").toUpperCase();
  if (suf === "K") return n * 1e3;
  if (suf === "M") return n * 1e6;
  if (suf === "B") return n * 1e9;
  return n;
}

// HedgeFollow holdings rows look like:
// | [NVDA](https://hedgefollow.com/stocks/NVDA) | [Nvidia Corporation](https://hedgefollow.com/stocks/NVDA) | 2.74% | 21.6M | $ 4B | 119.55%(+11.7M) |  | $162.43 (+31.2%) |  | 2025-12-31 |
function parseHoldings(md: string): Holding[] {
  const out: Holding[] = [];
  const lines = md.split("\n");

  for (const line of lines) {
    // Must start with a ticker link in markdown
    const tickerMatch = line.match(/^\s*\|\s*\[([A-Z][A-Z0-9.\-]{0,5})\]\(/);
    if (!tickerMatch) continue;
    const ticker = tickerMatch[1];

    // Split into cells
    const cells = line.split("|").map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1 || arr.length < 3);
    // Re-do split safer:
    const allCells = line.split("|").map((c) => c.trim());
    // Drop leading/trailing empty cells from outer pipes
    const filteredCells = allCells.slice(1, allCells.length - 1);
    if (filteredCells.length < 5) continue;

    // Cell 0: ticker link, Cell 1: company link, Cell 2: % portfolio, Cell 3: shares, Cell 4: value, Cell 5: change %
    const companyCell = filteredCells[1] || "";
    const companyMatch = companyCell.match(/\[([^\]]+)\]/);
    const company = companyMatch ? companyMatch[1] : ticker;

    const pctCell = filteredCells[2] || "";
    const pctMatch = pctCell.match(/([\d.]+)\s*%/);
    const pctOfPortfolio = pctMatch ? parseFloat(pctMatch[1]) : null;

    const sharesCell = filteredCells[3] || "";
    const shares = parseShares(sharesCell);

    const valueCell = filteredCells[4] || "";
    const valueUsd = parseMoney(valueCell);

    const deltaCell = filteredCells[5] || "";
    const deltaMatch = deltaCell.match(/([+-]?[\d.]+)\s*%/);
    const deltaPct = deltaMatch ? parseFloat(deltaMatch[1]) : null;

    // Date is usually last cell with content
    let asOf: string | null = null;
    for (let i = filteredCells.length - 1; i >= 0; i--) {
      const dm = filteredCells[i].match(/(\d{4}-\d{2}-\d{2})/);
      if (dm) { asOf = dm[1]; break; }
    }

    if (pctOfPortfolio === null && valueUsd === null) continue;

    out.push({ ticker, company, pctOfPortfolio, valueUsd, shares, deltaPct, asOf });
  }

  // Dedup by ticker (first wins, since table is sorted by % desc)
  const seen = new Set<string>();
  const dedup = out.filter((h) => {
    if (seen.has(h.ticker)) return false;
    seen.add(h.ticker);
    return true;
  });

  return dedup.slice(0, 25);
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
    const url = `https://hedgefollow.com/funds/${fund.slug}`;

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
    const asOf = holdings.find((h) => h.asOf)?.asOf ?? null;

    return json({
      fund: fund.name,
      holdings,
      asOf,
      sourceUrl: url,
      warnings: holdings.length === 0
        ? ["No holdings parsed — page format may have changed"]
        : [],
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("quant-loaders-scan error", msg);
    return json({ error: msg }, 500);
  }
});
