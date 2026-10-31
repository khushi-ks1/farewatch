ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS current_price_is_mock BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE public.watches AS watches
SET current_price_is_mock = COALESCE((
  SELECT snapshots.is_mock
  FROM public.price_snapshots AS snapshots
  WHERE snapshots.watch_id = watches.id
    AND snapshots.price = watches.current_lowest_price
  ORDER BY snapshots.captured_at DESC
  LIMIT 1
), FALSE);
