-- Allow canceled status in matches.status
ALTER TABLE public.matches
  DROP CONSTRAINT IF EXISTS matches_status_check;

ALTER TABLE public.matches
  ADD CONSTRAINT matches_status_check
  CHECK (status IN ('pending', 'validated', 'rejected', 'canceled'));
