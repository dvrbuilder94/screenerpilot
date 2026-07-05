-- The founder's own high-conviction calls, logged with the thesis at the
-- moment of the call. This is the alpha layer: a human (the founder) finds
-- the setups; BEN assists (structures/monitors the thesis). Performance is
-- tracked from entry so the track record is verifiable over time.
CREATE TABLE IF NOT EXISTS public.founder_picks (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol         text NOT NULL UNIQUE,
  company_name   text,
  entry_date     date NOT NULL,
  entry_price    numeric NOT NULL,
  thesis         text NOT NULL,          -- the founder's words, at the moment
  ben_note       text,                   -- BEN's structured assist / monitoring note
  conviction     text NOT NULL DEFAULT 'HIGH',  -- HIGH | MEDIUM
  status         text NOT NULL DEFAULT 'active', -- active | playing_out | closed | broken
  is_live_logged boolean NOT NULL DEFAULT false, -- true = logged live; false = backfilled (honesty)
  current_price  numeric,
  change_pct     numeric,                -- % since entry, refreshed by edge function
  rank           integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.founder_picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read founder picks"
  ON public.founder_picks FOR SELECT USING (true);

CREATE POLICY "Deny public insert on founder picks"
  ON public.founder_picks FOR INSERT WITH CHECK (false);

CREATE POLICY "Deny public update on founder picks"
  ON public.founder_picks FOR UPDATE USING (false);

CREATE POLICY "Deny public delete on founder picks"
  ON public.founder_picks FOR DELETE USING (false);

CREATE TRIGGER update_founder_picks_updated_at
  BEFORE UPDATE ON public.founder_picks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed with the founder's calls. Entry prices/dates and theses are DRAFTS —
-- placeholders to be confirmed/rewritten by the founder. is_live_logged=false
-- marks them honestly as backfilled, not logged live.
INSERT INTO public.founder_picks (symbol, company_name, entry_date, entry_price, thesis, conviction, status, is_live_logged, rank) VALUES
  ('PLTR', 'Palantir Technologies', '2023-01-15', 6.50,  'AI/data platform mal entendido — el mercado no veía el pivote de gobierno a comercial.', 'HIGH', 'playing_out', false, 1),
  ('IONQ', 'IonQ Inc.',             '2023-05-01', 7.20,  'Trapped-ion es la arquitectura correcta y ya factura, algo raro en quantum.',            'HIGH', 'playing_out', false, 2),
  ('AMD',  'Advanced Micro Devices','2023-01-10', 65.00, 'El único retador real de NVIDIA en AI; el mercado subestimaba MI300.',                    'HIGH', 'playing_out', false, 3),
  ('HIMS', 'Hims & Hers Health',    '2024-02-01', 9.00,  'Telehealth con marca real y márgenes; GLP-1 como catalizador ignorado.',                  'HIGH', 'active', false, 4),
  ('OSCR', 'Oscar Health',          '2024-04-01', 6.50,  'Insurtech dada por muerta; el camino a rentabilidad no estaba en precio.',                'MEDIUM', 'active', false, 5),
  ('RGTI', 'Rigetti Computing',     '2023-11-01', 1.10,  'Quantum de superconductores a valuación de descarte — opción asimétrica.',                'MEDIUM', 'active', false, 6),
  ('LAC',  'Lithium Americas',      '2025-03-01', 3.50,  'Litio en el fondo del ciclo; Thacker Pass + respaldo de GM. Pick actual.',                'HIGH', 'active', false, 7)
ON CONFLICT (symbol) DO NOTHING;
