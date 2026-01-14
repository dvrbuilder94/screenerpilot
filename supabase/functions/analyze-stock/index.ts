import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const YAHOO_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  "Accept": "application/json",
  "Referer": "https://finance.yahoo.com/",
};

// -------------------- TYPES --------------------

interface QuoteData {
  symbol: string;
  price: number;
  marketCap: number;
  companyName: string;
}

interface FundamentalsData {
  revenueQoQ: number | null;
  marginTrend: "improving" | "deteriorating" | "stable" | null;
  fcfStatus: "positive" | "turned_positive" | "negative" | "deteriorating" | null;
  dilution: "low" | "moderate" | "high" | null;
  netDebtEbitda: number | null;
  debtStatus: "manageable" | "elevated" | "high" | null;
}

interface AnalysisResult {
  symbol: string;
  companyName: string;
  price: number;
  marketCap: string;
  verdict: string;
  confidence: number;
  signals: {
    fundamentals: {
      revenueQoQ: string;
      marginTrend: string;
      fcf: string;
    };
    risk: {
      dilution: string;
      debt: string;
    };
  };
  summary: string;
}

// -------------------- FETCH HELPERS --------------------

async function fetchQuote(symbol: string): Promise<QuoteData | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;
    const res = await fetch(url, { headers: YAHOO_HEADERS });
    
    if (!res.ok) {
      console.error(`Quote fetch failed: ${res.status}`);
      return null;
    }
    
    const json = await res.json();
    const quote = json?.quoteResponse?.result?.[0];
    
    if (!quote) return null;
    
    return {
      symbol: quote.symbol,
      price: quote.regularMarketPrice ?? 0,
      marketCap: quote.marketCap ?? 0,
      companyName: quote.shortName || quote.longName || symbol,
    };
  } catch (err) {
    console.error("Quote fetch error:", err);
    return null;
  }
}

async function fetchFundamentals(symbol: string): Promise<FundamentalsData | null> {
  try {
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=incomeStatementHistoryQuarterly,cashflowStatementHistoryQuarterly,balanceSheetHistoryQuarterly`;
    const res = await fetch(url, { headers: YAHOO_HEADERS });
    
    if (!res.ok) {
      console.error(`Fundamentals fetch failed: ${res.status}`);
      return null;
    }
    
    const json = await res.json();
    const data = json?.quoteSummary?.result?.[0];
    
    if (!data) return null;
    
    const income = data.incomeStatementHistoryQuarterly?.incomeStatementHistory || [];
    const cashflow = data.cashflowStatementHistoryQuarterly?.cashflowStatements || [];
    const balance = data.balanceSheetHistoryQuarterly?.balanceSheetStatements || [];
    
    if (income.length < 2) return null;
    
    const cur = income[0];
    const prev = income[1];
    
    // Revenue QoQ
    const curRevenue = cur.totalRevenue?.raw || 0;
    const prevRevenue = prev.totalRevenue?.raw || 0;
    const revenueQoQ = prevRevenue > 0 ? ((curRevenue - prevRevenue) / prevRevenue) * 100 : null;
    
    // Margin trend (EBITDA margin)
    const curEbitda = cur.ebitda?.raw || 0;
    const prevEbitda = prev.ebitda?.raw || 0;
    const curMargin = curRevenue > 0 ? curEbitda / curRevenue : 0;
    const prevMargin = prevRevenue > 0 ? prevEbitda / prevRevenue : 0;
    const marginDelta = curMargin - prevMargin;
    
    let marginTrend: "improving" | "deteriorating" | "stable" | null = null;
    if (marginDelta > 0.02) marginTrend = "improving";
    else if (marginDelta < -0.02) marginTrend = "deteriorating";
    else marginTrend = "stable";
    
    // FCF status
    const curFcf = cashflow[0]?.freeCashFlow?.raw || 0;
    const prevFcf = cashflow[1]?.freeCashFlow?.raw || 0;
    
    let fcfStatus: "positive" | "turned_positive" | "negative" | "deteriorating" | null = null;
    if (curFcf > 0 && prevFcf <= 0) fcfStatus = "turned_positive";
    else if (curFcf > 0) fcfStatus = "positive";
    else if (curFcf < prevFcf) fcfStatus = "deteriorating";
    else fcfStatus = "negative";
    
    // Dilution
    const curShares = balance[0]?.commonStock?.raw || cur.dilutedAverageShares?.raw || 0;
    const prevShares = balance[1]?.commonStock?.raw || prev.dilutedAverageShares?.raw || 0;
    const shareChange = prevShares > 0 ? ((curShares - prevShares) / prevShares) * 100 : 0;
    
    let dilution: "low" | "moderate" | "high" | null = null;
    if (shareChange < 1) dilution = "low";
    else if (shareChange < 5) dilution = "moderate";
    else dilution = "high";
    
    // Net Debt / EBITDA
    const totalDebt = balance[0]?.totalDebt?.raw || balance[0]?.longTermDebt?.raw || 0;
    const cash = balance[0]?.cashAndCashEquivalents?.raw || balance[0]?.cash?.raw || 0;
    const netDebt = totalDebt - cash;
    const netDebtEbitda = curEbitda > 0 ? netDebt / curEbitda : null;
    
    let debtStatus: "manageable" | "elevated" | "high" | null = null;
    if (netDebtEbitda === null) debtStatus = null;
    else if (netDebtEbitda < 2) debtStatus = "manageable";
    else if (netDebtEbitda < 4) debtStatus = "elevated";
    else debtStatus = "high";
    
    return {
      revenueQoQ,
      marginTrend,
      fcfStatus,
      dilution,
      netDebtEbitda,
      debtStatus,
    };
  } catch (err) {
    console.error("Fundamentals fetch error:", err);
    return null;
  }
}

// -------------------- ANALYSIS LOGIC --------------------

function calculateVerdict(fundamentals: FundamentalsData): { verdict: string; confidence: number; summary: string } {
  let score = 50; // Base score
  const reasons: string[] = [];
  
  // Revenue growth scoring
  if (fundamentals.revenueQoQ !== null) {
    if (fundamentals.revenueQoQ > 20) {
      score += 15;
      reasons.push("strong revenue growth");
    } else if (fundamentals.revenueQoQ > 10) {
      score += 10;
      reasons.push("solid revenue growth");
    } else if (fundamentals.revenueQoQ > 0) {
      score += 5;
      reasons.push("positive revenue trend");
    } else if (fundamentals.revenueQoQ < -10) {
      score -= 15;
      reasons.push("revenue declining");
    }
  }
  
  // Margin trend scoring
  if (fundamentals.marginTrend === "improving") {
    score += 15;
    reasons.push("margins expanding");
  } else if (fundamentals.marginTrend === "deteriorating") {
    score -= 10;
    reasons.push("margin compression");
  }
  
  // FCF scoring
  if (fundamentals.fcfStatus === "turned_positive") {
    score += 20;
    reasons.push("FCF inflection");
  } else if (fundamentals.fcfStatus === "positive") {
    score += 10;
  } else if (fundamentals.fcfStatus === "deteriorating") {
    score -= 10;
    reasons.push("cash burn increasing");
  }
  
  // Dilution penalty
  if (fundamentals.dilution === "high") {
    score -= 15;
    reasons.push("significant dilution");
  } else if (fundamentals.dilution === "moderate") {
    score -= 5;
  }
  
  // Debt scoring
  if (fundamentals.debtStatus === "high") {
    score -= 10;
    reasons.push("high leverage");
  } else if (fundamentals.debtStatus === "manageable") {
    score += 5;
  }
  
  // Clamp score
  score = Math.max(0, Math.min(100, score));
  
  // Determine verdict
  let verdict: string;
  let summary: string;
  
  if (score >= 75) {
    verdict = "Bullish inflection";
    summary = `Strong fundamental improvement with ${reasons.slice(0, 2).join(" and ")}`;
  } else if (score >= 60) {
    verdict = "Fundamentals improving, price lagging";
    summary = `Business showing positive trends: ${reasons.slice(0, 2).join(", ")}`;
  } else if (score >= 45) {
    verdict = "Neutral / mixed signals";
    summary = "Mixed fundamental picture with both positives and concerns";
  } else {
    verdict = "Deteriorating fundamentals";
    summary = `Caution warranted: ${reasons.filter(r => r.includes("declin") || r.includes("compres") || r.includes("dilut") || r.includes("burn")).slice(0, 2).join(", ") || "fundamentals weakening"}`;
  }
  
  return { verdict, confidence: score, summary };
}

function formatMarketCap(cap: number): string {
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(1)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(0)}M`;
  return `$${cap.toLocaleString()}`;
}

function formatRevenueQoQ(val: number | null): string {
  if (val === null) return "N/A";
  const sign = val >= 0 ? "+" : "";
  return `${sign}${val.toFixed(1)}%`;
}

// -------------------- MAIN HANDLER --------------------

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { symbol } = await req.json();
    
    if (!symbol || typeof symbol !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'symbol' parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const cleanSymbol = symbol.toUpperCase().trim();
    console.log(`Analyzing stock: ${cleanSymbol}`);
    
    // Fetch quote and fundamentals in parallel
    const [quote, fundamentals] = await Promise.all([
      fetchQuote(cleanSymbol),
      fetchFundamentals(cleanSymbol),
    ]);
    
    if (!quote) {
      return new Response(
        JSON.stringify({ error: `Unable to fetch data for ${cleanSymbol}. Please verify the ticker symbol.` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!fundamentals) {
      return new Response(
        JSON.stringify({ error: `No fundamental data available for ${cleanSymbol}. This may be an ETF, index, or newly listed stock.` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Calculate verdict
    const { verdict, confidence, summary } = calculateVerdict(fundamentals);
    
    const result: AnalysisResult = {
      symbol: cleanSymbol,
      companyName: quote.companyName,
      price: quote.price,
      marketCap: formatMarketCap(quote.marketCap),
      verdict,
      confidence,
      signals: {
        fundamentals: {
          revenueQoQ: formatRevenueQoQ(fundamentals.revenueQoQ),
          marginTrend: fundamentals.marginTrend || "N/A",
          fcf: fundamentals.fcfStatus?.replace("_", " ") || "N/A",
        },
        risk: {
          dilution: fundamentals.dilution || "N/A",
          debt: fundamentals.debtStatus || "N/A",
        },
      },
      summary,
    };
    
    console.log(`Analysis complete for ${cleanSymbol}: ${verdict} (${confidence}%)`);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (err) {
    console.error("Analysis error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
