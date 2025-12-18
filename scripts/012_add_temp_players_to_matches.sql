-- Permitir jugadores temporales por temporada en partidas

-- 1) Hacer opcionales los jugadores registrados y agregar columnas de jugadores temporales
ALTER TABLE public.matches
  ALTER COLUMN player1_id DROP NOT NULL,
  ALTER COLUMN player2_id DROP NOT NULL,
  ALTER COLUMN player3_id DROP NOT NULL,
  ALTER COLUMN player4_id DROP NOT NULL;

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS temp_player1_id UUID REFERENCES public.season_players(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS temp_player2_id UUID REFERENCES public.season_players(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS temp_player3_id UUID REFERENCES public.season_players(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS temp_player4_id UUID REFERENCES public.season_players(id) ON DELETE SET NULL;

-- 2) Garantizar que cada posición de jugador tenga o bien un usuario registrado o un temporal
ALTER TABLE public.matches
  ADD CONSTRAINT matches_player1_required CHECK (
    (player1_id IS NOT NULL) OR (temp_player1_id IS NOT NULL)
  ),
  ADD CONSTRAINT matches_player2_required CHECK (
    (player2_id IS NOT NULL) OR (temp_player2_id IS NOT NULL)
  ),
  ADD CONSTRAINT matches_player3_required CHECK (
    (player3_id IS NOT NULL) OR (temp_player3_id IS NOT NULL)
  ),
  ADD CONSTRAINT matches_player4_required CHECK (
    (player4_id IS NOT NULL) OR (temp_player4_id IS NOT NULL)
  );

-- 3) Reemplazar trigger de creación de validaciones para omitir jugadores temporales
CREATE OR REPLACE FUNCTION public.handle_new_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Crear validaciones SOLO para jugadores registrados (profiles)
  IF NEW.player1_id IS NOT NULL THEN
    INSERT INTO public.match_validations (match_id, player_id, validated, validated_at)
    VALUES (NEW.id, NEW.player1_id, NEW.player1_id = NEW.created_by, CASE WHEN NEW.player1_id = NEW.created_by THEN NOW() ELSE NULL END)
    ON CONFLICT (match_id, player_id) DO NOTHING;
  END IF;

  IF NEW.player2_id IS NOT NULL THEN
    INSERT INTO public.match_validations (match_id, player_id, validated, validated_at)
    VALUES (NEW.id, NEW.player2_id, NEW.player2_id = NEW.created_by, CASE WHEN NEW.player2_id = NEW.created_by THEN NOW() ELSE NULL END)
    ON CONFLICT (match_id, player_id) DO NOTHING;
  END IF;

  IF NEW.player3_id IS NOT NULL THEN
    INSERT INTO public.match_validations (match_id, player_id, validated, validated_at)
    VALUES (NEW.id, NEW.player3_id, NEW.player3_id = NEW.created_by, CASE WHEN NEW.player3_id = NEW.created_by THEN NOW() ELSE NULL END)
    ON CONFLICT (match_id, player_id) DO NOTHING;
  END IF;

  IF NEW.player4_id IS NOT NULL THEN
    INSERT INTO public.match_validations (match_id, player_id, validated, validated_at)
    VALUES (NEW.id, NEW.player4_id, NEW.player4_id = NEW.created_by, CASE WHEN NEW.player4_id = NEW.created_by THEN NOW() ELSE NULL END)
    ON CONFLICT (match_id, player_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_match_created ON public.matches;
CREATE TRIGGER on_match_created
  AFTER INSERT ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_match();

-- 4) Ajustar trigger de auto-validación para considerar solo jugadores registrados
CREATE OR REPLACE FUNCTION public.check_match_validation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  required_validations INTEGER := 0;
  validated_count INTEGER;
  match_record public.matches%ROWTYPE;
BEGIN
  SELECT * INTO match_record FROM public.matches WHERE id = NEW.match_id;

  -- Cantidad de jugadores registrados que deben validar
  required_validations :=
    (CASE WHEN match_record.player1_id IS NULL THEN 0 ELSE 1 END) +
    (CASE WHEN match_record.player2_id IS NULL THEN 0 ELSE 1 END) +
    (CASE WHEN match_record.player3_id IS NULL THEN 0 ELSE 1 END) +
    (CASE WHEN match_record.player4_id IS NULL THEN 0 ELSE 1 END);

  -- Contar cuántos han validado
  SELECT COUNT(*) FILTER (WHERE validated = TRUE)
  INTO validated_count
  FROM public.match_validations
  WHERE match_id = NEW.match_id;

  -- Si todos los jugadores registrados validaron, marcar partida como validada
  IF required_validations > 0 AND validated_count = required_validations THEN
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

