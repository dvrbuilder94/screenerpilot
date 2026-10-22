# Crypto Top 200 Radar (v1)

A dedicated, crypto-only ranked table at /crypto-top200.

## Definition of the universe
- Exactly the first 200 CoinGecko assets sorted by market capitalization at retrieval time, if the provider returns 200.
- Wrapped assets and stablecoins remain eligible for the base universe. Filtering them does not silently change the definition of "top 200".
- CoinGecko IDs are canonical. Do not join on an ambiguous duplicate ticker symbol.
- Markets refresh every 4 minutes per active edge-function isolate; the UI polls every 5 minutes.
- One-click refresh respects the upstream cache. This is not real-time tick-by-tick data.

## Data
- CoinGecko /coins/markets: rank, price, market cap, 24h volume, 1h/24h/7d/30d returns, 7d sparkline.
- Bybit /v5/market/tickers?category=linear: active USDT perpetual funding rate, USD open-interest value, derivatives turnover.
- Only uniquely matched plain SYMBOLUSDT perpetuals are joined, otherwise derivatives metrics are null.
- No model-generated data, sample fallback, or synthetic OI history.
- COINGECKO_DEMO_API_KEY is optional but recommended to avoid anonymous rate-limit errors; configure it in the Supabase function secrets.

## Indicators
- RSI(14) is computed on 7d sparkline observations, not 14 daily candles.
- Volume / market cap = CoinGecko reported 24h USD volume divided by market capitalization.
- OI / market cap = Bybit USD perpetual open interest divided by CoinGecko market cap.
- Funding is Bybit's current periodic funding rate shown in percent. Intervals can differ across markets.
- Short squeeze heuristic requires derivatives data; negative funding, higher OI/market cap, positive price move, higher 24h volume all increase its score.
- Long squeeze heuristic mirrors these with positive funding and negative price move.
- **Scores are experimental screens (0–100), not calibrated probabilities, liquidation forecasts, or advice.** No OI delta, actual liquidations, short-liquidation clusters, or long/short ratio is claimed.

## Activation
1. Review PR, then merge. The UI route does not produce live data until its Supabase Edge Function is deployed.
2. Deploy supabase/functions/crypto-top200-radar and ensure [functions.crypto-top200-radar] verify_jwt = false.
3. Configure COINGECKO_DEMO_API_KEY in Supabase secrets for a more reliable request quota.
4. Validate real data response and symbols in production before claiming the feature is live.
5. For high traffic, persist snapshots in Postgres or external cache. The per-isolate memory cache does not survive instance recycling.

## Important limitations
- CoinGecko market data and Bybit derivatives represent different sources/timestamps.
- OI from one exchange is not the whole derivatives market.
- API availability, region, rate limits and delistings can reduce data coverage.
- Future improvements: persisted OI change (4h/24h), funding history/annualization, actual liquidations, per-venue normalization, ranking backtests, source coverage dashboard, market-cap ranking exclusions as optional filters.
