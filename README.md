# ScreenerPilot — AI Market Intelligence Terminal

Cross-asset market intelligence terminal for monitoring regimes, dislocations, and relative value across crypto, equities, ETFs, indices and commodities.

## What it is

ScreenerPilot is a **read-only analytics and monitoring product**. It does not execute trades, manage funds, or provide personalised financial advice. All outputs are descriptive market readings derived from public market data.

## Capabilities

- **Cross-asset monitoring**: crypto, equities, ETFs, indices, commodities, FX
- **Macro intelligence**: regimes (RISK-ON / RISK-OFF), curve, DXY, VIX, breadth
- **Cross-asset ratios**: z-scores and 5Y percentiles for relative-value context
- **Stock intelligence**: on-demand descriptive analysis of individual tickers
- **AlexIA copilot**: AI analyst that interprets market context without prescriptive recommendations
- **Auto-refresh**: data refresh every 10 minutes
- **Multi-language**: EN / ES

## Data sources

- **Binance** public market data API (crypto)
- **Yahoo Finance** public market data API (equities, indices, commodities)
- **FRED** macro indicators

## Output framing

All readings are **descriptive**, never prescriptive:

- Bias labels: `BULLISH` / `BEARISH` / `NEUTRAL_BIAS` describe market context, not trade actions
- Scores and z-scores indicate statistical position vs historical baseline
- No entry prices, stop-loss levels, or price targets are produced by the product
- No portfolio allocation, position sizing, or trade execution guidance

## Disclaimer

This product is an analytics and information tool. It does not constitute financial advice and does not place or recommend trades. Users are responsible for their own decisions.

## Tech stack

- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- TanStack Query
- Lovable Cloud (backend, auth, edge functions)
- Lovable AI Gateway (Gemini 2.5 Flash for AlexIA)

## License

MIT
