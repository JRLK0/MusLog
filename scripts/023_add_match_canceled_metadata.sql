-- Add canceled metadata to matches
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS canceled_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;
