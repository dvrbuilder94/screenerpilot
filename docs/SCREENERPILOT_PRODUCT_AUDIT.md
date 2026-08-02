# ScreenerPilot — Product Audit

_Methodology: repo inspection of `main` @ `10e66cb` (routes, components, Supabase
functions, hooks, auth, mobile). Positioning target: "show what changed, why it
matters, and what to watch on each asset" — not another Bloomberg/TradingView._

## 1. Current state

- **Stack:** React 18 + Vite + TS + Tailwind/shadcn + Supabase (auth, edge functions, Postgres). Deploys from `main` via Lovable.
- **Routes:** `/` landing · `/home` · `/asset/:symbol` · `/search` · `/squeeze` · `/watchlist` · `/agent` · `/wallet` · `/markets` · `/macro` · `/ratios` · `/commodities` · `/settings` · auth/pricing/legal.
- **Nav:** 5 tabs (Home · Markets · Search · Squeeze · Watchlist). `/macro`, `/ratios`, `/commodities`, `/agent`, `/wallet` are **not** in the nav.
- **Recent direction (respected):** `AssetDetail` became a *decision card* (`15ecc05`) — bias / confidence / evidence for·against / invalidation from RSI/MACD/EMA20-50-200/support. This audit builds on it.

## 2. Critical problems

| # | Problem | Evidence | Impact |
|---|---|---|---|
| C1 | **Business logic embedded in the view.** `buildDecisionSnapshot` (+ `Analysis`/`DecisionSnapshot` types) lives inside `AssetDetail.tsx` (458 lines). Not reusable by Watchlist/Home, not testable, no method version. | `src/pages/AssetDetail.tsx:36-138` | Blocks reuse (Watchlist "what changed" needs the same engine), untestable core. |
| C2 | **"What changed" does not exist.** The product's core promise (#3 "qué cambió") isn't computed anywhere — no snapshot history, no delta detection. | no `signal`/prev-state persistence for assets | Landing/positioning promise unmet. |
| C3 | **Confidence reads like a win-probability.** Snapshot `confidence` (55–85) has no label clarifying it's *signal alignment*, not P(profit). | `AssetDetail` snapshot UI | Trust / compliance risk. |
| C4 | **Orphan pages.** `/macro`, `/ratios`, `/commodities` (402 lines) are reachable only by URL — not linked from nav or Markets. | nav arrays; grep of links | Dead weight / wasted work. |
| C5 | **Paywall applied in one place only** (`Macro`), which is itself unreachable. Everything else is free. | `ProGate` usage = `Macro.tsx` only | Pricing not enforced; plans may gate nothing. |
| C6 | **Landing claims outrun the shipped product.** "self-calibrating model", "proven track record", "63% hit rate", "autonomous agent", "on-chain 24/7" — several are sample-data or not yet live. | `Landing.tsx`, `TrackRecord` sample, `/agent` teaser | Over-promise → trust/conversion risk. |
| C7 | **Squeeze "hit rate" not user-verifiable.** Track record shows hit-rate / return-by-score but methodology, universe, denominator and live-vs-sample aren't surfaced to the user. | `TrackRecord.tsx` (sample fallback) | Quant credibility risk. |
| C8 | **`Create alert` is decorative.** Button on `AssetDetail` with no backing flow. | `AssetDetail` | Broken-promise UX. |

## 3. Opportunities

- **O1 — A single reading engine** (`src/lib/analysis/*`) powering AssetDetail, Watchlist and Home movers → one coherent voice, testable, versioned.
- **O2 — "What changed" block** from real derived deltas (EMA/RSI/MACD crossings, range position, volatility) with honest "insufficient history" states.
- **O3 — Watchlist as a change-center** (bias + last change + level to watch), sorted by change importance.
- **O4 — Market-regime summary** on Home from SPX/NDX/VIX/DXY/10Y/BTC/gold/oil instead of SPX-only.
- **O5 — Landing honesty pass** — only claim what's demonstrable in-product.

## 4. Priorities (this PR → next)

1. **Extract the reading engine** (types + `decisionSnapshot` + `marketSignals`), versioned, missing-data-tolerant, testable. _(this PR)_
2. **Tests + CI** for the engine. _(this PR)_
3. Wire AssetDetail to the engine; add "What changed" + confidence semantics. _(next)_
4. Watchlist change-center (snapshot persistence). _(next)_
5. Home market-regime summary. _(next)_
6. Landing/pricing reality pass; Squeeze methodology surface. _(next)_

## 5. Affected files (this PR)

- `src/types/analysis.ts` _(new)_ — shared analysis contracts.
- `src/lib/analysis/decisionSnapshot.ts` _(new)_ — versioned reading engine.
- `src/lib/analysis/marketSignals.ts` _(new)_ — derived signal helpers.
- `src/pages/AssetDetail.tsx` — import the engine (remove inline logic; no behavior regression).
- `src/lib/analysis/__tests__/decisionSnapshot.test.ts` _(new)_ — unit tests.
- `.github/workflows/ci.yml`, `vitest.config.ts`, `package.json` — test/CI base.

## 6. Risks before modifying

- **Data contract:** `AssetDetail` consumes `analyze-stock`'s response shape (`Analysis`). The engine must keep that contract intact — all consumers of `Analysis` reviewed before moving the type.
- **No behavior regression:** the extracted engine must produce the same output as the current inline function for existing inputs (covered by tests).
- **Edge functions deploy separately** (Supabase panel), so backend-touching stages are validated by tests/types here, not by a live call.
- **Sample data** currently backs Squeeze/TrackRecord/Wallet; the honesty pass must not delete useful UI, only label it truthfully.
