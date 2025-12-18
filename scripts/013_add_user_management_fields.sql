-- Add management fields to profiles and auto-approval for suspended players

-- 1) New columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active_player BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS can_login BOOLEAN DEFAULT TRUE;

-- 2) Function to auto-approve pending validations when a player is suspended
CREATE OR REPLACE FUNCTION public.auto_approve_suspended_player_validations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only act when changing from active to suspended
  IF TG_OP = 'UPDATE' AND OLD.is_active_player = TRUE AND NEW.is_active_player = FALSE THEN
    -- Approve all pending validations for this player on pending matches
    UPDATE public.match_validations mv
    SET validated = TRUE,
        validated_at = NOW()
    WHERE mv.player_id = NEW.id
      AND mv.validated = FALSE
      AND mv.match_id IN (
        SELECT id FROM public.matches WHERE status = 'pending'
      );
  END IF;

  RETURN NEW;
END;
$$;

-- 3) Trigger on profiles to run auto-approval when suspending a player
DROP TRIGGER IF EXISTS on_profile_suspend_auto_approve ON public.profiles;
CREATE TRIGGER on_profile_suspend_auto_approve
  AFTER UPDATE OF is_active_player ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_suspended_player_validations();
