# Reposition copy: from "trading signals" to "market intelligence"

A copy and framing refactor only. No backend, no logic, no visual identity changes. Existing routes (Landing, Markets, Macro, Ratios, Commodities, Stock Intelligence) and all functionality stay intact.

## Goal

Reposition ScreenerPilot as an institutional cross-asset **market intelligence terminal** (regimes, relative value, dislocations, stretch monitoring, decision support) — not a buy/sell signals product.

## Terminology mapping (applied everywhere it appears)

| Old | New |
|---|---|
| Signals / Signal | Setups / Market context |
| Signal Score | Market Score / Conviction Score |
| Top Signals | Top Setups / Top Opportunities |
| Buy / Sell / Hold | Bullish / Bearish / Mixed (or Extended / Depressed / Balanced by context) |
| Strong Buy / Strong Sell | High-conviction Bullish / High-conviction Bearish |
| Long / Short / Neutral | Bullish / Bearish / Mixed |
| Entry Zone | Key Price Area |
| Stop-loss | Risk Level |
| Targets | Reference Levels |
| Trading calls / recommendations | Market context / observations |

Tone: institutional, Bloomberg-like, analytical, never prescriptive. Avoid retail trading language, crypto-native slang, and hype.

## Scope of edits

### 1. Landing page (`src/pages/Landing.tsx`)
- New hero copy, e.g.
  - H1: "AI market intelligence for cross-asset decision-making."
  - Sub: "Track market regimes, relative value, and price dislocations from one terminal."
- Replace "Top Signals" preview table with "Top Setups" / "Top Opportunities" using Bullish / Bearish / Mixed labels and Conviction Score.
- Rewrite section titles, value props, "How it works" steps, and meta description (no mention of "signals" or "trading calls").
- CTAs: neutral and analytical ("Open terminal", "Explore market context") — no "Get signals".

### 2. Translations (`src/lib/translations.ts`) — EN + ES
Update keys used across the UI: `signal`, `signalType`, `signalLabel`, `buy`, `sell`, `hold`, `strongBuy`, `strongSell`, `entryZone`, `targets`, `target`, `stopLoss`, `allSignals`, all `*SignalDesc` strings, and the Combined Signal narrative strings. Keep the keys (to avoid touching components) but rewrite the **values** to the new vocabulary in both languages.

### 3. Component-level labels (text only)
Files with visible copy to rephrase:
- `TopSetupsPanel.tsx`, `SignalsList.tsx`, `SignalsSidebar.tsx`, `EnhancedSignalCard.tsx`, `CombinedSignal.tsx`
- `AssetIntelligencePage.tsx`, `IndicatorPanel.tsx`, `IndicatorPanels.tsx`, `GroupRanking.tsx`, `FilterPanel.tsx`
- `BloombergInsight.tsx`, `DashboardOverview.tsx`, `CryptoMacroInsight.tsx`, `AltseasonPanel.tsx`, `AltseasonIndexPanel.tsx`, `DominancePanel.tsx`, `EthUpsidePanel.tsx`
- `macro/StocksMacro.tsx`, `macro/FedMacro.tsx`, `macro/FedMacroPanel.tsx`, `macro/CryptoMacroPanel.tsx`, `ratios/RatioCategoryTable.tsx`
- `TradingAIWidget.tsx` (AlexIA chat surface): rename labels and rewrite placeholder/empty-state to analytical phrasing.

For each: change visible strings only. Replace "Signal", "Buy/Sell/Hold", "Entry Zone", "Stop-loss", "Targets" per the table above.

### 4. AlexIA / insights tone
Adjust prompts and on-screen helper copy in `TradingAIWidget.tsx` and the insight panels (`BloombergInsight`, `DashboardOverview`, `CryptoMacroInsight`) so framing reads as analysis ("market looks extended", "reversion candidate", "regime shifting") rather than instructions ("buy this", "sell that"). System prompt of `trading-ai-chat` / `insight-chat` edge functions left as-is unless you also want a tone tweak there — say so and I'll include it.

### 5. SEO + metadata
- Update `<title>`, meta description and OG tags in `index.html`, the `Seo` component default, `public/llms.txt`, and the per-page `Seo` calls (Landing, Markets, Macro, Ratios, Commodities, StockIntelligence). Replace "signals / trading" framing with "market intelligence / cross-asset context".

## Non-goals (explicitly out of scope)

- No changes to scoring math, indicators, edge functions, DB schema, RLS, or routes.
- No visual / theme / layout changes.
- Internal variable, type, file, and translation-key names stay (`signal`, `signalType`, etc.) to avoid touching logic — only the user-visible **values** change.

## Languages

Both English and Spanish copy updated in parallel.
