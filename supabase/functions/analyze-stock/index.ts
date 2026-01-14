import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// -------------------- TYPES --------------------

interface StockData {
  symbol: string;
  companyName: string;
  price: number;
  marketCap: number;
  dayChange: number;
  dayChangePercent: number;
  fiftyDayAverage: number;
  twoHundredDayAverage: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  volume: number;
  avgVolume: number;
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
  priceAction: {
    trend: string;
    momentum: string;
    volatility: string;
    support: string;
  };
  summary: string;
}

// -------------------- FETCH HELPERS --------------------

async function fetchStockData(symbol: string): Promise<StockData | null> {
  try {
    // Use chart endpoint which is more permissive
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=6mo&interval=1d&includePrePost=false`;
    console.log(`Fetching data for ${symbol}`);
    
    const res = await fetch(url, { 
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    
    if (!res.ok) {
      console.error(`Fetch failed: ${res.status}`);
      return null;
    }
    
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    const meta = result?.meta;
    const quote = result?.indicators?.quote?.[0];
    
    if (!meta || !quote) {
      console.error("Invalid response structure");
      return null;
    }
    
    console.log(`Data fetched: ${meta.symbol} @ ${meta.regularMarketPrice}`);
    
    return {
      symbol: meta.symbol,
      companyName: meta.shortName || meta.longName || symbol,
      price: meta.regularMarketPrice ?? 0,
      marketCap: meta.marketCap ?? 0,
      dayChange: meta.regularMarketPrice - meta.previousClose,
      dayChangePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
      fiftyDayAverage: meta.fiftyDayAverage ?? 0,
      twoHundredDayAverage: meta.twoHundredDayAverage ?? 0,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? 0,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? 0,
      volume: meta.regularMarketVolume ?? 0,
      avgVolume: meta.averageDailyVolume10Day ?? meta.averageDailyVolume3Month ?? 0,
    };
  } catch (err) {
    console.error("Fetch error:", err);
    return null;
  }
}

// -------------------- ANALYSIS LOGIC --------------------

function analyzeStock(data: StockData): { verdict: string; confidence: number; summary: string; priceAction: AnalysisResult["priceAction"] } {
  let score = 50;
  const reasons: string[] = [];
  
  // Price vs Moving Averages
  const aboveFiftyDay = data.price > data.fiftyDayAverage;
  const aboveTwoHundredDay = data.price > data.twoHundredDayAverage;
  const fiftyAboveTwoHundred = data.fiftyDayAverage > data.twoHundredDayAverage;
  
  // Trend analysis
  let trend = "Neutral";
  if (aboveFiftyDay && aboveTwoHundredDay && fiftyAboveTwoHundred) {
    score += 20;
    trend = "Strong uptrend";
    reasons.push("strong uptrend");
  } else if (aboveFiftyDay && aboveTwoHundredDay) {
    score += 15;
    trend = "Uptrend";
    reasons.push("above key averages");
  } else if (!aboveFiftyDay && !aboveTwoHundredDay) {
    score -= 15;
    trend = "Downtrend";
    reasons.push("below key averages");
  } else if (aboveTwoHundredDay && !aboveFiftyDay) {
    trend = "Pullback in uptrend";
    score += 5;
    reasons.push("pulling back to support");
  } else {
    trend = "Mixed";
  }
  
  // 52-week range position
  const rangePosition = (data.price - data.fiftyTwoWeekLow) / (data.fiftyTwoWeekHigh - data.fiftyTwoWeekLow);
  
  let momentum = "Neutral";
  if (rangePosition > 0.8) {
    momentum = "Near highs";
    score += 10;
    reasons.push("near 52-week highs");
  } else if (rangePosition < 0.2) {
    momentum = "Near lows";
    score -= 10;
    reasons.push("near 52-week lows");
  } else if (rangePosition > 0.6) {
    momentum = "Strong";
    score += 5;
  } else if (rangePosition < 0.4) {
    momentum = "Weak";
    score -= 5;
  }
  
  // Volume analysis
  const volumeRatio = data.volume / data.avgVolume;
  let volatility = "Normal";
  if (volumeRatio > 2) {
    volatility = "High volume";
    reasons.push("unusual volume");
  } else if (volumeRatio > 1.5) {
    volatility = "Above average";
  } else if (volumeRatio < 0.5) {
    volatility = "Low volume";
  }
  
  // Support level
  const distanceFromFifty = ((data.price - data.fiftyDayAverage) / data.fiftyDayAverage) * 100;
  let support = "N/A";
  if (distanceFromFifty > 10) {
    support = "Extended";
  } else if (distanceFromFifty > 0 && distanceFromFifty <= 5) {
    support = "At 50-day MA";
    score += 5;
  } else if (distanceFromFifty < 0 && distanceFromFifty >= -5) {
    support = "Testing 50-day";
  } else if (distanceFromFifty < -10) {
    support = "Below support";
    score -= 5;
  }
  
  // Day change sentiment
  if (data.dayChangePercent > 3) {
    score += 5;
    reasons.push("strong daily move");
  } else if (data.dayChangePercent < -3) {
    score -= 5;
    reasons.push("weak daily action");
  }
  
  // Clamp score
  score = Math.max(0, Math.min(100, score));
  
  // Determine verdict
  let verdict: string;
  let summary: string;
  
  if (score >= 75) {
    verdict = "Bullish momentum";
    summary = `Strong technical setup with ${reasons.slice(0, 2).join(" and ") || "bullish indicators"}`;
  } else if (score >= 60) {
    verdict = "Constructive";
    summary = `Positive price structure: ${reasons.slice(0, 2).join(", ") || "above key levels"}`;
  } else if (score >= 45) {
    verdict = "Neutral / Wait";
    summary = "Mixed signals - wait for clearer direction";
  } else {
    verdict = "Caution";
    const negativeReasons = reasons.filter(r => 
      r.includes("below") || r.includes("low") || r.includes("weak")
    );
    summary = `Weak technicals: ${negativeReasons.slice(0, 2).join(", ") || "price under pressure"}`;
  }
  
  return { 
    verdict, 
    confidence: score, 
    summary,
    priceAction: { trend, momentum, volatility, support }
  };
}

function formatMarketCap(cap: number): string {
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(1)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(0)}M`;
  if (cap === 0) return "N/A";
  return `$${cap.toLocaleString()}`;
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
    console.log(`\n========== Analyzing: ${cleanSymbol} ==========`);
    
    const data = await fetchStockData(cleanSymbol);
    
    if (!data) {
      return new Response(
        JSON.stringify({ error: `Unable to fetch data for ${cleanSymbol}. Please verify the ticker symbol.` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Analyze the stock
    const { verdict, confidence, summary, priceAction } = analyzeStock(data);
    
    const result: AnalysisResult = {
      symbol: cleanSymbol,
      companyName: data.companyName,
      price: data.price,
      marketCap: formatMarketCap(data.marketCap),
      verdict,
      confidence,
      signals: {
        fundamentals: {
          revenueQoQ: "N/A",
          marginTrend: "N/A",
          fcf: "N/A",
        },
        risk: {
          dilution: "N/A",
          debt: "N/A",
        },
      },
      priceAction,
      summary,
    };
    
    console.log(`✅ Analysis complete: ${verdict} (${confidence}%)`);
    
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
