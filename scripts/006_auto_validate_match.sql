-- Trigger para validar automáticamente la partida cuando todos los jugadores validen
CREATE OR REPLACE FUNCTION public.check_match_validation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_validations INTEGER;
  validated_count INTEGER;
BEGIN
  -- Contar validaciones totales y validadas
  SELECT COUNT(*), COUNT(*) FILTER (WHERE validated = TRUE)
  INTO total_validations, validated_count
  FROM public.match_validations
  WHERE match_id = NEW.match_id;
  
  -- Si todos validaron (4 jugadores), marcar partida como validada
  IF validated_count = 4 THEN
    UPDATE public.matches
    SET status = 'validated', updated_at = NOW()
    WHERE id = NEW.match_id;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_validation_update ON public.match_validations;

CREATE TRIGGER on_validation_update
  AFTER UPDATE ON public.match_validations
  FOR EACH ROW
  EXECUTE FUNCTION public.check_match_validation();
