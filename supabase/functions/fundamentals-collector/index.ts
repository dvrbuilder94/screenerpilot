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
   Types
========================= */
interface FundamentalQuarter {
  symbol: string;
  fiscal_quarter: string;

  revenue: number | null;
  ebitda: number | null;
  operating_income: number | null;
  net_income: number | null;

  total_debt: number | null;
  cash_and_equivalents: number | null;
  total_equity: number | null;

  current_assets: number | null;
  current_liabilities: number | null;

  operating_cash_flow: number | null;
  capital_expenditures: number | null;
  free_cash_flow: number | null;

  enterprise_value: number | null;
  ev_ebitda: number | null;
  price_sales: number | null;

  last_updated: string;
}

/* =========================
   Yahoo Fetch
========================= */
async function fetchYahooFundamentals(symbol: string): Promise<FundamentalQuarter[]> {
  try {
    const url =
      `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}` +
      `?modules=incomeStatementHistoryQuarterly,balanceSheetHistoryQuarterly,cashflowStatementHistoryQuarterly,defaultKeyStatistics`;

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!res.ok) throw new Error(`Yahoo failed ${res.status}`);

    const json = await res.json();
    const r = json?.quoteSummary?.result?.[0];
    if (!r) return [];

    const income = r.incomeStatementHistoryQuarterly?.incomeStatementHistory ?? [];
    const balance = r.balanceSheetHistoryQuarterly?.balanceSheetStatements ?? [];
    const cashflow = r.cashflowStatementHistoryQuarterly?.cashflowStatements ?? [];
    const stats = r.defaultKeyStatistics ?? {};

    const quarters: FundamentalQuarter[] = [];

    for (let i = 0; i < Math.min(2, income.length); i++) {
      const inc = income[i] ?? {};
      const bal = balance[i] ?? {};
      const cf = cashflow[i] ?? {};

      const endDate = inc.endDate?.fmt;
      if (!endDate) continue;

      const d = new Date(endDate);
      const q = Math.ceil((d.getMonth() + 1) / 3);
      const fiscal = `${d.getFullYear()}Q${q}`;

      quarters.push({
        symbol,
        fiscal_quarter: fiscal,

        revenue: inc.totalRevenue?.raw ?? null,
        ebitda: inc.ebitda?.raw ?? null,
        operating_income: inc.operatingIncome?.raw ?? null,
        net_income: inc.netIncome?.raw ?? null,

        total_debt: bal.longTermDebt?.raw ?? null,
        cash_and_equivalents: bal.cash?.raw ?? null,
        total_equity: bal.totalStockholderEquity?.raw ?? null,

        current_assets: bal.totalCurrentAssets?.raw ?? null,
        current_liabilities: bal.totalCurrentLiabilities?.raw ?? null,

        operating_cash_flow: cf.totalCashFromOperatingActivities?.raw ?? null,
        capital_expenditures: cf.capitalExpenditures?.raw ?? null,
        free_cash_flow: cf.freeCashFlow?.raw ?? null,

        enterprise_value: stats.enterpriseValue?.raw ?? null,
        ev_ebitda: stats.enterpriseToEbitda?.raw ?? null,
        price_sales: stats.priceToSalesTrailing12Months?.raw ?? null,

        last_updated: new Date().toISOString(),
      });
    }

    return quarters;
  } catch (err) {
    console.error(`Yahoo fundamentals failed for ${symbol}`, err);
    return [];
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
    const { data: universe, error } = await supabase.from("stock_universe").select("symbol").eq("is_active", true);

    if (error) throw error;
    if (!universe || universe.length === 0) {
      return new Response(JSON.stringify({ success: true, processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;
    let skipped = 0;

    for (const row of universe) {
      const quarters = await fetchYahooFundamentals(row.symbol);

      if (quarters.length === 0) {
        skipped++;
        continue;
      }

      const { error: upsertError } = await supabase.from("stock_fundamentals").upsert(quarters, {
        onConflict: "symbol,fiscal_quarter",
      });

      if (upsertError) {
        console.error(`Upsert failed for ${row.symbol}`, upsertError);
        skipped++;
      } else {
        processed++;
      }

      // Soft rate limit
      await new Promise((r) => setTimeout(r, 350));
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        skipped,
        total: universe.length,
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
