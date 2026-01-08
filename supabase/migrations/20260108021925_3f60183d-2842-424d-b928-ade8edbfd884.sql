-- Clean up legacy intraday data that should never have been in track record
-- First delete outcomes that reference intraday snapshots
DELETE FROM signal_outcomes 
WHERE snapshot_id IN (
  SELECT id FROM signal_snapshots WHERE timeframe != '1d'
);

-- Then delete the intraday snapshots themselves
DELETE FROM signal_snapshots WHERE timeframe != '1d';