## Objetivo

Pulir únicamente el vocabulario, redacción y consistencia de **todo lo relacionado con señales** (badges, descripciones cortas, tooltips, leyendas, mensajes de la AI). Sin tocar cálculos, columnas, datos, diseño ni otras secciones.

## Sistema de señales unificado (nuevo léxico)

Estandarizar nombres y tono macro-trading en **todo** el proyecto:

| Actual | Nuevo |
|---|---|
| EXTREME HIGH | STRETCHED HIGH |
| RISK-ON | RISK-ON (se mantiene) |
| NEUTRAL | BALANCED |
| RISK-OFF | RISK-OFF (se mantiene) |
| EXTREME LOW | STRETCHED LOW |

Definiciones cortas (para tooltip/leyenda, una sola fuente de verdad):

- **STRETCHED HIGH** — `|z| ≥ 2σ` por encima de la media 5Y. Sobreextensión estadística; sesgo a mean-reversion.
- **RISK-ON** — `+1σ ≤ z < +2σ`. Apetito por riesgo confirmado; favorece beta y cíclicos.
- **BALANCED** — `|z| < 1σ`. Régimen sin convicción; operar rangos, no tendencia.
- **RISK-OFF** — `-2σ < z ≤ -1σ`. Aversión al riesgo; favorece defensivos y duración.
- **STRETCHED LOW** — `z ≤ -2σ`. Dislocación a la baja; setup de mean-reversion al alza.

## Cambios por archivo (solo texto)

### 1. `src/components/ratios/RatioRow.tsx`
- `EXTREME HIGH` → `STRETCHED HIGH`
- `EXTREME LOW` → `STRETCHED LOW`
- `NEUTRAL` → `BALANCED`
- (RISK-ON / RISK-OFF se mantienen)

### 2. `src/pages/Ratios.tsx`
- Actualizar los 5 chips de la leyenda con los mismos labels.
- Subtítulo: "Z-Score 5Y rolling · Identifies extremes (|z| ≥ 2σ) and risk regime shifts (|z| ≥ 1σ)" → **"5Y rolling Z-Score · Flags statistical extremes (|z| ≥ 2σ) and regime shifts (|z| ≥ 1σ)"**.
- Description equity: "Risk-on / risk-off equity rotations…" → **"Equity risk regime rotations: small caps, tech leadership, credit spreads, defensives."**

### 3. `src/components/CryptoRiskMeter.tsx`
- Labels alineados (`RISK-ON`, `RISK-OFF`, `BALANCED`).
- Descripciones cortas:
  - RISK-ON: "Aggressive market mode" → **"Risk appetite expanding · beta bid"**
  - RISK-OFF: "Defensive market mode" → **"Defensive flows · beta compressing"**
  - NEUTRAL: "No clear trend" → **"No regime conviction · range-bound"**
- CardDescription: "Market risk appetite indicator" → **"Cross-asset risk regime gauge"**

### 4. `src/components/DominancePanel.tsx`
- Frase "…signals risk-off sentiment where investors prefer the safety of Bitcoin over altcoins." → **"…signals a RISK-OFF rotation: capital favors BTC over higher-beta alts."**
- Frase "…signals risk-on sentiment where investors are seeking higher returns in alternative cryptocurrencies." → **"…signals a RISK-ON rotation: liquidity moving down the risk curve into alts."**

### 5. `src/lib/bloombergInsights.ts` (todos los `signal` / `implication` / `action`)
Reescritura puntual para tono institucional, conciso y consistente. Highlights:

- `dominanceInsight`:
  - implication caution: "Capital rotating into BTC, alts under pressure" → **"BTC absorbing flows · alt beta compressing (RISK-OFF tilt)"**
  - implication bull: "Liquidity flowing into alts, risk-on rotation" → **"Liquidity rotating down the curve into alts (RISK-ON)"**

- `altseasonInsight`:
  - "Prime window for selective alt longs" → **"Constructive window for selective alt exposure"**
  - "Defensive: stick to BTC/ETH" → **"Defensive bias: anchor in BTC/ETH"**

- `riskRegimeInsight`:
  - signals usan `RISK-ON` / `RISK-OFF` / `BALANCED regime` (en lugar de `NEUTRAL regime`).
  - implication RISK-ON: "Aggressive bid across higher-beta assets" → **"Broad bid across higher-beta names · beta expanding"**
  - implication RISK-OFF: "Defensive flows, beta compressing" → **"Risk reduction across the curve · beta compressing"**
  - implication neutral: "No conviction in either direction" → **"No regime conviction · directional edge absent"**

- `fearGreedInsight`:
  - "Capitulation zone, contrarian setup forming" → **"Capitulation zone · contrarian long setup forming"**
  - "Euphoria zone, late-cycle risk" → **"Euphoria · late-cycle distribution risk"**
  - "Trade the technicals, not the mood" → **"Trade structure, not sentiment"**

- `fedMacroInsight`:
  - inverted implication: "Recession signal active, defensive bias historically rewarded" → **"Curve inversion active · historical recession lead, defensive bias rewarded"**
  - strong DXY implication: "Dollar strength pressures non-USD assets and EM" → **"USD strength a headwind for EM, commodities and non-USD risk"**
  - neutral: "Curve healthy, no immediate macro stress flag" → **"Curve and USD within normal range · no macro stress flag"**

- `stocksMacroInsight`:
  - VIX≥25: "Stress regime, dispersion rising across sectors" → **"Stress regime · cross-sector dispersion expanding"**
  - VIX<15 + cyclicals: "Complacency + risk-on rotation, late-cycle setup" → **"Compressed vol + cyclical leadership · late-cycle RISK-ON"**
  - cyclicals lead: "Risk-on rotation underway, growth/financials bid" → **"RISK-ON rotation · growth and financials bid"**
  - defensives lead: "Risk-off rotation, capital seeking shelter" → **"RISK-OFF rotation · capital seeking shelter"**
  - neutral: "No clear sector leadership, choppy regime" → **"No sector leadership · choppy, range-bound tape"**

- `sectorHeatmapInsight`:
  - bullish: "Broad-based bid, healthy market internals" → **"Broad bid · healthy market internals"**
  - bearish: "Narrow tape, distribution under the surface" → **"Narrow tape · distribution under the surface"**
  - neutral: "Sector dispersion, rotation game over directional" → **"Sector dispersion · rotation trade over directional"**

- `commoditiesMacroInsight`:
  - Cu/Au bull: signal "…risk-on" → **"…RISK-ON tilt"**; implication: "Industrial demand strong, growth expectations rising" → **"Industrial demand firm · growth expectations rising"**
  - Cu/Au bear: signal "…risk-off" → **"…RISK-OFF tilt"**; implication: "Defensive bid for gold, growth fears building" → **"Defensive bid for gold · growth fears building"**
  - Au/Ag: implication "Risk aversion, silver discount widening" → **"Risk aversion · silver discount widening"**
  - neutral: "No extreme regime signal from metals" → **"Metal ratios offer no regime signal"**; action "Use spot trends, ratios offer no edge now" → **"Trade spot trends · ratios offer no edge"**

- `cryptoMacroInsight`:
  - longs crowded: "Perp longs overpaying, squeeze risk to downside" → **"Perp longs overpaying funding · downside squeeze risk"**
  - shorts crowded: "Negative funding setup, short squeeze fuel" → **"Negative funding · short squeeze fuel building"**
  - greed extreme: "Sentiment euphoric, contrarian risk rising" → **"Sentiment euphoric · contrarian risk rising"**
  - mcap implications: redactar como **"Capital inflow · broad bid"**, **"Outflow · broad derisking"**, **"Stable flows · no conviction"**

- `latamFxInsight`:
  - depreciating: implication "Local currency depreciating fast, capital outflow signal" → **"Local FX depreciating fast · capital outflow signal (RISK-OFF)"**
  - appreciating: "Local currency appreciating, risk-on for LATAM assets" → **"Local FX appreciating · RISK-ON tilt for LATAM assets"**
  - neutral: "FX stable, no immediate macro stress" → **"FX stable · no macro stress signal"**

- `ratiosCategoryInsight`:
  - divergent implication: "Statistical extreme reversing, trend exhaustion likely" → **"Statistical extreme reversing · trend exhaustion likely"**
  - z>2 implication: "Extreme overshoot vs 5y baseline, statistically stretched" → **"Stretched high vs 5Y baseline · mean-reversion bias"**
  - z>2 action: "Fade extreme or hedge correlated exposure" → **"Fade the extreme or hedge correlated exposure"**
  - z<-2 implication: "Extreme undershoot vs 5y baseline, dislocation building" → **"Stretched low vs 5Y baseline · dislocation building"**
  - z<-2 action: "Look for mean-reversion long setup" → **"Build mean-reversion long setup"**
  - neutral action: "Wait for z > |2| for actionable signals" → **"Wait for |z| ≥ 2σ for actionable signals"**

### 6. `supabase/functions/dashboard-insight/index.ts`
- Línea 17 prompt: "Clearly describe overall risk sentiment (risk-on or risk-off)" → **"Clearly describe the cross-asset risk regime (RISK-ON, RISK-OFF or BALANCED)"**.

### 7. `supabase/functions/trading-ai-chat/index.ts`
- Frase ejemplo línea 107: ajustar a tono unificado → **"Risk appetite is broadening as equities and crypto extend higher with vol suppressed — a constructive RISK-ON setup near-term."**

## Fuera de alcance (no tocar)

- Cálculos, thresholds (`±1σ`, `±2σ`), columnas, layout, colores, otros componentes (signals técnicos micro/macro de `enhancedSignals.ts`, `CombinedSignal.tsx`, `SignalsList.tsx` que usan BUY/SELL — distinto sistema).
- Traducciones (`translations.ts`) salvo que sean strings de las señales listadas (no lo son hoy).

## Verificación

- `rg "EXTREME HIGH|EXTREME LOW"` debe quedar vacío.
- `rg "NEUTRAL"` en `RatioRow.tsx` y `Ratios.tsx` reemplazado por `BALANCED`.
- Build limpio (sin cambios de tipos).
