import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface YahooFinancials {
  revenue: number | null;
  ebitda: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  totalDebt: number | null;
  cash: number | null;
  totalEquity: number | null;
  sharesOutstanding: number | null;
  currentAssets: number | null;
  currentLiabilities: number | null;
  operatingCashFlow: number | null;
  capex: number | null;
  freeCashFlow: number | null;
  enterpriseValue: number | null;
  evEbitda: number | null;
  priceSales: number | null;
  fiscalQuarter: string;
}

async function fetchYahooFinancials(symbol: string): Promise<YahooFinancials[]> {
  try {
    // Fetch from Yahoo Finance quoteSummary endpoint
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=incomeStatementHistoryQuarterly,balanceSheetHistoryQuarterly,cashflowStatementHistoryQuarterly,defaultKeyStatistics,financialData`;
    
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!res.ok) {
      console.log(`Yahoo fetch failed for ${symbol}: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const result = data.quoteSummary?.result?.[0];
    
    if (!result) {
      console.log(`No data for ${symbol}`);
      return [];
    }

    const incomeStatements = result.incomeStatementHistoryQuarterly?.incomeStatementHistory || [];
    const balanceSheets = result.balanceSheetHistoryQuarterly?.balanceSheetStatements || [];
    const cashFlows = result.cashflowStatementHistoryQuarterly?.cashflowStatements || [];
    const keyStats = result.defaultKeyStatistics || {};
    const financialData = result.financialData || {};

    // Get last 2 quarters
    const quarters: YahooFinancials[] = [];
    
    for (let i = 0; i < Math.min(2, incomeStatements.length); i++) {
      const income = incomeStatements[i] || {};
      const balance = balanceSheets[i] || {};
      const cashflow = cashFlows[i] || {};
      
      // Parse fiscal quarter from endDate
      const endDate = income.endDate?.fmt || "";
      const date = new Date(endDate);
      const year = date.getFullYear();
      const quarter = Math.ceil((date.getMonth() + 1) / 3);
      const fiscalQuarter = `${year}Q${quarter}`;

      quarters.push({
        revenue: income.totalRevenue?.raw ?? null,
        ebitda: income.ebitda?.raw ?? null,
        operatingIncome: income.operatingIncome?.raw ?? null,
        netIncome: income.netIncome?.raw ?? null,
        totalDebt: balance.longTermDebt?.raw ?? null,
        cash: balance.cash?.raw ?? null,
        totalEquity: balance.totalStockholderEquity?.raw ?? null,
        sharesOutstanding: keyStats.sharesOutstanding?.raw ?? null,
        currentAssets: balance.totalCurrentAssets?.raw ?? null,
        currentLiabilities: balance.totalCurrentLiabilities?.raw ?? null,
        operatingCashFlow: cashflow.totalCashFromOperatingActivities?.raw ?? null,
        capex: cashflow.capitalExpenditures?.raw ?? null,
        freeCashFlow: cashflow.freeCashFlow?.raw ?? null,
        enterpriseValue: keyStats.enterpriseValue?.raw ?? null,
        evEbitda: keyStats.enterpriseToEbitda?.raw ?? null,
        priceSales: keyStats.priceToSalesTrailing12Months?.raw ?? null,
        fiscalQuarter,
      });
    }

    return quarters;
  } catch (error) {
    console.error(`Error fetching financials for ${symbol}:`, error);
    return [];
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
    // Get active stocks from universe
    const { data: universe, error: universeError } = await supabase
      .from("stock_universe")
      .select("symbol")
      .eq("is_active", true);

    if (universeError) {
      throw universeError;
    }

    if (!universe || universe.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: "No active stocks in universe" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing fundamentals for ${universe.length} stocks...`);

    let processedCount = 0;
    let errorCount = 0;

    for (const stock of universe) {
      try {
        const financials = await fetchYahooFinancials(stock.symbol);
        
        if (financials.length === 0) {
          console.log(`No financials for ${stock.symbol}`);
          continue;
        }

        // Upsert each quarter
        for (const quarter of financials) {
          const { error: upsertError } = await supabase
            .from("stock_fundamentals")
            .upsert({
              symbol: stock.symbol,
              fiscal_quarter: quarter.fiscalQuarter,
              revenue: quarter.revenue,
              ebitda: quarter.ebitda,
              operating_income: quarter.operatingIncome,
              net_income: quarter.netIncome,
              total_debt: quarter.totalDebt,
              cash_and_equivalents: quarter.cash,
              total_equity: quarter.totalEquity,
              shares_outstanding: quarter.sharesOutstanding,
              current_assets: quarter.currentAssets,
              current_liabilities: quarter.currentLiabilities,
              operating_cash_flow: quarter.operatingCashFlow,
              capital_expenditures: quarter.capex,
              free_cash_flow: quarter.freeCashFlow,
              enterprise_value: quarter.enterpriseValue,
              ev_ebitda: quarter.evEbitda,
              price_sales: quarter.priceSales,
            }, { onConflict: "symbol,fiscal_quarter" });

          if (upsertError) {
            console.error(`Error upserting ${stock.symbol} ${quarter.fiscalQuarter}:`, upsertError);
          }
        }

        processedCount++;
        console.log(`Processed ${stock.symbol}: ${financials.length} quarters`);

        // Rate limiting: 300ms between requests
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (err) {
        console.error(`Error processing ${stock.symbol}:`, err);
        errorCount++;
      }
    }

    console.log(`Completed: ${processedCount} processed, ${errorCount} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processedCount,
        errors: errorCount,
        total: universe.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Fundamentals Collector Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
