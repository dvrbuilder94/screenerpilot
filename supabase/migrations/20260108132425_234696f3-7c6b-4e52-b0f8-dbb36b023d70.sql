-- Explicitly deny public writes to asset_candles
CREATE POLICY "Deny public INSERT on asset_candles"
  ON public.asset_candles FOR INSERT
  TO public
  WITH CHECK (false);

CREATE POLICY "Deny public UPDATE on asset_candles"
  ON public.asset_candles FOR UPDATE
  TO public
  USING (false);

CREATE POLICY "Deny public DELETE on asset_candles"
  ON public.asset_candles FOR DELETE
  TO public
  USING (false);

-- Explicitly deny public writes to asset_snapshots
CREATE POLICY "Deny public INSERT on asset_snapshots"
  ON public.asset_snapshots FOR INSERT
  TO public
  WITH CHECK (false);

CREATE POLICY "Deny public UPDATE on asset_snapshots"
  ON public.asset_snapshots FOR UPDATE
  TO public
  USING (false);

CREATE POLICY "Deny public DELETE on asset_snapshots"
  ON public.asset_snapshots FOR DELETE
  TO public
  USING (false);