// Short Squeeze Radar — scans curated US small/mid cap universe and ranks
// candidates by a 0-100 Squeeze Score using free technical heuristics.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

// Curated universe: ~150 small/mid cap US tickers historically prone to
// volatility / squeeze setups (meme, biotech small, fintech, retail, EV, etc.).
const UNIVERSE = [
  // Meme / retail favorites
  "GME","AMC","BBBY","BB","KOSS","EXPR","NOK","CLOV","WISH","SDC","MULN","HKD","PROG","ATER","SPRT","IRNT","DWAC","PHUN","BBIG","MRIN",
  // Fintech / consumer
  "SOFI","UPST","AFRM","HOOD","LMND","OPEN","RKT","PYPL","SQ","PATH","COIN","MARA","RIOT","CIFR","HUT","BITF","WULF","CLSK","BTBT","HIVE",
  // EV / clean energy small-mid
  "RIVN","LCID","NKLA","FSR","CHPT","BLNK","WBX","EVGO","QS","SLDP","MVST","GOEV","RIDE","WKHS","HYZN","FCEL","PLUG","BE","STEM","RUN",
  // Biotech / pharma small
  "SAVA","BIIB","NVAX","OCGN","INO","SRNE","CTRM","ENZC","ATOS","XELA","TLRY","CGC","ACB","SNDL","HEXO","CRON","GNUS","CIDM","NEGG","ANY",
  // Tech growth small/mid
  "PLTR","FUBO","DKNG","BMBL","RBLX","U","NET","FSLY","DOCN","APP","DDOG","SNOW","ZS","CRWD","MDB","TWLO","PINS","SNAP","LYFT","UBER",
  // Retail / consumer cyclical
  "BYND","CHWY","ETSY","W","RVLV","FIGS","ALLY","CVNA","VRM","SHOP","REAL","POSH","DOLE","FIZZ","PRTY","CHGG","STMP","BIG","JWN","KSS",
  // Others volatile
  "SPCE","RKLB","ASTR","ASTS","JOBY","ACHR","ARVL","FFIE","NIO","XPEV","LI","TIGR","FUTU","BABA","JD","BILI","DIDI","IQ","VIPS","TME"
];

interface YahooBar { t: number; o: number; h: number; l: number; c: number; v: number; }

async function fetchYahoo(symbol: string): Promise<{ bars: YahooBar[]; meta: any } | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=6mo&interval=1d&includePrePost=false`;
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!r.ok) return null;
    const j = await r.json();
    const result = j?.chart?.result?.[0];
    if (!result) return null;
    const ts: number[] = result.timestamp || [];
    const q = result.indicators?.quote?.[0];
    if (!q || ts.length < 60) return null;
    const bars: YahooBar[] = [];
    for (let i = 0; i < ts.length; i++) {
      const o = q.open?.[i], h = q.high?.[i], l = q.low?.[i], c = q.close?.[i], v = q.volume?.[i];
      if (o == null || h == null || l == null || c == null || v == null) continue;
      bars.push({ t: ts[i], o, h, l, c, v });
    }
    return { bars, meta: result.meta };
  } catch { return null; }
}

function sma(arr: number[], p: number): number | null {
  if (arr.length < p) return null;
  let s = 0;
  for (let i = arr.length - p; i < arr.length; i++) s += arr[i];
  return s / p;
}

function stddev(arr: number[], p: number, mean: number): number {
  let s = 0;
  for (let i = arr.length - p; i < arr.length; i++) s += (arr[i] - mean) ** 2;
  return Math.sqrt(s / p);
}

function rsi(closes: number[], p = 14): number | null {
  if (closes.length < p + 1) return null;
  let gains = 0, losses = 0;
  for (let i = closes.length - p; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) gains += d; else losses -= d;
  }
  const avgG = gains / p, avgL = losses / p;
  if (avgL === 0) return 100;
  const rs = avgG / avgL;
  return 100 - 100 / (1 + rs);
}

function clamp(x: number, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, x)); }

interface Candidate {
  symbol: string;
  companyName: string;
  price: number;
  marketCap: number | null;
  marketCapLabel: string;
  squeezeScore: number;
  volumeRatio: number;     // today vs avg20
  drawdownFrom52w: number; // negative %
  change5d: number;        // %
  rsi: number;
  bbWidth: number;         // % of mid
  components: {
    volume: number;
    compression: number;
    rsiRecovery: number;
    drawdown: number;
    sizeBias: number;
    momentum: number;
  };
}

function fmtMcap(mc: number | null): string {
  if (!mc) return "N/A";
  if (mc >= 1e9) return `$${(mc / 1e9).toFixed(2)}B`;
  if (mc >= 1e6) return `$${(mc / 1e6).toFixed(0)}M`;
  return `$${mc.toFixed(0)}`;
}

function score(bars: YahooBar[], meta: any): Candidate | null {
  if (bars.length < 60) return null;
  const closes = bars.map(b => b.c);
  const vols = bars.map(b => b.v);
  const highs = bars.map(b => b.h);
  const lows = bars.map(b => b.l);

  const last = bars[bars.length - 1];
  const price = last.c;
  if (price < 1 || price > 1000) return null; // skip penny / mega

  // Volume ratio: today vs avg(20)
  const v20 = sma(vols.slice(-21, -1), 20) || 0;
  const volRatio = v20 > 0 ? last.v / v20 : 1;

  // 52w-ish drawdown (we have 6mo; use max of window as proxy)
  const winHigh = Math.max(...highs.slice(-126));
  const winLow = Math.min(...lows.slice(-126));
  const drawdown = ((price - winHigh) / winHigh) * 100; // negative
  const positionInRange = ((price - winLow) / (winHigh - winLow)) * 100;

  // 5-day momentum
  const ref5 = bars[bars.length - 6]?.c ?? bars[0].c;
  const change5d = ((price - ref5) / ref5) * 100;

  // RSI(14) and recovery (RSI 5d ago)
  const r = rsi(closes) ?? 50;
  const rPrev = rsi(closes.slice(0, -5)) ?? 50;
  const rsiRecoveryDelta = r - rPrev; // positive = improving

  // Bollinger width (20, 2σ) as compression proxy
  const mid20 = sma(closes, 20) || price;
  const sd = stddev(closes, 20, mid20);
  const upper = mid20 + 2 * sd;
  const lower = mid20 - 2 * sd;
  const bbWidth = ((upper - lower) / mid20) * 100;
  // Compare to avg width over last 60 bars
  const widths: number[] = [];
  for (let i = closes.length - 60; i < closes.length; i++) {
    if (i < 20) continue;
    const slice = closes.slice(i - 20, i);
    const m = slice.reduce((a, b) => a + b, 0) / 20;
    let s = 0; for (const x of slice) s += (x - m) ** 2;
    const std = Math.sqrt(s / 20);
    widths.push(((m + 2 * std) - (m - 2 * std)) / m * 100);
  }
  const avgWidth = widths.length ? widths.reduce((a, b) => a + b, 0) / widths.length : bbWidth;
  const compressionRatio = avgWidth > 0 ? bbWidth / avgWidth : 1; // <1 = compressed

  // ===== Component scores 0-100 =====
  // Volume spike (25%)
  // 1x = 20, 2x = 60, 3x+ = 100
  const cVolume = clamp(20 + (volRatio - 1) * 40);

  // Compression breakout (20%)
  // bbWidth small relative to avg (compression) AND price near upper band
  const distToUpper = upper > 0 ? ((upper - price) / price) * 100 : 100;
  const compressionPart = clamp((1 - compressionRatio) * 100); // more compressed = higher
  const breakoutPart = clamp(100 - distToUpper * 10); // closer to upper = higher
  const cCompression = clamp(0.5 * compressionPart + 0.5 * breakoutPart);

  // RSI recovery (15%): coming from <40 toward >55
  let cRsi = 0;
  if (rPrev < 45 && r > rPrev) {
    cRsi = clamp((r - 35) * 2 + (r - rPrev) * 3);
  } else if (r >= 50 && r <= 70 && rsiRecoveryDelta > 0) {
    cRsi = clamp(40 + rsiRecoveryDelta * 4);
  } else {
    cRsi = clamp(20 + rsiRecoveryDelta * 2);
  }

  // Drawdown sweet spot (15%): -30% to -70% from highs = max points
  const dd = Math.abs(drawdown);
  let cDrawdown: number;
  if (dd >= 30 && dd <= 70) cDrawdown = 100 - Math.abs(50 - dd) * 2;
  else if (dd < 30) cDrawdown = clamp(dd * 2);
  else cDrawdown = clamp(100 - (dd - 70) * 2);

  // Size bias (15%): small/mid cap preferred
  const mcap = meta?.marketCap ?? null;
  let cSize: number;
  if (!mcap) cSize = 50;
  else if (mcap < 500e6) cSize = 100;
  else if (mcap < 2e9) cSize = 85;
  else if (mcap < 5e9) cSize = 65;
  else if (mcap < 20e9) cSize = 40;
  else cSize = 20;

  // Momentum 5d (10%)
  const cMomentum = clamp(50 + change5d * 3);

  const squeeze =
    cVolume * 0.25 +
    cCompression * 0.20 +
    cRsi * 0.15 +
    cDrawdown * 0.15 +
    cSize * 0.15 +
    cMomentum * 0.10;

  return {
    symbol: meta?.symbol || "",
    companyName: meta?.shortName || meta?.longName || meta?.symbol || "",
    price,
    marketCap: mcap,
    marketCapLabel: fmtMcap(mcap),
    squeezeScore: Math.round(squeeze),
    volumeRatio: Math.round(volRatio * 100) / 100,
    drawdownFrom52w: Math.round(drawdown * 10) / 10,
    change5d: Math.round(change5d * 10) / 10,
    rsi: Math.round(r),
    bbWidth: Math.round(bbWidth * 10) / 10,
    components: {
      volume: Math.round(cVolume),
      compression: Math.round(cCompression),
      rsiRecovery: Math.round(cRsi),
      drawdown: Math.round(cDrawdown),
      sizeBias: Math.round(cSize),
      momentum: Math.round(cMomentum),
    },
  };
}

async function processBatch(symbols: string[]): Promise<Candidate[]> {
  const results = await Promise.all(symbols.map(async (s) => {
    const data = await fetchYahoo(s);
    if (!data) return null;
    const c = score(data.bars, { ...data.meta, symbol: s });
    return c;
  }));
  return results.filter((x): x is Candidate => x !== null);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const all: Candidate[] = [];
    const BATCH = 20;
    for (let i = 0; i < UNIVERSE.length; i += BATCH) {
      const chunk = UNIVERSE.slice(i, i + BATCH);
      const part = await processBatch(chunk);
      all.push(...part);
    }
    all.sort((a, b) => b.squeezeScore - a.squeezeScore);
    const top = all.slice(0, 30);

    return new Response(
      JSON.stringify({
        scannedAt: new Date().toISOString(),
        scanned: UNIVERSE.length,
        valid: all.length,
        candidates: top,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    console.error("squeeze-radar error", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Scan failed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
