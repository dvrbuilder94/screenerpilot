-- Fase 4: self-calibrating squeeze model.
-- Store the per-factor z-scores at signal time so weights can be re-fit on
-- realized outcomes, and a table to hold the calibrated weights the scanners read.

alter table if exists public.signal_snapshots
  add column if not exists factors jsonb;

create table if not exists public.model_weights (
  id uuid primary key default gen_random_uuid(),
  asset_type text not null,
  horizon text not null,
  weights jsonb not null,
  n_samples integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (asset_type, horizon)
);

alter table public.model_weights enable row level security;

-- Calibrated weights aren't secret (the point is a hidden formula, not hidden
-- weights) — allow public read; writes happen via the service role only.
drop policy if exists "model_weights public read" on public.model_weights;
create policy "model_weights public read" on public.model_weights for select using (true);
