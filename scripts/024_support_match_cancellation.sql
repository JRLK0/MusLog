-- Support match cancellation metadata on existing databases
-- 1) Allow canceled in status check
ALTER TABLE public.matches
  DROP CONSTRAINT IF EXISTS matches_status_check;

ALTER TABLE public.matches
  ADD CONSTRAINT matches_status_check
  CHECK (status IN ('pending', 'validated', 'rejected', 'canceled'));

-- 2) Add cancellation metadata columns
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS canceled_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;
