# BEN Morning Wire — Redesign for elegance and global structure

Two problems to solve:

1. **Typography is inconsistent.** The expanded "full wire" mixes a serif body with a mono/uppercase header, plus an orange accent on headings and inline code. It reads as noisy, not refined.
2. **Content is too narrow and too symbol-heavy.** The brief jumps straight into local/LATAM-ish observations and is full of `=`, `z=`, `pctl`, `Δ`, `|` characters. It should open globally (World → US → Europe → Asia → Americas → Rates/FX → Commodities/Crypto) like a real institutional morning note (GS Daily, MLIV Pulse, JPM Eye on the Market).

## What changes

### 1. Typography — one family, quiet hierarchy

In `src/components/DailyBriefingCard.tsx`, simplify the expanded prose so it visually belongs to the same document as the headline:

- Drop the serif body. Use the app's sans (`Inter`) for everything — headline, body, bullets, tables. One family only.
- Headings: same sans, **sentence case** (not uppercase, not tracked-out), slightly larger and semibold, with a thin `border-b border-border` and generous top margin. No orange.
- Body: `text-[15px] leading-[1.75]`, `text-foreground/85`, max width `68ch`.
- Bullets: native `list-disc` with muted markers. Remove the orange em-dash `::before` trick.
- Tables: sans, normal case headers in `text-muted-foreground`, tabular-nums for numeric cells only. Thin row dividers.
- Reserve the Bloomberg orange (`hsl(28,95%,55%)`) for **only** the left stripe and the `BEN · MORNING WIRE` chip in the terminal header. Nothing inside the body is orange.
- Remove inline `code` styling overrides — render `code` as plain semibold sans so tickers (AAPL, SPX) look like text, not terminal tokens.

### 2. Briefing structure — global first, less symbology

Rewrite the system prompt in `supabase/functions/generate-daily-briefing/index.ts` so BEN produces a globally-ordered note with prose-style data instead of symbol soup.

New section order:

```text
TL;DR — one sentence

Global Overview        (one short paragraph: overall risk tone)
United States          (equities, breadth, key sector)
Europe                 (Stoxx, DAX, FTSE, one macro note)
Asia                   (Nikkei, HSI, China, one macro note)
Americas ex-US         (LATAM, Brazil, Mexico — only if data warrants)
Rates & FX             (UST 2y/10y, DXY, EURUSD, JPY)
Commodities            (Oil, Gold, Copper)
Crypto                 (BTC, ETH, dominance)
Key Movers             (table, 6-8 rows)
Cross-Asset Signals    (ratios in prose, not z= notation)
On the Radar           (events / levels to watch)
BEN's Take             (one paragraph, 48-65 words)
```

Formatting rules tightened in the prompt:

- Write data in prose: "SPX +0.4%, breadth firm with 62% advancers" — not `SPX Δ1D=+0.40%`.
- Ratios in prose: "Gold/Silver stretched at the 92nd percentile, a level historically associated with risk-off rotations." Avoid `z=`, `pctl=`, `|`.
- Use plain `-` bullets, no labels in ALL CAPS, no `**LABEL —**` pattern.
- Movers table keeps 4 columns but Δ becomes `1D %` and `7D %` (plain words).
- Skip any section that has no data — never write "n/a" or placeholder rows.
- Hard rule in the prompt: "Do not use the symbols `=`, `|`, `Δ`, `z=`, `pctl` anywhere in the output."

### 3. User-prompt context broadened

Update the data fetch in the same edge function so BEN actually has global material to work with:

- Group `market_snapshots` by region/category before sending: `us_equities`, `europe`, `asia`, `latam`, `rates_fx`, `commodities`, `crypto`.
- Pass each group as a short labeled block in the user prompt so the model has structured global context, not just a flat "top movers" list.
- Keep macro + ratios blocks but feed them as readable lines (no `Δ`, no `z=`).

## Files touched

- `src/components/DailyBriefingCard.tsx` — prose styling simplified, one font family, orange removed from body.
- `supabase/functions/generate-daily-briefing/index.ts` — new system prompt (global structure, prose data, banned symbols) and grouped user-prompt context. `extractHeadline` unchanged.

## Out of scope

- No DB schema changes.
- No new edge functions.
- No translation feature yet (English-only stays).
