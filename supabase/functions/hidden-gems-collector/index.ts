import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Universe criteria
const MIN_MARKET_CAP = 300_000_000;  // 300M
const MAX_MARKET_CAP = 5_000_000_000; // 5B

interface StockData {
  symbol: string;
  companyName: string | null;
  sector: string | null;
  marketCap: number;
  avgVolume90d: number;
  revenueGrowthQoQ: number | null;
  marginImprovement: number | null;
  fcfDelta: number | null;
  evEbitda: number | null;
  priceSales: number | null;
  netDebtEbitda: number | null;
  currentRatio: number | null;
  sharesDiluted: boolean;
  trendSlope: number | null;
  atrPercentile: number | null;
}

interface Percentiles {
  revPctl: number;
  marginPctl: number;
  fcfPctl: number;
  valuationPctl: number;
  debtPctl: number;
  capPctl: number;
  volPctl: number;
}

// Percentile function (cross-sectional)
function percentileRank(value: number | null, distribution: number[], invert = false): number | null {
  if (value === null || distribution.length === 0) return null;
  const sorted = [...distribution].sort((a, b) => a - b);
  const rank = sorted.filter(v => v <= value).length;
  const pctl = (rank / sorted.length) * 100;
  return invert ? 100 - pctl : pctl;
}

// Generate human-readable explanation
function generateExplanation(pctls: Percentiles): string {
  const parts: string[] = [];

  if (pctls.revPctl > 70) parts.push("revenue accelerating");
  if (pctls.marginPctl > 70) parts.push("margins expanding");
  if (pctls.fcfPctl > 70) parts.push("cash flow improving");
  if (pctls.valuationPctl > 70) parts.push("valuation compressed vs peers");
  if (pctls.capPctl > 60) parts.push("under-followed");

  if (parts.length === 0) {
    return "Moderate improvement across fundamentals with reasonable valuation.";
  }

  return parts.slice(0, 3).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(", ") + ".";
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
    // ============================================
    // STEP 1: BUILD DYNAMIC UNIVERSE FROM DB
    // ============================================
    const { data: universe, error: universeError } = await supabase
      .from("stock_universe")
      .select("symbol, company_name, sector, market_cap, avg_volume_90d")
      .eq("country", "US")
      .eq("is_active", true)
      .gte("market_cap", MIN_MARKET_CAP)
      .lte("market_cap", MAX_MARKET_CAP)
      .not("avg_volume_90d", "is", null);

    if (universeError) {
      console.error("Universe fetch error:", universeError);
      throw new Error("Failed to fetch universe");
    }

    if (!universe || universe.length === 0) {
      console.log("No stocks in universe, returning early");
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: "No stocks in universe" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Universe size: ${universe.length} stocks`);

    // ============================================
    // STEP 2: FETCH FUNDAMENTALS FOR UNIVERSE
    // ============================================
    const stocksWithData: StockData[] = [];

    for (const stock of universe) {
      // Get last 2 quarters for QoQ comparison
      const { data: quarters } = await supabase
        .from("stock_fundamentals")
        .select("*")
        .eq("symbol", stock.symbol)
        .order("fiscal_quarter", { ascending: false })
        .limit(2);

      if (!quarters || quarters.length < 2) continue;

      const [current, previous] = quarters;

      // Calculate QoQ deltas
      const revenueGrowthQoQ = previous.revenue && previous.revenue > 0
        ? (current.revenue - previous.revenue) / previous.revenue
        : null;

      const marginCurrent = current.revenue && current.revenue > 0 
        ? (current.ebitda || 0) / current.revenue 
        : null;
      const marginPrevious = previous.revenue && previous.revenue > 0 
        ? (previous.ebitda || 0) / previous.revenue 
        : null;
      const marginImprovement = marginCurrent !== null && marginPrevious !== null
        ? marginCurrent - marginPrevious
        : null;

      const fcfDelta = current.free_cash_flow !== null && previous.free_cash_flow !== null
        ? current.free_cash_flow - previous.free_cash_flow
        : null;

      const netDebtCurrent = (current.total_debt || 0) - (current.cash_and_equivalents || 0);
      const netDebtEbitda = current.ebitda && current.ebitda > 0 
        ? netDebtCurrent / current.ebitda 
        : null;

      const currentRatio = current.current_liabilities && current.current_liabilities > 0
        ? (current.current_assets || 0) / current.current_liabilities
        : null;

      const sharesDiluted = previous.shares_outstanding && previous.shares_outstanding > 0 &&
        ((current.shares_outstanding || 0) - previous.shares_outstanding) / previous.shares_outstanding > 0.05;

      stocksWithData.push({
        symbol: stock.symbol,
        companyName: stock.company_name,
        sector: stock.sector,
        marketCap: stock.market_cap,
        avgVolume90d: stock.avg_volume_90d,
        revenueGrowthQoQ,
        marginImprovement,
        fcfDelta,
        evEbitda: current.ev_ebitda,
        priceSales: current.price_sales,
        netDebtEbitda,
        currentRatio,
        sharesDiluted: sharesDiluted || false,
        trendSlope: null, // TODO: Integrate from asset_snapshots
        atrPercentile: null,
      });
    }

    console.log(`Stocks with data: ${stocksWithData.length}`);

    if (stocksWithData.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: "No stocks with fundamental data" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // STEP 3: BUILD CROSS-SECTIONAL DISTRIBUTIONS
    // ============================================
    const distributions = {
      revenueGrowth: stocksWithData.map(s => s.revenueGrowthQoQ).filter((v): v is number => v !== null),
      marginImprovement: stocksWithData.map(s => s.marginImprovement).filter((v): v is number => v !== null),
      fcfDelta: stocksWithData.map(s => s.fcfDelta).filter((v): v is number => v !== null),
      evEbitda: stocksWithData.map(s => s.evEbitda ?? s.priceSales).filter((v): v is number => v !== null),
      netDebtEbitda: stocksWithData.map(s => s.netDebtEbitda).filter((v): v is number => v !== null),
      marketCap: stocksWithData.map(s => s.marketCap).filter((v): v is number => v !== null),
      volume: stocksWithData.map(s => s.avgVolume90d).filter((v): v is number => v !== null),
    };

    // ============================================
    // STEP 4: GET PREVIOUS SCORES FOR TEMPORAL STABILITY
    // ============================================
    const { data: prevScores } = await supabase
      .from("hidden_gems_scores")
      .select("symbol, hidden_gem_score");
    
    const prevScoreMap = new Map(
      (prevScores || []).map(p => [p.symbol, p.hidden_gem_score])
    );

    // ============================================
    // STEP 5: CALCULATE COMPONENT SCORES
    // ============================================
    const scoredStocks = stocksWithData.map(stock => {
      // FUNDAMENTALS (30%) - Higher is better
      const revPctl = percentileRank(stock.revenueGrowthQoQ, distributions.revenueGrowth) ?? 50;
      const marginPctl = percentileRank(stock.marginImprovement, distributions.marginImprovement) ?? 50;
      const fcfPctl = percentileRank(stock.fcfDelta, distributions.fcfDelta) ?? 50;
      
      const fundamentalsScore = revPctl * 0.4 + marginPctl * 0.35 + fcfPctl * 0.25;

      // VALUATION (25%) - Lower is better (inverted)
      const valuationPctl = percentileRank(
        stock.evEbitda ?? stock.priceSales, 
        distributions.evEbitda, 
        true
      ) ?? 50;
      const valuationScore = valuationPctl;

      // BALANCE SHEET (20%)
      const debtPctl = percentileRank(stock.netDebtEbitda, distributions.netDebtEbitda, true) ?? 50;
      const dilutionPenalty = stock.sharesDiluted ? -20 : 0;
      const balanceSheetScore = Math.max(0, Math.min(100, debtPctl + dilutionPenalty));

      // PRICE STRUCTURE (15%) - Placeholder using volume as proxy
      // TODO: Add trend slope calculation from asset_snapshots
      const priceStructureScore = 50;

      // MARKET NEGLECT (10%) - Smaller cap, lower volume = more neglected
      const capPctl = percentileRank(stock.marketCap, distributions.marketCap, true) ?? 50;
      const volPctl = percentileRank(stock.avgVolume90d, distributions.volume, true) ?? 50;
      const marketNeglectScore = capPctl * 0.5 + volPctl * 0.5;

      // COMPOSITE SCORE
      const rawScore = 
        fundamentalsScore * 0.30 +
        valuationScore * 0.25 +
        balanceSheetScore * 0.20 +
        priceStructureScore * 0.15 +
        marketNeglectScore * 0.10;

      // TEMPORAL STABILITY (70% today + 30% yesterday)
      const previousScore = prevScoreMap.get(stock.symbol);
      const finalScore = previousScore !== undefined
        ? rawScore * 0.7 + previousScore * 0.3
        : rawScore;

      // EXPLANATION
      const pctls: Percentiles = { revPctl, marginPctl, fcfPctl, valuationPctl, debtPctl, capPctl, volPctl };
      const explanation = generateExplanation(pctls);

      return {
        symbol: stock.symbol,
        companyName: stock.companyName,
        sector: stock.sector,
        marketCap: stock.marketCap,
        hiddenGemScore: Math.round(finalScore * 10) / 10,
        previousScore: previousScore ?? null,
        fundamentalsScore: Math.round(fundamentalsScore * 10) / 10,
        valuationScore: Math.round(valuationScore * 10) / 10,
        balanceSheetScore: Math.round(balanceSheetScore * 10) / 10,
        priceStructureScore: Math.round(priceStructureScore * 10) / 10,
        marketNeglectScore: Math.round(marketNeglectScore * 10) / 10,
        explanation,
        rank: 0,
        // Raw metrics for debug table
        metrics: {
          revenueGrowthQoQ: stock.revenueGrowthQoQ,
          marginImprovement: stock.marginImprovement,
          fcfDelta: stock.fcfDelta,
          evEbitda: stock.evEbitda,
          priceSales: stock.priceSales,
          netDebtEbitda: stock.netDebtEbitda,
          currentRatio: stock.currentRatio,
          sharesDiluted: stock.sharesDiluted,
          trendSlope: stock.trendSlope,
          atrPercentile: stock.atrPercentile,
          revPctl, marginPctl, fcfPctl, valuationPctl, debtPctl,
        }
      };
    });

    // Sort and rank
    scoredStocks.sort((a, b) => b.hiddenGemScore - a.hiddenGemScore);
    scoredStocks.forEach((s, i) => { s.rank = i + 1; });

    // ============================================
    // STEP 6: UPSERT TO SPLIT TABLES
    // ============================================
    const now = new Date().toISOString();
    
    // Scores table (frontend) - Top 50
    const scoresToUpsert = scoredStocks.slice(0, 50).map(s => ({
      symbol: s.symbol,
      company_name: s.companyName,
      sector: s.sector,
      market_cap: s.marketCap,
      hidden_gem_score: s.hiddenGemScore,
      previous_score: s.previousScore,
      fundamentals_score: s.fundamentalsScore,
      valuation_score: s.valuationScore,
      balance_sheet_score: s.balanceSheetScore,
      price_structure_score: s.priceStructureScore,
      market_neglect_score: s.marketNeglectScore,
      explanation: s.explanation,
      rank: s.rank,
      calculated_at: now,
    }));

    const { error: scoresError } = await supabase
      .from("hidden_gems_scores")
      .upsert(scoresToUpsert, { onConflict: "symbol" });

    if (scoresError) {
      console.error("Scores upsert error:", scoresError);
    }

    // Metrics table (debug) - Top 50
    const metricsToUpsert = scoredStocks.slice(0, 50).map(s => ({
      symbol: s.symbol,
      revenue_growth_qoq: s.metrics.revenueGrowthQoQ,
      margin_improvement_qoq: s.metrics.marginImprovement,
      fcf_delta_qoq: s.metrics.fcfDelta,
      ev_ebitda: s.metrics.evEbitda,
      price_sales: s.metrics.priceSales,
      net_debt_ebitda: s.metrics.netDebtEbitda,
      current_ratio: s.metrics.currentRatio,
      shares_diluted: s.metrics.sharesDiluted,
      trend_slope: s.metrics.trendSlope,
      atr_percentile: s.metrics.atrPercentile,
      revenue_growth_pctl: s.metrics.revPctl,
      margin_improvement_pctl: s.metrics.marginPctl,
      fcf_delta_pctl: s.metrics.fcfPctl,
      valuation_pctl: s.metrics.valuationPctl,
      balance_sheet_pctl: s.metrics.debtPctl,
      calculated_at: now,
    }));

    const { error: metricsError } = await supabase
      .from("hidden_gems_metrics")
      .upsert(metricsToUpsert, { onConflict: "symbol" });

    if (metricsError) {
      console.error("Metrics upsert error:", metricsError);
    }

    console.log(`Successfully processed ${scoredStocks.length} stocks`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: scoredStocks.length,
        top5: scoredStocks.slice(0, 5).map(s => ({ symbol: s.symbol, score: s.hiddenGemScore }))
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Hidden Gems Collector Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
