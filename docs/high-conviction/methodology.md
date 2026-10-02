# High Conviction OS — Methodology

## Purpose

High Conviction OS is a research and portfolio-intelligence layer. It should help answer:

1. Is the current portfolio outperforming SPY?
2. Is the result broad or dominated by one position?
3. What is portfolio-level momentum (RSI), volatility, beta and drawdown?
4. Which holdings are adding or subtracting return?
5. Has evidence strengthened or weakened each thesis?
6. Is a newly discovered public equity materially more interesting to research than something already held or watched?

It is not an auto-trading system.

## Portfolio analytics

- Benchmark: SPY.
- Portfolio RSI: RSI(14) calculated on reconstructed portfolio NAV, never a simple average of constituent RSI.
- Relative strength: security return minus SPY return over the same window.
- Attribution: position weight × security return, shown in percentage points where appropriate.
- Concentration: top-1, top-3, theme weights and HHI.
- Ex-ORBS view: required while ORBS is a dominant position so stock-selection breadth can be inspected separately.
- Data coverage must always be shown. Never silently treat missing history as zero return.

## Daily research states

Every tracked company can be in one of these states:

- **THESIS_STRENGTHENED** — new evidence supports an existing thesis.
- **THESIS_WEAKENED** — new evidence contradicts or damages an existing thesis.
- **NEW_CANDIDATE** — a newly discovered listed equity merits deeper research.
- **RESEARCH_REQUIRED** — potentially interesting but evidence is incomplete.
- **REJECTED** — researched and rejected; preserve the reason to avoid rediscovery loops.
- **NO_MATERIAL_CHANGE** — checked, but nothing new justifies a state change.

A daily run should not force action. “No material change” is a valid result.

## Evidence hierarchy

Prefer primary and high-quality sources: company filings, earnings releases/calls, investor presentations, exchange releases, regulatory filings, official contracts/awards, reputable financial reporting, and verifiable market data. Community sources can generate hypotheses but should not be the only evidence for a thesis change.

Separate:
- facts,
- source claims,
- analyst/market interpretation,
- our inference.

## Research dimensions

For each company, investigate where data is available:

- revenue/earnings trajectory and guidance,
- revisions to consensus or company outlook,
- unit economics / margins / FCF,
- balance sheet, debt, dilution and capital needs,
- valuation versus its own history and relevant peers,
- catalysts and timing,
- market structure / competitive position,
- insider and institutional signals,
- relative strength vs SPY,
- RSI/momentum and drawdown,
- thesis-specific KPIs,
- major risks and falsification conditions.

Technical signals never override fundamental thesis evidence.

## Candidate discipline

Do not produce a long list of “interesting stocks.” A new candidate should explain:
- why it appeared now,
- what bottleneck or structural theme it monetizes,
- what evidence is new,
- what could make the thesis false,
- which current holding/watchlist name it is most comparable to.

The agent may identify strong research candidates, but it must not make autonomous trades.

## GitHub memory

Use this directory as persistent memory:

- `portfolio.md` — portfolio snapshot / future transaction-source notes.
- `universe.md` — seed universe and verification state.
- `theses/` — one file per deeply researched ticker when needed.
- `candidates/` — candidate write-ups.
- `rejected/` — rejected names and reasons.
- `runs/YYYY-MM-DD.md` — daily evidence log.

Daily work should update state only when there is material new evidence.
