// ── Technical analysis primitives ────────────────────────────────────────────
// Just enough to compute a stock "squeeze" setup from daily candles: EMA, RSI,
// ATR, Bollinger + Keltner (→ TTM Squeeze), linear-regression momentum and
// relative volume. Everything returns the LATEST reading (that's all the radar
// needs). Server-side only.

export const sma = (a: number[], p: number): number => {
  if (a.length < p) return NaN;
  let s = 0;
  for (let i = a.length - p; i < a.length; i++) s += a[i];
  return s / p;
};

export function emaLast(a: number[], p: number): number {
  if (a.length === 0) return NaN;
  const k = 2 / (p + 1);
  let e = a[0];
  for (let i = 1; i < a.length; i++) e = a[i] * k + e * (1 - k);
  return e;
}

export function stdevLast(a: number[], p: number): number {
  if (a.length < p) return NaN;
  const m = sma(a, p);
  let s = 0;
  for (let i = a.length - p; i < a.length; i++) s += (a[i] - m) ** 2;
  return Math.sqrt(s / p);
}

export function rsiLast(closes: number[], p = 14): number {
  if (closes.length < p + 1) return NaN;
  let gain = 0, loss = 0;
  for (let i = closes.length - p; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  const avgG = gain / p, avgL = loss / p;
  if (avgL === 0) return 100;
  return 100 - 100 / (1 + avgG / avgL);
}

export function atrLast(high: number[], low: number[], close: number[], p = 20): number {
  if (close.length < p + 1) return NaN;
  const trs: number[] = [];
  for (let i = 1; i < close.length; i++) {
    trs.push(Math.max(high[i] - low[i], Math.abs(high[i] - close[i - 1]), Math.abs(low[i] - close[i - 1])));
  }
  return sma(trs, p);
}

// Linear-regression slope over the last n points, returned as % of price per bar.
export function linSlopePct(closes: number[], n = 20): number {
  if (closes.length < n) return NaN;
  const y = closes.slice(-n);
  const xm = (n - 1) / 2;
  const ym = y.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (i - xm) * (y[i] - ym); den += (i - xm) ** 2; }
  const slope = den ? num / den : 0;
  return (slope / (y[n - 1] || 1)) * 100;
}

export interface StockFactors {
  price: number;
  changePct: number; // recent % (last vs ~5 bars back)
  compression: number; // higher = tighter coil (Keltner width − Bollinger width, %)
  inSqueeze: boolean; // Bollinger bands inside Keltner channels
  momentum: number; // linreg slope, %/bar
  trend: number; // (ema20 − ema50) / price, %
  rvol: number; // volume vs 20d avg
}

// TTM-Squeeze style read. bbMult=2, kcMult=1.5 (classic).
export function stockFactors(
  open: number[], high: number[], low: number[], close: number[], volume: number[],
): StockFactors | null {
  const n = close.length;
  if (n < 30) return null;
  const price = close[n - 1];
  const mid = sma(close, 20);
  const sd = stdevLast(close, 20);
  const atr = atrLast(high, low, close, 20);
  if (!isFinite(mid) || !isFinite(sd) || !isFinite(atr) || !price) return null;

  const bbUpper = mid + 2 * sd, bbLower = mid - 2 * sd;
  const kcUpper = mid + 1.5 * atr, kcLower = mid - 1.5 * atr;
  const inSqueeze = bbUpper < kcUpper && bbLower > kcLower;
  const bbWidth = ((bbUpper - bbLower) / mid) * 100;
  const kcWidth = ((kcUpper - kcLower) / mid) * 100;

  const ema20 = emaLast(close, 20), ema50 = emaLast(close, 50);
  const back = close[n - 6] ?? close[0];

  return {
    price,
    changePct: ((price - back) / back) * 100,
    compression: kcWidth - bbWidth, // >0 when coiled
    inSqueeze,
    momentum: linSlopePct(close, 20),
    trend: ((ema20 - ema50) / price) * 100,
    rvol: sma(volume, 20) ? volume[n - 1] / sma(volume, 20) : 1,
  };
}
