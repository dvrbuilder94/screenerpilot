import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BATCH_SIZE = 5;

// ---------------- TYPES ----------------

interface YahooQuote {
  symbol: string;
  marketCap?: number;
  regularMarketPrice?: number;
  averageDailyVolume3Month?: number;
}

interface YahooQuarter {
  totalRevenue?: { raw: number };
  ebitda?: { raw: number };
  freeCashFlow?: { raw: number };
  totalDebt?: { raw: number };
  cashAndCashEquivalents?: { raw: number };
  dilutedAverageShares?: { raw: number };
}

// ---------------- HELPERS ----------------

async function fetchQuotes(symbols: string[]): Promise<YahooQuote[]> {
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`;
  const res = await fetch(url);
  const json = await res.json();
  return json.quoteResponse.result;
}

async function fetchFundamentals(symbol: string) {
  const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=incomeStatementHistoryQuarterly,cashflowStatementHistoryQuarterly,balanceSheetHistoryQuarterly`;
  const res = await fetch(url);
  const json = await res.json();
  return json.quoteSummary.result?.[0];
}

function percentile(value: number, dist: number[], invert = false) {
  const sorted = [...dist].sort((a, b) => a - b);
  const rank = sorted.filter((v) => v <= value).length;
  const p = (rank / sorted.length) * 100;
  return invert ? 100 - p : p;
}

// ---------------- EDGE ----------------

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 🔹 Universe (puedes traerlo desde DB)
    const symbols = ["AAPL", "MSFT", "NVDA", "AMD", "INTC", "SOFI", "PLTR", "COIN", "RBLX", "SHOP"];

    // ---------------- QUOTES ----------------
    const quotes: YahooQuote[] = [];

    for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
      const batch = symbols.slice(i, i + BATCH_SIZE);
      const q = await fetchQuotes(batch);
      quotes.push(...q);
    }

    // ---------------- FUNDAMENTALS ----------------
    const stocks: any[] = [];

    for (const q of quotes) {
      if (!q.marketCap || !q.averageDailyVolume3Month) continue;

      const f = await fetchFundamentals(q.symbol);
      if (!f) continue;

      const income = f.incomeStatementHistoryQuarterly?.incomeStatementHistory;
      const cash = f.cashflowStatementHistoryQuarterly?.cashflowStatements;
      const balance = f.balanceSheetHistoryQuarterly?.balanceSheetStatements;

      if (!income || income.length < 2) continue;

      const cur = income[0];
      const prev = income[1];

      const revenueGrowth = prev.totalRevenue?.raw
        ? (cur.totalRevenue.raw - prev.totalRevenue.raw) / prev.totalRevenue.raw
        : null;

      const marginImprovement =
        cur.ebitda?.raw && cur.totalRevenue?.raw && prev.ebitda?.raw && prev.totalRevenue?.raw
          ? cur.ebitda.raw / cur.totalRevenue.raw - prev.ebitda.raw / prev.totalRevenue.raw
          : null;

      const fcfDelta =
        cash?.[0]?.freeCashFlow?.raw && cash?.[1]?.freeCashFlow?.raw
          ? cash[0].freeCashFlow.raw - cash[1].freeCashFlow.raw
          : null;

      const netDebt = (balance?.[0]?.totalDebt?.raw || 0) - (balance?.[0]?.cashAndCashEquivalents?.raw || 0);

      const netDebtEbitda = cur.ebitda?.raw && cur.ebitda.raw > 0 ? netDebt / cur.ebitda.raw : null;

      stocks.push({
        symbol: q.symbol,
        marketCap: q.marketCap,
        volume: q.averageDailyVolume3Month,
        revenueGrowth,
        marginImprovement,
        fcfDelta,
        netDebtEbitda,
      });
    }

    // ---------------- SCORING ----------------
    const revDist = stocks.map((s) => s.revenueGrowth).filter(Boolean);
    const marginDist = stocks.map((s) => s.marginImprovement).filter(Boolean);
    const fcfDist = stocks.map((s) => s.fcfDelta).filter(Boolean);
    const debtDist = stocks.map((s) => s.netDebtEbitda).filter(Boolean);
    const capDist = stocks.map((s) => s.marketCap);

    const scored = stocks
      .map((s) => {
        const score =
          percentile(s.revenueGrowth, revDist) * 0.4 +
          percentile(s.marginImprovement, marginDist) * 0.3 +
          percentile(s.fcfDelta, fcfDist) * 0.2 +
          percentile(s.marketCap, capDist, true) * 0.1;

        return {
          symbol: s.symbol,
          score: Math.round(score * 10) / 10,
        };
      })
      .sort((a, b) => b.score - a.score);

    return new Response(JSON.stringify({ success: true, scored }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
