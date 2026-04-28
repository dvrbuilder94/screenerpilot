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
