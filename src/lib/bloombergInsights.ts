import type { BloombergInsightData, InsightTone } from '@/components/BloombergInsight';

const fmtPct = (n: number, d = 1) => `${n >= 0 ? '+' : ''}${n.toFixed(d)}%`;

// ─── BTC Dominance ────────────────────────────────────────────────
export function dominanceInsight(d: { dominance: number; change7d: number }): BloombergInsightData {
  const ch = d.change7d;
  if (ch > 1.5) return {
    signal: `BTC.D ${fmtPct(ch)} (7d) → ${d.dominance.toFixed(1)}%`,
    implication: 'BTC absorbing flows · alt beta compressing (RISK-OFF tilt)',
    action: 'Reading: capital concentrating in BTC vs alts',
    tone: 'caution',
  };
  if (ch < -1.5) return {
    signal: `BTC.D ${fmtPct(ch)} (7d) → ${d.dominance.toFixed(1)}%`,
    implication: 'Liquidity rotating down the curve into alts (RISK-ON)',
    action: 'Reading: rotation from BTC into alt segment',
    tone: 'bullish',
  };
  return {
    signal: `BTC.D ${d.dominance.toFixed(1)}% · ${fmtPct(ch)} (7d)`,
    implication: 'No clear rotation between BTC and alts',
    action: 'Reading: no directional rotation detected',
    tone: 'neutral',
  };
}

// ─── Altseason Index ─────────────────────────────────────────────
export function altseasonInsight(d: { value?: number; index?: number; altsOutperforming: number; totalAlts: number }): BloombergInsightData {
  const v = d.value ?? d.index ?? 0;
  if (v >= 70) return {
    signal: `Altseason ON (${v}/100)`,
    implication: `${d.altsOutperforming}/${d.totalAlts} alts beating BTC`,
    action: 'Reading: broad alt outperformance regime',
    tone: 'bullish',
  };
  if (v < 30) return {
    signal: `Bitcoin Season (${v}/100)`,
    implication: 'Alts broadly underperforming BTC',
    action: 'Reading: BTC-dominant regime, narrow leadership',
    tone: 'bearish',
  };
  return {
    signal: `Mixed regime (${v}/100)`,
    implication: 'Partial alt strength, no broad rotation yet',
    action: 'Reading: dispersion across alts, no broad theme',
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
    action: 'Reading: ETH leading on risk-adjusted basis',
    tone: 'bullish',
  };
  if (d.winner === 'BTC') return {
    signal: `BTC leads R/R ${d.btc.riskReward.toFixed(2)} vs ${d.eth.riskReward.toFixed(2)}`,
    implication: `90d BTC ${fmtPct(d.btc.returns)} > ETH ${fmtPct(d.eth.returns)}`,
    action: 'Reading: BTC leading on risk-adjusted basis',
    tone: 'bullish',
  };
  return {
    signal: `ETH ≈ BTC (R/R parity)`,
    implication: 'No statistical edge over 90d window',
    action: 'Reading: ETH and BTC trading in parity',
    tone: 'neutral',
  };
}

// ─── ETH Upside Probability ──────────────────────────────────────
export function ethUpsideInsight(d: { score: number; emaTrend: string; volatilityState: string }): BloombergInsightData {
  if (d.score >= 70) return {
    signal: `ETH/BTC upside ${d.score}/100`,
    implication: `${d.emaTrend} trend, ${d.volatilityState} vol`,
    action: 'Reading: structure favors ETH vs BTC',
    tone: 'bullish',
  };
  if (d.score < 35) return {
    signal: `ETH/BTC upside weak ${d.score}/100`,
    implication: `${d.emaTrend} trend, ${d.volatilityState} vol`,
    action: 'Reading: structure favors BTC vs ETH',
    tone: 'bearish',
  };
  return {
    signal: `ETH/BTC neutral ${d.score}/100`,
    implication: 'Mixed structure, no clear edge',
    action: 'Reading: ETH/BTC structure inconclusive',
    tone: 'neutral',
  };
}

// ─── Fear & Greed ────────────────────────────────────────────────
export function fearGreedInsight(d: { value: number; category: string }): BloombergInsightData {
  if (d.value <= 25) return {
    signal: `${d.category} (${d.value}/100)`,
    implication: 'Capitulation zone · sentiment extreme',
    action: 'Reading: sentiment at fear extreme',
    tone: 'bullish',
  };
  if (d.value >= 75) return {
    signal: `${d.category} (${d.value}/100)`,
    implication: 'Euphoria · late-cycle distribution risk',
    action: 'Reading: sentiment at greed extreme',
    tone: 'caution',
  };
  return {
    signal: `${d.category} (${d.value}/100)`,
    implication: 'Sentiment balanced, no extreme positioning',
    action: 'Reading: sentiment in neutral band',
    tone: 'neutral',
  };
}

// ─── Crypto Risk Regime ──────────────────────────────────────────
export function riskRegimeInsight(d: { state: 'risk_on' | 'risk_off' | 'neutral'; altsAvgReturn7d: number }): BloombergInsightData {
  if (d.state === 'risk_on') return {
    signal: `RISK-ON · alts ${fmtPct(d.altsAvgReturn7d)} (7d)`,
    implication: 'Broad bid across higher-beta names · beta expanding',
    action: 'Reading: risk-on regime, beta expanding',
    tone: 'bullish',
  };
  if (d.state === 'risk_off') return {
    signal: `RISK-OFF · alts ${fmtPct(d.altsAvgReturn7d)} (7d)`,
    implication: 'Risk reduction across the curve · beta compressing',
    action: 'Reading: risk-off regime, beta compressing',
    tone: 'bearish',
  };
  return {
    signal: `BALANCED regime · alts ${fmtPct(d.altsAvgReturn7d)} (7d)`,
    implication: 'No regime conviction · directional edge absent',
    action: 'Reading: regime indeterminate',
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
    action: 'Reading: BMNR outperforming ETH on R/R',
    tone: 'bullish',
  };
  if (d.winner === 'ETH') return {
    signal: `ETH R/R ${d.eth.riskReward.toFixed(2)} > BMNR ${d.bmnr.riskReward.toFixed(2)}`,
    implication: `Better risk-adjusted than the proxy`,
    action: 'Reading: ETH outperforming the proxy on R/R',
    tone: 'bullish',
  };
  return {
    signal: `BMNR ≈ ETH (R/R parity)`,
    implication: 'Proxy tracking ETH closely, no edge',
    action: 'Reading: proxy and underlying in parity',
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
    implication: 'Curve inversion active · historical recession lead',
    action: 'Reading: yield curve inverted',
    tone: 'bearish',
  };
  if (strongDxy) return {
    signal: `DXY ${dxy?.toFixed(1)} · 10Y ${yield10y?.toFixed(2)}%`,
    implication: 'USD strength a headwind for EM, commodities and non-USD risk',
    action: 'Reading: USD strength regime',
    tone: 'caution',
  };
  return {
    signal: `10Y ${yield10y?.toFixed(2) ?? 'n/a'}% · DXY ${dxy?.toFixed(1) ?? 'n/a'}`,
    implication: 'Curve and USD within normal range · no macro stress flag',
    action: 'Reading: macro indicators in normal range',
    tone: 'neutral',
  };
}

// ─── Stocks Macro (VIX + sector rotation) ────────────────────────
export function stocksMacroInsight(d: {
  vix?: number;
  sp500?: number;
  rotationDiff?: number;
}): BloombergInsightData | null {
  const { vix, rotationDiff } = d;
  if (vix == null && rotationDiff == null) return null;
  const v = vix ?? 0;
  const r = rotationDiff ?? 0;

  if (v >= 25) return {
    signal: `VIX ${v.toFixed(1)} · rotation ${r >= 0 ? '+' : ''}${r.toFixed(2)}%`,
    implication: 'Stress regime · cross-sector dispersion expanding',
    action: 'Reading: volatility stress regime active',
    tone: 'bearish',
  };
  if (v < 15 && r > 0.3) return {
    signal: `VIX ${v.toFixed(1)} · cyclicals leading +${r.toFixed(2)}%`,
    implication: 'Compressed vol + cyclical leadership · late-cycle RISK-ON',
    action: 'Reading: compressed vol with cyclical leadership',
    tone: 'caution',
  };
  if (r > 0.5) return {
    signal: `Cyclicals leading +${r.toFixed(2)}% vs defensives`,
    implication: 'RISK-ON rotation · growth and financials bid',
    action: 'Reading: cyclical sector leadership',
    tone: 'bullish',
  };
  if (r < -0.5) return {
    signal: `Defensives leading ${r.toFixed(2)}% vs cyclicals`,
    implication: 'RISK-OFF rotation · capital seeking shelter',
    action: 'Reading: defensive sector leadership',
    tone: 'bearish',
  };
  return {
    signal: `VIX ${v.toFixed(1)} · neutral rotation ${r >= 0 ? '+' : ''}${r.toFixed(2)}%`,
    implication: 'No sector leadership · choppy, range-bound tape',
    action: 'Reading: no sector leadership',
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
    implication: 'Broad bid · healthy market internals',
    action: 'Reading: broad-based strength',
    tone: 'bullish',
  };
  if (breadthPct <= 25) return {
    signal: `Breadth ${breadth}/${total} green · ${bot.symbol} ${bot.change.toFixed(2)}%`,
    implication: 'Narrow tape · distribution under the surface',
    action: 'Reading: narrow breadth, weak internals',
    tone: 'bearish',
  };
  return {
    signal: `Mixed breadth ${breadth}/${total} · ${top.symbol} +${top.change.toFixed(2)}% leads`,
    implication: 'Sector dispersion · rotation over direction',
    action: `Reading: dispersion — ${top.symbol} leads, ${bot.symbol} lags`,
    tone: 'neutral',
  };
}

// ─── Commodities Macro ───────────────────────────────────────────
export function commoditiesMacroInsight(ratios: { name: string; value: number; trend: 'bullish' | 'bearish' | 'neutral' }[]): BloombergInsightData | null {
  if (!ratios || ratios.length === 0) return null;
  const cg = ratios.find(r => r.name === 'Copper/Gold');
  const gs = ratios.find(r => r.name === 'Gold/Silver');

  if (cg && cg.trend === 'bullish') return {
    signal: `Cu/Au ${cg.value.toFixed(5)} · RISK-ON tilt`,
    implication: 'Industrial demand firm · growth expectations rising',
    action: 'Reading: Cu/Au signals growth expansion',
    tone: 'bullish',
  };
  if (cg && cg.trend === 'bearish') return {
    signal: `Cu/Au ${cg.value.toFixed(5)} · RISK-OFF tilt`,
    implication: 'Defensive bid for gold · growth fears building',
    action: 'Reading: Cu/Au signals defensive bid',
    tone: 'bearish',
  };
  if (gs && gs.trend === 'bearish') return {
    signal: `Au/Ag ${gs.value.toFixed(1)} · silver lagging`,
    implication: 'Risk aversion · silver discount widening',
    action: 'Reading: Au/Ag signals risk aversion',
    tone: 'caution',
  };
  return {
    signal: 'Commodity ratios in normal range',
    implication: 'Metal ratios offer no regime signal',
    action: 'Reading: metal ratios neutral',
    tone: 'neutral',
  };
}

// ─── Crypto Macro Panel (microstructure) ─────────────────────────
export function cryptoMacroInsight(d: {
  totalMcapChange?: number;
  btcDom?: number;
  fearGreed?: number;
  fundingRate?: number;
}): BloombergInsightData | null {
  const { fundingRate, fearGreed, totalMcapChange, btcDom } = d;
  if (fundingRate == null && fearGreed == null && totalMcapChange == null) return null;

  if (fundingRate != null && fundingRate > 0.05) return {
    signal: `Funding +${fundingRate.toFixed(3)}% · longs crowded`,
    implication: 'Perp longs overpaying funding · downside squeeze risk',
    action: 'Reading: long positioning crowded',
    tone: 'caution',
  };
  if (fundingRate != null && fundingRate < -0.02) return {
    signal: `Funding ${fundingRate.toFixed(3)}% · shorts crowded`,
    implication: 'Negative funding · short squeeze fuel building',
    action: 'Reading: short positioning crowded',
    tone: 'bullish',
  };
  if (fearGreed != null && fearGreed >= 75) return {
    signal: `F&G ${fearGreed} · greed extreme`,
    implication: 'Sentiment euphoric · contrarian risk rising',
    action: 'Reading: sentiment at greed extreme',
    tone: 'caution',
  };
  if (fearGreed != null && fearGreed <= 25) return {
    signal: `F&G ${fearGreed} · fear extreme`,
    implication: 'Capitulation, contrarian setup forming',
    action: 'Reading: sentiment at fear extreme',
    tone: 'bullish',
  };
  if (totalMcapChange != null) {
    const tone: InsightTone = totalMcapChange > 1 ? 'bullish' : totalMcapChange < -1 ? 'bearish' : 'neutral';
    return {
      signal: `Total mcap ${fmtPct(totalMcapChange)} 24h · BTC.D ${btcDom?.toFixed(1) ?? 'n/a'}%`,
      implication: tone === 'bullish' ? 'Capital inflow · broad bid' : tone === 'bearish' ? 'Outflow · broad derisking' : 'Stable flows · no conviction',
      action: tone === 'neutral' ? 'Reading: stable flows' : `Reading: capital ${tone === 'bullish' ? 'inflow' : 'outflow'} regime`,
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
    implication: 'Local FX depreciating fast · capital outflow signal (RISK-OFF)',
    action: 'Reading: local FX depreciation regime',
    tone: 'bearish',
  };
  if (change1d < -1) return {
    signal: `${pair} ${fmtPct(change1d)} (1d) at ${price.toFixed(2)}`,
    implication: 'Local FX appreciating · RISK-ON tilt for LATAM assets',
    action: 'Reading: local FX appreciation regime',
    tone: 'bullish',
  };
  return {
    signal: `${pair} ${fmtPct(change1d)} (1d) at ${price.toFixed(2)}`,
    implication: 'FX stable · no macro stress signal',
    action: 'Reading: local FX stable',
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

  const sorted = [...rows].sort((a, b) => Math.abs(b.z_score ?? 0) - Math.abs(a.z_score ?? 0));
  const extreme = sorted[0];
  const z = extreme.z_score ?? 0;
  const pct = extreme.percentile_5y ?? 50;
  const ch1m = extreme.change_pct_1m ?? 0;

  const divergent = Math.abs(z) > 1.5 && Math.sign(z) !== Math.sign(ch1m) && Math.abs(ch1m) > 1;

  if (divergent) return {
    signal: `${extreme.display_name} z ${z.toFixed(2)} · 1M ${fmtPct(ch1m)} (divergent)`,
    implication: 'Statistical extreme reversing · trend exhaustion likely',
    action: 'Reading: divergence between z-score and 1M trend',
    tone: 'caution',
  };
  if (z > 2) return {
    signal: `${extreme.display_name} z ${z.toFixed(2)} · ${pct.toFixed(0)}th pctile`,
    implication: 'Stretched high vs 5Y baseline · mean-reversion bias',
    action: 'Reading: ratio stretched high vs 5Y baseline',
    tone: 'caution',
  };
  if (z < -2) return {
    signal: `${extreme.display_name} z ${z.toFixed(2)} · ${pct.toFixed(0)}th pctile`,
    implication: 'Stretched low vs 5Y baseline · dislocation building',
    action: 'Reading: ratio stretched low vs 5Y baseline',
    tone: 'bullish',
  };
  return {
    signal: `${category} most stretched: ${extreme.display_name} z ${z.toFixed(2)}`,
    implication: 'No extreme dislocations, ratios within normal range',
    action: 'Reading: no extreme dislocations',
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
    action: 'Reading: bullish structure with stretched momentum',
    tone: 'caution',
  };
  if (isBull && near52wHigh) return {
    signal: `${symbol} ${verdict} · ${pos52w?.toFixed(0)}% of 52w range`,
    implication: 'Breakout territory, leadership candidate',
    action: 'Reading: near 52w high, leadership profile',
    tone: 'bullish',
  };
  if (isBull) return {
    signal: `${symbol} ${verdict} · ${confidence}% conf`,
    implication: 'Constructive setup with confirming indicators',
    action: 'Reading: constructive structure with confirmation',
    tone: 'bullish',
  };
  if (isBear && oversold) return {
    signal: `${symbol} ${verdict} · RSI ${rsi?.toFixed(0)} oversold`,
    implication: 'Bearish trend but bounce risk near-term',
    action: 'Reading: bearish trend with oversold momentum',
    tone: 'caution',
  };
  if (isBear || near52wLow) return {
    signal: `${symbol} ${verdict} · ${confidence}% conf`,
    implication: 'Distribution structure, momentum to downside',
    action: 'Reading: distribution structure detected',
    tone: 'bearish',
  };
  return {
    signal: `${symbol} ${verdict} · ${confidence}% conf`,
    implication: 'Mixed signals, no clear directional edge',
    action: 'Reading: structure mixed, no clear edge',
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
    implication: 'High-conviction squeeze conditions detected',
    action: 'Reading: squeeze conditions aligned on top name',
    tone: 'bullish',
  };
  if (hot >= 3) return {
    signal: `${hot} squeeze candidates >70 · top ${top.symbol} (${top.score})`,
    implication: 'Broad squeeze regime, multiple setups firing',
    action: 'Reading: broad squeeze regime across multiple names',
    tone: 'bullish',
  };
  return {
    signal: `Top ${top.symbol} score ${top.score}`,
    implication: 'No high-conviction squeeze conditions currently',
    action: 'Reading: no high-conviction squeeze conditions',
    tone: 'neutral',
  };
}
