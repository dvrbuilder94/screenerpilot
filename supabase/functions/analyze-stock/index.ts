import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// -------------------- TYPES --------------------

interface Candle {
  t: number; // timestamp (s)
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

interface StockData {
  symbol: string;
  companyName: string;
  price: number;
  marketCap: number;
  dayChange: number;
  dayChangePercent: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  volume: number;
  avgVolume: number;
  candles: Candle[];
}

interface InsightBullet {
  category: string;
  text: string;
}

// -------------------- INDICATORS --------------------

function ema(values: number[], period: number): number[] {
  const out: number[] = new Array(values.length).fill(NaN);
  if (values.length < period) return out;
  const k = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  out[period - 1] = sum / period;
  for (let i = period; i < values.length; i++) {
    out[i] = values[i] * k + out[i - 1] * (1 - k);
  }
  return out;
}

function rsi(values: number[], period = 14): number[] {
  const out: number[] = new Array(values.length).fill(NaN);
  if (values.length <= period) return out;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = values[i] - values[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  gain /= period; loss /= period;
  out[period] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  for (let i = period + 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    const g = d > 0 ? d : 0;
    const l = d < 0 ? -d : 0;
    gain = (gain * (period - 1) + g) / period;
    loss = (loss * (period - 1) + l) / period;
    out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  }
  return out;
}

function macd(values: number[], fast = 12, slow = 26, signal = 9) {
  const emaFast = ema(values, fast);
  const emaSlow = ema(values, slow);
  const macdLine = values.map((_, i) =>
    isNaN(emaFast[i]) || isNaN(emaSlow[i]) ? NaN : emaFast[i] - emaSlow[i]
  );
  // signal EMA on valid macd values
  const valid = macdLine.map(v => (isNaN(v) ? 0 : v));
  const startIdx = macdLine.findIndex(v => !isNaN(v));
  const sliced = valid.slice(startIdx);
  const sigSliced = ema(sliced, signal);
  const signalLine = new Array(values.length).fill(NaN);
  for (let i = 0; i < sigSliced.length; i++) {
    if (!isNaN(sigSliced[i])) signalLine[startIdx + i] = sigSliced[i];
  }
  const hist = macdLine.map((m, i) =>
    isNaN(m) || isNaN(signalLine[i]) ? NaN : m - signalLine[i]
  );
  return { macd: macdLine, signal: signalLine, hist };
}

function bollinger(values: number[], period = 20, mult = 2) {
  const mid: number[] = new Array(values.length).fill(NaN);
  const upper: number[] = new Array(values.length).fill(NaN);
  const lower: number[] = new Array(values.length).fill(NaN);
  for (let i = period - 1; i < values.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += values[j];
    const m = sum / period;
    let v = 0;
    for (let j = i - period + 1; j <= i; j++) v += (values[j] - m) ** 2;
    const sd = Math.sqrt(v / period);
    mid[i] = m;
    upper[i] = m + mult * sd;
    lower[i] = m - mult * sd;
  }
  return { mid, upper, lower };
}

// -------------------- FETCH --------------------

type Timeframe = "daily" | "weekly" | "monthly";

const TF_CONFIG: Record<Timeframe, { range: string; interval: string }> = {
  daily: { range: "1y", interval: "1d" },
  weekly: { range: "5y", interval: "1wk" },
  monthly: { range: "10y", interval: "1mo" },
};

async function fetchStockData(symbol: string, timeframe: Timeframe = "daily"): Promise<StockData | null> {
  try {
    const { range, interval } = TF_CONFIG[timeframe];
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) {
      console.error(`Fetch failed: ${res.status}`);
      return null;
    }
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    const meta = result?.meta;
    const ts: number[] = result?.timestamp || [];
    const q = result?.indicators?.quote?.[0];
    if (!meta || !q || !ts.length) return null;

    const candles: Candle[] = [];
    for (let i = 0; i < ts.length; i++) {
      const o = q.open?.[i], h = q.high?.[i], l = q.low?.[i], c = q.close?.[i], v = q.volume?.[i];
      if (o == null || h == null || l == null || c == null) continue;
      candles.push({ t: ts[i], o, h, l, c, v: v ?? 0 });
    }

    return {
      symbol: meta.symbol,
      companyName: meta.shortName || meta.longName || symbol,
      price: meta.regularMarketPrice ?? candles[candles.length - 1]?.c ?? 0,
      marketCap: meta.marketCap ?? 0,
      dayChange: (meta.regularMarketPrice ?? 0) - (meta.previousClose ?? 0),
      dayChangePercent: meta.previousClose
        ? ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100
        : 0,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? 0,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? 0,
      volume: meta.regularMarketVolume ?? 0,
      avgVolume: meta.averageDailyVolume10Day ?? meta.averageDailyVolume3Month ?? 0,
      candles,
    };
  } catch (err) {
    console.error("Fetch error:", err);
    return null;
  }
}

// -------------------- ANALYSIS --------------------

function classifyRSI(v: number): { label: string; tone: "positive" | "negative" | "neutral" } {
  if (v >= 70) return { label: `${v.toFixed(0)} · Overbought`, tone: "negative" };
  if (v <= 30) return { label: `${v.toFixed(0)} · Oversold`, tone: "positive" };
  if (v >= 55) return { label: `${v.toFixed(0)} · Bullish momentum`, tone: "positive" };
  if (v <= 45) return { label: `${v.toFixed(0)} · Bearish momentum`, tone: "negative" };
  return { label: `${v.toFixed(0)} · Neutral`, tone: "neutral" };
}

function classifyMACD(m: number, s: number, h: number, hPrev: number) {
  const cross = m > s;
  const expanding = Math.abs(h) > Math.abs(hPrev);
  if (cross && h > 0 && expanding) return { label: "Bullish · expanding", tone: "positive" as const };
  if (cross && h > 0) return { label: "Bullish · stable", tone: "positive" as const };
  if (!cross && h < 0 && expanding) return { label: "Bearish · expanding", tone: "negative" as const };
  if (!cross && h < 0) return { label: "Bearish · stable", tone: "negative" as const };
  return { label: "Crossover transition", tone: "neutral" as const };
}

function classifyBB(price: number, upper: number, mid: number, lower: number) {
  const pctB = (price - lower) / (upper - lower);
  const width = ((upper - lower) / mid) * 100;
  if (pctB >= 1) return { label: `Above upper band · %B ${(pctB * 100).toFixed(0)}`, tone: "negative" as const, width };
  if (pctB <= 0) return { label: `Below lower band · %B ${(pctB * 100).toFixed(0)}`, tone: "positive" as const, width };
  if (pctB >= 0.8) return { label: `Near upper · %B ${(pctB * 100).toFixed(0)}`, tone: "negative" as const, width };
  if (pctB <= 0.2) return { label: `Near lower · %B ${(pctB * 100).toFixed(0)}`, tone: "positive" as const, width };
  return { label: `Mid-range · %B ${(pctB * 100).toFixed(0)}`, tone: "neutral" as const, width };
}

function formatMarketCap(cap: number): string {
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(1)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(0)}M`;
  if (cap === 0) return "N/A";
  return `$${cap.toLocaleString()}`;
}

// -------------------- HANDLER --------------------

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { symbol, timeframe } = await req.json();
    if (!symbol || typeof symbol !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'symbol'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const tf: Timeframe = timeframe === "weekly" || timeframe === "monthly" ? timeframe : "daily";

    const cleanSymbol = symbol.toUpperCase().trim();
    console.log(`\n========== Analyzing: ${cleanSymbol} (${tf}) ==========`);

    const data = await fetchStockData(cleanSymbol, tf);
    const minBars = tf === "monthly" ? 24 : tf === "weekly" ? 30 : 50;
    if (!data || data.candles.length < minBars) {
      return new Response(
        JSON.stringify({ error: `Unable to fetch sufficient ${tf} data for ${cleanSymbol}.` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const closes = data.candles.map(c => c.c);
    const ema20 = ema(closes, 20);
    const ema50 = ema(closes, 50);
    const ema200 = ema(closes, 200);
    const rsiArr = rsi(closes, 14);
    const macdRes = macd(closes);
    const bb = bollinger(closes, 20, 2);

    const last = closes.length - 1;
    const price = closes[last];
    const e20 = ema20[last], e50 = ema50[last], e200 = ema200[last];
    const rsiV = rsiArr[last];
    const macdV = macdRes.macd[last], sigV = macdRes.signal[last], histV = macdRes.hist[last];
    const histPrev = macdRes.hist[last - 1] ?? 0;
    const bbU = bb.upper[last], bbM = bb.mid[last], bbL = bb.lower[last];

    // ------ Scoring ------
    let score = 50;
    const reasons: string[] = [];

    // Trend (EMA stack)
    let trend = "Neutral";
    const aboveE50 = price > e50;
    const aboveE200 = !isNaN(e200) && price > e200;
    const stack = !isNaN(e200) && e20 > e50 && e50 > e200;
    if (stack && aboveE200) { score += 20; trend = "Strong uptrend (20>50>200)"; reasons.push("EMA stack bullish"); }
    else if (aboveE50 && aboveE200) { score += 12; trend = "Uptrend"; reasons.push("above key EMAs"); }
    else if (!aboveE50 && !aboveE200) { score -= 18; trend = "Downtrend"; reasons.push("below key EMAs"); }
    else if (aboveE200 && !aboveE50) { score += 3; trend = "Pullback in uptrend"; }
    else { trend = "Mixed"; }

    // RSI
    const rsiC = classifyRSI(rsiV);
    if (rsiC.tone === "positive" && rsiV < 70) score += 6;
    if (rsiC.tone === "negative" && rsiV > 30) score -= 6;
    if (rsiV >= 70) { score -= 5; reasons.push("overbought"); }
    if (rsiV <= 30) { score += 5; reasons.push("oversold bounce setup"); }

    // MACD
    const macdC = classifyMACD(macdV, sigV, histV, histPrev);
    if (macdC.tone === "positive") { score += 8; reasons.push("MACD bullish"); }
    if (macdC.tone === "negative") { score -= 8; reasons.push("MACD bearish"); }

    // Bollinger
    const bbC = classifyBB(price, bbU, bbM, bbL);
    if (bbC.tone === "negative" && price > bbU) { score -= 4; reasons.push("extended above BB"); }
    if (bbC.tone === "positive" && price < bbL) { score += 4; reasons.push("stretched below BB"); }

    // 52w position
    const rangePos = ((price - data.fiftyTwoWeekLow) / (data.fiftyTwoWeekHigh - data.fiftyTwoWeekLow)) * 100;
    if (rangePos > 80) score += 4;
    else if (rangePos < 20) score -= 4;

    // Volume
    const volRatio = data.avgVolume ? data.volume / data.avgVolume : 1;
    let volatility = "Normal";
    if (volRatio > 2) volatility = `High (${volRatio.toFixed(1)}x avg)`;
    else if (volRatio > 1.5) volatility = `Above avg (${volRatio.toFixed(1)}x)`;
    else if (volRatio < 0.5) volatility = `Low (${volRatio.toFixed(1)}x)`;

    score = Math.max(0, Math.min(100, score));

    // Verdict
    let verdict: string, summary: string;
    if (score >= 75) { verdict = "Bullish momentum"; summary = `Strong setup: ${reasons.slice(0, 3).join(", ")}`; }
    else if (score >= 60) { verdict = "Constructive"; summary = `Positive structure: ${reasons.slice(0, 2).join(", ")}`; }
    else if (score >= 45) { verdict = "Neutral / Wait"; summary = "Mixed signals — wait for confirmation"; }
    else { verdict = "Caution"; summary = `Weak technicals: ${reasons.filter(r => /below|bear|over/.test(r)).slice(0, 2).join(", ") || "price under pressure"}`; }

    // Support / momentum strings
    const distE50 = ((price - e50) / e50) * 100;
    let support = "N/A";
    if (distE50 > 10) support = `Extended +${distE50.toFixed(1)}% from EMA50`;
    else if (distE50 >= 0 && distE50 <= 5) support = `At EMA50 (+${distE50.toFixed(1)}%)`;
    else if (distE50 < 0 && distE50 >= -5) support = `Testing EMA50 (${distE50.toFixed(1)}%)`;
    else if (distE50 < -10) support = `Below EMA50 (${distE50.toFixed(1)}%)`;
    else support = `${distE50 >= 0 ? "+" : ""}${distE50.toFixed(1)}% vs EMA50`;

    const momentum = rangePos > 80 ? "Near 52w highs" : rangePos < 20 ? "Near 52w lows" : rangePos > 60 ? "Strong" : rangePos < 40 ? "Weak" : "Neutral";

    // ------ AI insight ------
    let intelligenceInsight: InsightBullet[] | undefined;
    if (LOVABLE_API_KEY) {
      try {
        const prompt = `You are a senior equity strategist. Generate a ticker-specific "Intelligence Insight" for ${cleanSymbol} (${data.companyName}).

Technicals:
- Verdict: ${verdict} (${score}%)
- Trend: ${trend}
- Price $${price.toFixed(2)} vs EMA20 $${e20.toFixed(2)} / EMA50 $${e50.toFixed(2)} / EMA200 ${isNaN(e200) ? "n/a" : "$" + e200.toFixed(2)}
- RSI(14): ${rsiV.toFixed(0)} (${rsiC.label})
- MACD: ${macdC.label} (hist ${histV.toFixed(2)})
- Bollinger: ${bbC.label}, width ${bbC.width.toFixed(1)}%
- 52w position: ${rangePos.toFixed(0)}%
- Volume: ${volatility}

Return ONLY a JSON array, exactly:
[
  {"category":"Macro Context","text":"..."},
  {"category":"Technical Read","text":"Synthesize EMAs+RSI+MACD+BB into one tactical observation"},
  {"category":"Risks","text":"..."},
  {"category":"Tactical Takeaway","text":"..."}
]
Rules: ≤35 words per bullet, professional, no advice, no markdown.`;

        const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 500,
          }),
        });
        if (r.ok) {
          const j = await r.json();
          let txt = j.choices?.[0]?.message?.content?.trim() || "";
          if (txt.startsWith("```")) txt = txt.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
          intelligenceInsight = JSON.parse(txt);
        }
      } catch (e) {
        console.error("AI insight error:", e);
      }
    }

    // Trim series to last ~250 points (1y daily) and replace NaN with null
    const clean = (arr: number[]) => arr.map(v => (isNaN(v) ? null : Number(v.toFixed(4))));

    const result = {
      symbol: cleanSymbol,
      companyName: data.companyName,
      price,
      marketCap: formatMarketCap(data.marketCap),
      dayChangePercent: data.dayChangePercent,
      verdict,
      confidence: score,
      summary,
      priceAction: { trend, momentum, volatility, support },
      indicators: {
        rsi: { value: Number(rsiV.toFixed(1)), label: rsiC.label, tone: rsiC.tone },
        macd: {
          macd: Number(macdV.toFixed(3)),
          signal: Number(sigV.toFixed(3)),
          hist: Number(histV.toFixed(3)),
          label: macdC.label,
          tone: macdC.tone,
        },
        bollinger: {
          upper: Number(bbU.toFixed(2)),
          mid: Number(bbM.toFixed(2)),
          lower: Number(bbL.toFixed(2)),
          width: Number(bbC.width.toFixed(2)),
          label: bbC.label,
          tone: bbC.tone,
        },
        emas: {
          ema20: isNaN(e20) ? null : Number(e20.toFixed(2)),
          ema50: isNaN(e50) ? null : Number(e50.toFixed(2)),
          ema200: isNaN(e200) ? null : Number(e200.toFixed(2)),
        },
        range52w: {
          high: data.fiftyTwoWeekHigh,
          low: data.fiftyTwoWeekLow,
          position: Number(rangePos.toFixed(1)),
        },
      },
      chart: {
        timestamps: data.candles.map(c => c.t),
        close: closes.map(v => Number(v.toFixed(2))),
        ema20: clean(ema20),
        ema50: clean(ema50),
        ema200: clean(ema200),
        bbUpper: clean(bb.upper),
        bbLower: clean(bb.lower),
        rsi: clean(rsiArr),
        macd: clean(macdRes.macd),
        macdSignal: clean(macdRes.signal),
        macdHist: clean(macdRes.hist),
      },
      intelligenceInsight,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Analysis error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
