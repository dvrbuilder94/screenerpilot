import type { BloombergInsightData } from '@/components/BloombergInsight';

const fmtPct = (n: number, d = 1) => `${n >= 0 ? '+' : ''}${n.toFixed(d)}%`;

// ─── BTC Dominance ────────────────────────────────────────────────
export function dominanceInsight(d: { dominance: number; change7d: number }): BloombergInsightData {
  const ch = d.change7d;
  if (ch > 1.5) return {
    signal: `BTC.D ${fmtPct(ch)} (7d) → ${d.dominance.toFixed(1)}%`,
    implication: 'Capital rotating into BTC, alts under pressure',
    action: 'Trim alt exposure, hold majors',
    tone: 'caution',
  };
  if (ch < -1.5) return {
    signal: `BTC.D ${fmtPct(ch)} (7d) → ${d.dominance.toFixed(1)}%`,
    implication: 'Liquidity flowing into alts, risk-on rotation',
    action: 'Selectively add high-quality alts',
    tone: 'bullish',
  };
  return {
    signal: `BTC.D ${d.dominance.toFixed(1)}% · ${fmtPct(ch)} (7d)`,
    implication: 'No clear rotation between BTC and alts',
    action: 'Wait for directional break',
    tone: 'neutral',
  };
}

// ─── Altseason Index ─────────────────────────────────────────────
export function altseasonInsight(d: { value?: number; index?: number; altsOutperforming: number; totalAlts: number }): BloombergInsightData {
  const v = d.value ?? d.index ?? 0;
  if (v >= 70) return {
    signal: `Altseason ON (${v}/100)`,
    implication: `${d.altsOutperforming}/${d.totalAlts} alts beating BTC`,
    action: 'Prime window for selective alt longs',
    tone: 'bullish',
  };
  if (v < 30) return {
    signal: `Bitcoin Season (${v}/100)`,
    implication: 'Alts broadly underperforming BTC',
    action: 'Defensive: stick to BTC/ETH',
    tone: 'bearish',
  };
  return {
    signal: `Mixed regime (${v}/100)`,
    implication: 'Partial alt strength, no broad rotation yet',
    action: 'Cherry-pick leaders, avoid laggards',
    tone: 'neutral',
  };
}

// ─── ETH vs BTC ──────────────────────────────────────────────────
export function ethVsBtcInsight(d: {
  winner: 'ETH' | 'BTC' | 'NEUTRAL';
  eth: { riskReward: number; returns: number };
  btc: { riskReward: number; returns: number };
}): BloombergInsightData {
  if (d.winner === 'ETH') return {
    signal: `ETH leads R/R ${d.eth.riskReward.toFixed(2)} vs ${d.btc.riskReward.toFixed(2)}`,
    implication: `90d ETH ${fmtPct(d.eth.returns)} > BTC ${fmtPct(d.btc.returns)}`,
    action: 'Favor ETH for risk-adjusted exposure',
    tone: 'bullish',
  };
  if (d.winner === 'BTC') return {
    signal: `BTC leads R/R ${d.btc.riskReward.toFixed(2)} vs ${d.eth.riskReward.toFixed(2)}`,
    implication: `90d BTC ${fmtPct(d.btc.returns)} > ETH ${fmtPct(d.eth.returns)}`,
    action: 'Anchor portfolio in BTC',
    tone: 'bullish',
  };
  return {
    signal: `ETH ≈ BTC (R/R parity)`,
    implication: 'No statistical edge over 90d window',
    action: 'Split allocation 50/50',
    tone: 'neutral',
  };
}

// ─── ETH Upside Probability ──────────────────────────────────────
export function ethUpsideInsight(d: { score: number; emaTrend: string; volatilityState: string }): BloombergInsightData {
  if (d.score >= 70) return {
    signal: `ETH/BTC upside ${d.score}/100`,
    implication: `${d.emaTrend} trend, ${d.volatilityState} vol`,
    action: 'Build ETH overweight vs BTC',
    tone: 'bullish',
  };
  if (d.score < 35) return {
    signal: `ETH/BTC upside weak ${d.score}/100`,
    implication: `${d.emaTrend} trend, ${d.volatilityState} vol`,
    action: 'Stay underweight ETH vs BTC',
    tone: 'bearish',
  };
  return {
    signal: `ETH/BTC neutral ${d.score}/100`,
    implication: 'Mixed structure, no clear edge',
    action: 'Wait for trend confirmation',
    tone: 'neutral',
  };
}

// ─── Fear & Greed ────────────────────────────────────────────────
export function fearGreedInsight(d: { value: number; category: string }): BloombergInsightData {
  if (d.value <= 25) return {
    signal: `${d.category} (${d.value}/100)`,
    implication: 'Capitulation zone, contrarian setup forming',
    action: 'Scale into majors gradually',
    tone: 'bullish',
  };
  if (d.value >= 75) return {
    signal: `${d.category} (${d.value}/100)`,
    implication: 'Euphoria zone, late-cycle risk',
    action: 'Tighten stops, take partial profits',
    tone: 'caution',
  };
  return {
    signal: `${d.category} (${d.value}/100)`,
    implication: 'Sentiment balanced, no extreme positioning',
    action: 'Trade the technicals, not the mood',
    tone: 'neutral',
  };
}

// ─── Crypto Risk Regime ──────────────────────────────────────────
export function riskRegimeInsight(d: { state: 'risk_on' | 'risk_off' | 'neutral'; altsAvgReturn7d: number }): BloombergInsightData {
  if (d.state === 'risk_on') return {
    signal: `RISK-ON · alts ${fmtPct(d.altsAvgReturn7d)} (7d)`,
    implication: 'Aggressive bid across higher-beta assets',
    action: 'Increase exposure to high-beta names',
    tone: 'bullish',
  };
  if (d.state === 'risk_off') return {
    signal: `RISK-OFF · alts ${fmtPct(d.altsAvgReturn7d)} (7d)`,
    implication: 'Defensive flows, beta compressing',
    action: 'Reduce leverage, raise cash',
    tone: 'bearish',
  };
  return {
    signal: `NEUTRAL regime · alts ${fmtPct(d.altsAvgReturn7d)} (7d)`,
    implication: 'No conviction in either direction',
    action: 'Keep position sizes small',
    tone: 'neutral',
  };
}

// ─── BMNR vs ETH ─────────────────────────────────────────────────
export function bmnrVsEthInsight(d: {
  winner: 'BMNR' | 'ETH' | 'NEUTRAL';
  bmnr: { riskReward: number; returns: number; maxDrawdown: number };
  eth: { riskReward: number; returns: number; maxDrawdown: number };
}): BloombergInsightData {
  if (d.winner === 'BMNR') return {
    signal: `BMNR R/R ${d.bmnr.riskReward.toFixed(2)} > ETH ${d.eth.riskReward.toFixed(2)}`,
    implication: `90d BMNR ${fmtPct(d.bmnr.returns)} vs ETH ${fmtPct(d.eth.returns)}`,
    action: 'Use BMNR as ETH-beta proxy, size for vol',
    tone: 'bullish',
  };
  if (d.winner === 'ETH') return {
    signal: `ETH R/R ${d.eth.riskReward.toFixed(2)} > BMNR ${d.bmnr.riskReward.toFixed(2)}`,
    implication: `Better risk-adjusted than the proxy`,
    action: 'Prefer ETH spot over BMNR',
    tone: 'bullish',
  };
  return {
    signal: `BMNR ≈ ETH (R/R parity)`,
    implication: 'Proxy tracking ETH closely, no edge',
    action: 'Use whichever has better liquidity/cost',
    tone: 'neutral',
  };
}

// ─── FED Macro ───────────────────────────────────────────────────
export function fedMacroInsight(d: {
  dxy?: number;
  yield10y?: number;
  yield5y?: number;
  yield30y?: number;
}): BloombergInsightData | null {
  const { dxy, yield10y, yield5y } = d;
  if (!dxy && !yield10y) return null;
  const spread = (yield10y ?? 0) - (yield5y ?? 0);
  const inverted = yield10y && yield5y && spread < 0;
  const strongDxy = dxy && dxy > 105;

  if (inverted) return {
    signal: `Curve inverted ${(spread * 100).toFixed(0)}bps · DXY ${dxy?.toFixed(1) ?? 'n/a'}`,
    implication: 'Recession signal active, defensive bias historically rewarded',
    action: 'Reduce duration risk, favor quality over beta',
    tone: 'bearish',
  };
  if (strongDxy) return {
    signal: `DXY ${dxy?.toFixed(1)} · 10Y ${yield10y?.toFixed(2)}%`,
    implication: 'Dollar strength pressures non-USD assets and EM',
    action: 'Hedge FX exposure, watch commodity weakness',
    tone: 'caution',
  };
  return {
    signal: `10Y ${yield10y?.toFixed(2) ?? 'n/a'}% · DXY ${dxy?.toFixed(1) ?? 'n/a'}`,
    implication: 'Curve healthy, no immediate macro stress flag',
    action: 'Macro tailwinds neutral, focus on micro setups',
    tone: 'neutral',
  };
}

// ─── Stocks Macro (VIX + sector rotation) ────────────────────────
export function stocksMacroInsight(d: {
  vix?: number;
  sp500?: number;
  rotationDiff?: number; // cyclical avg - defensive avg (%)
}): BloombergInsightData | null {
  const { vix, rotationDiff } = d;
  if (vix == null && rotationDiff == null) return null;
  const v = vix ?? 0;
  const r = rotationDiff ?? 0;

  if (v >= 25) return {
    signal: `VIX ${v.toFixed(1)} · rotation ${r >= 0 ? '+' : ''}${r.toFixed(2)}%`,
    implication: 'Stress regime, dispersion rising across sectors',
    action: 'Cut size, raise hedges, avoid new beta longs',
    tone: 'bearish',
  };
  if (v < 15 && r > 0.3) return {
    signal: `VIX ${v.toFixed(1)} · cyclicals leading +${r.toFixed(2)}%`,
    implication: 'Complacency + risk-on rotation, late-cycle setup',
    action: 'Stay long but tighten stops on extended winners',
    tone: 'caution',
  };
  if (r > 0.5) return {
    signal: `Cyclicals leading +${r.toFixed(2)}% vs defensives`,
    implication: 'Risk-on rotation underway, growth/financials bid',
    action: 'Lean into XLK, XLF, XLY exposure',
    tone: 'bullish',
  };
  if (r < -0.5) return {
    signal: `Defensives leading ${r.toFixed(2)}% vs cyclicals`,
    implication: 'Risk-off rotation, capital seeking shelter',
    action: 'Rotate into XLP, XLU, XLV; trim cyclicals',
    tone: 'bearish',
  };
  return {
    signal: `VIX ${v.toFixed(1)} · neutral rotation ${r >= 0 ? '+' : ''}${r.toFixed(2)}%`,
    implication: 'No clear sector leadership, choppy regime',
    action: 'Trade ranges, avoid trend-following bias',
    tone: 'neutral',
  };
}

// ─── Sector Heatmap ──────────────────────────────────────────────
export function sectorHeatmapInsight(sectors: { symbol: string; name: string; change: number }[]): BloombergInsightData | null {
  if (!sectors || sectors.length === 0) return null;
  const sorted = [...sectors].sort((a, b) => b.change - a.change);
  const top = sorted[0];
  const bot = sorted[sorted.length - 1];
  const breadth = sectors.filter(s => s.change > 0).length;
  const total = sectors.length;
  const breadthPct = (breadth / total) * 100;

  if (breadthPct >= 75) return {
    signal: `Breadth ${breadth}/${total} green · ${top.symbol} +${top.change.toFixed(2)}%`,
    implication: 'Broad-based bid, healthy market internals',
    action: 'Trend-friendly tape, hold winners',
    tone: 'bullish',
  };
  if (breadthPct <= 25) return {
    signal: `Breadth ${breadth}/${total} green · ${bot.symbol} ${bot.change.toFixed(2)}%`,
    implication: 'Narrow tape, distribution under the surface',
    action: 'Trim weak sectors, wait for breadth to flip',
    tone: 'bearish',
  };
  return {
    signal: `Mixed breadth ${breadth}/${total} · ${top.symbol} +${top.change.toFixed(2)}% leads`,
    implication: 'Sector dispersion, rotation game over directional',
    action: `Pair-trade: long ${top.symbol}, short ${bot.symbol}`,
    tone: 'neutral',
  };
}

// ─── Commodities Macro ───────────────────────────────────────────
export function commoditiesMacroInsight(ratios: { name: string; value: number; trend: 'bullish' | 'bearish' | 'neutral' }[]): BloombergInsightData | null {
  if (!ratios || ratios.length === 0) return null;
  const cg = ratios.find(r => r.name === 'Copper/Gold');
  const gs = ratios.find(r => r.name === 'Gold/Silver');

  if (cg && cg.trend === 'bullish') return {
    signal: `Cu/Au ${cg.value.toFixed(5)} · risk-on`,
    implication: 'Industrial demand strong, growth expectations rising',
    action: 'Favor cyclicals, EM equities, base metals',
    tone: 'bullish',
  };
  if (cg && cg.trend === 'bearish') return {
    signal: `Cu/Au ${cg.value.toFixed(5)} · risk-off`,
    implication: 'Defensive bid for gold, growth fears building',
    action: 'Defensive sectors, gold miners, long duration',
    tone: 'bearish',
  };
  if (gs && gs.trend === 'bearish') return {
    signal: `Au/Ag ${gs.value.toFixed(1)} · silver lagging`,
    implication: 'Risk aversion, silver discount widening',
    action: 'Watch for silver mean-reversion setup',
    tone: 'caution',
  };
  return {
    signal: 'Commodity ratios in normal range',
    implication: 'No extreme regime signal from metals',
    action: 'Use spot trends, ratios offer no edge now',
    tone: 'neutral',
  };
}

// ─── Crypto Macro Panel (microstructure) ─────────────────────────
export function cryptoMacroInsight(d: {
  totalMcapChange?: number;
  btcDom?: number;
  fearGreed?: number;
  fundingRate?: number; // %
}): BloombergInsightData | null {
  const { fundingRate, fearGreed, totalMcapChange, btcDom } = d;
  if (fundingRate == null && fearGreed == null && totalMcapChange == null) return null;

  if (fundingRate != null && fundingRate > 0.05) return {
    signal: `Funding +${fundingRate.toFixed(3)}% · longs crowded`,
    implication: 'Perp longs overpaying, squeeze risk to downside',
    action: 'Avoid chasing, watch for funding reset',
    tone: 'caution',
  };
  if (fundingRate != null && fundingRate < -0.02) return {
    signal: `Funding ${fundingRate.toFixed(3)}% · shorts crowded`,
    implication: 'Negative funding setup, short squeeze fuel',
    action: 'Bias for upside surprise on positive catalyst',
    tone: 'bullish',
  };
  if (fearGreed != null && fearGreed >= 75) return {
    signal: `F&G ${fearGreed} · greed extreme`,
    implication: 'Sentiment euphoric, contrarian risk rising',
    action: 'Tighten stops, take partial profits',
    tone: 'caution',
  };
  if (fearGreed != null && fearGreed <= 25) return {
    signal: `F&G ${fearGreed} · fear extreme`,
    implication: 'Capitulation, contrarian setup forming',
    action: 'Scale into majors gradually',
    tone: 'bullish',
  };
  if (totalMcapChange != null) {
    const tone: InsightTone = totalMcapChange > 1 ? 'bullish' : totalMcapChange < -1 ? 'bearish' : 'neutral';
    return {
      signal: `Total mcap ${fmtPct(totalMcapChange)} 24h · BTC.D ${btcDom?.toFixed(1) ?? 'n/a'}%`,
      implication: tone === 'bullish' ? 'Capital inflow, broad bid' : tone === 'bearish' ? 'Outflow, derisking' : 'Stable flows, no conviction',
      action: tone === 'neutral' ? 'Wait for directional break' : 'Follow the flow, manage size',
      tone,
    };
  }
  return null;
}

// ─── LATAM FX (per country) ──────────────────────────────────────
export function latamFxInsight(d: {
  country: string;
  pair: string;
  price?: number;
  change1d?: number;
}): BloombergInsightData | null {
  const { pair, change1d, price } = d;
  if (change1d == null || price == null) return null;
  if (change1d > 1) return {
    signal: `${pair} ${fmtPct(change1d)} (1d) at ${price.toFixed(2)}`,
    implication: 'Local currency depreciating fast, capital outflow signal',
    action: 'Watch local rates, reduce LCY duration',
    tone: 'bearish',
  };
  if (change1d < -1) return {
    signal: `${pair} ${fmtPct(change1d)} (1d) at ${price.toFixed(2)}`,
    implication: 'Local currency appreciating, risk-on for LATAM assets',
    action: 'Constructive on local equities and rates',
    tone: 'bullish',
  };
  return {
    signal: `${pair} ${fmtPct(change1d)} (1d) at ${price.toFixed(2)}`,
    implication: 'FX stable, no immediate macro stress',
    action: 'Trade local fundamentals, FX neutral',
    tone: 'neutral',
  };
}

// ─── Ratios category ─────────────────────────────────────────────
export function ratiosCategoryInsight(rows: {
  display_name: string;
  z_score?: number | null;
  percentile_5y?: number | null;
  change_pct_1m?: number | null;
}[], category: string): BloombergInsightData | null {
  if (!rows || rows.length === 0) return null;

  // Sort by abs z-score
  const sorted = [...rows].sort((a, b) => Math.abs(b.z_score ?? 0) - Math.abs(a.z_score ?? 0));
  const extreme = sorted[0];
  const z = extreme.z_score ?? 0;
  const pct = extreme.percentile_5y ?? 50;
  const ch1m = extreme.change_pct_1m ?? 0;

  // Divergence detection: extreme z with opposite 1m move
  const divergent = Math.abs(z) > 1.5 && Math.sign(z) !== Math.sign(ch1m) && Math.abs(ch1m) > 1;

  if (divergent) return {
    signal: `${extreme.display_name} z ${z.toFixed(2)} · 1M ${fmtPct(ch1m)} (divergent)`,
    implication: 'Statistical extreme reversing, trend exhaustion likely',
    action: 'Watch for mean-reversion entry on this ratio',
    tone: 'caution',
  };
  if (z > 2) return {
    signal: `${extreme.display_name} z ${z.toFixed(2)} · ${pct.toFixed(0)}th pctile`,
    implication: 'Extreme overshoot vs 5y baseline, statistically stretched',
    action: 'Fade extreme or hedge correlated exposure',
    tone: 'caution',
  };
  if (z < -2) return {
    signal: `${extreme.display_name} z ${z.toFixed(2)} · ${pct.toFixed(0)}th pctile`,
    implication: 'Extreme undershoot vs 5y baseline, dislocation building',
    action: 'Look for mean-reversion long setup',
    tone: 'bullish',
  };
  return {
    signal: `${category} most stretched: ${extreme.display_name} z ${z.toFixed(2)}`,
    implication: 'No extreme dislocations, ratios within normal range',
    action: 'Wait for z > |2| for actionable signals',
    tone: 'neutral',
  };
}

// ─── Stock Intelligence (analyze result) ─────────────────────────
export function stockAnalysisInsight(d: {
  symbol: string;
  verdict: string;
  confidence: number;
  rsi?: number;
  pos52w?: number;
  trend?: string;
}): BloombergInsightData | null {
  const { symbol, verdict, confidence, rsi, pos52w } = d;
  const verdictLower = verdict.toLowerCase();
  const isBull = verdictLower.includes('bullish') || verdictLower.includes('improving') || verdictLower.includes('constructive');
  const isBear = verdictLower.includes('deteriorating') || verdictLower.includes('bearish');
  const overbought = rsi != null && rsi > 70;
  const oversold = rsi != null && rsi < 30;
  const near52wHigh = pos52w != null && pos52w > 90;
  const near52wLow = pos52w != null && pos52w < 10;

  if (isBull && overbought) return {
    signal: `${symbol} ${verdict} · RSI ${rsi?.toFixed(0)} · ${confidence}% conf`,
    implication: 'Bullish structure but momentum stretched short-term',
    action: 'Pullback entry preferred over chasing',
    tone: 'caution',
  };
  if (isBull && near52wHigh) return {
    signal: `${symbol} ${verdict} · ${pos52w?.toFixed(0)}% of 52w range`,
    implication: 'Breakout territory, leadership candidate',
    action: 'Trail stops below recent swing low',
    tone: 'bullish',
  };
  if (isBull) return {
    signal: `${symbol} ${verdict} · ${confidence}% conf`,
    implication: 'Constructive setup with confirming indicators',
    action: 'Build position on confirmations, manage size',
    tone: 'bullish',
  };
  if (isBear && oversold) return {
    signal: `${symbol} ${verdict} · RSI ${rsi?.toFixed(0)} oversold`,
    implication: 'Bearish trend but bounce risk near-term',
    action: 'Avoid fresh shorts here, wait for bounce to fade',
    tone: 'caution',
  };
  if (isBear || near52wLow) return {
    signal: `${symbol} ${verdict} · ${confidence}% conf`,
    implication: 'Distribution structure, momentum to downside',
    action: 'Avoid longs, respect downtrend',
    tone: 'bearish',
  };
  return {
    signal: `${symbol} ${verdict} · ${confidence}% conf`,
    implication: 'Mixed signals, no clear directional edge',
    action: 'Stand aside until structure clarifies',
    tone: 'neutral',
  };
}

// ─── Short Squeeze Radar (top candidates) ────────────────────────
export function squeezeRadarInsight(rows: { symbol: string; score: number }[]): BloombergInsightData | null {
  if (!rows || rows.length === 0) return null;
  const sorted = [...rows].sort((a, b) => b.score - a.score);
  const top = sorted[0];
  const hot = sorted.filter(r => r.score >= 70).length;

  if (top.score >= 80) return {
    signal: `${top.symbol} score ${top.score} · ${hot} candidates >70`,
    implication: 'High-conviction squeeze setup, conditions aligned',
    action: 'Watch for volume confirmation on breakout',
    tone: 'bullish',
  };
  if (hot >= 3) return {
    signal: `${hot} squeeze candidates >70 · top ${top.symbol} (${top.score})`,
    implication: 'Broad squeeze regime, multiple setups firing',
    action: 'Diversify across top names, size for vol',
    tone: 'bullish',
  };
  return {
    signal: `Top ${top.symbol} score ${top.score}`,
    implication: 'No high-conviction squeeze setups currently',
    action: 'Wait for scores to compress >70',
    tone: 'neutral',
  };
}
