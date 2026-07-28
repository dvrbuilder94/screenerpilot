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

GRANT SELECT ON public.model_weights TO anon;
GRANT SELECT ON public.model_weights TO authenticated;
GRANT ALL ON public.model_weights TO service_role;

alter table public.model_weights enable row level security;

drop policy if exists "model_weights public read" on public.model_weights;
create policy "model_weights public read" on public.model_weights for select using (true);