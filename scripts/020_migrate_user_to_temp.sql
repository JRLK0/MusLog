-- Migrar usuario registrado a jugador temporal y limpiar referencias
CREATE OR REPLACE FUNCTION public.migrate_user_to_temp(target_user_id UUID, display_name TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  season_record RECORD;
  temp_player_id UUID;
  default_season_id UUID;
BEGIN
  -- Obtener temporada por defecto (la primera creada) para partidas sin season_id
  SELECT id INTO default_season_id
  FROM public.seasons
  ORDER BY created_at ASC
  LIMIT 1;

  FOR season_record IN
    SELECT DISTINCT COALESCE(season_id, default_season_id) AS season_id
    FROM public.matches
    WHERE target_user_id IN (player1_id, player2_id, player3_id, player4_id)
      AND (season_id IS NOT NULL OR default_season_id IS NOT NULL)
  LOOP
    INSERT INTO public.season_players (name, season_id, created_by, is_active)
    VALUES (display_name, season_record.season_id, auth.uid(), FALSE)
    RETURNING id INTO temp_player_id;

    UPDATE public.matches
    SET
      temp_player1_id = CASE WHEN player1_id = target_user_id THEN temp_player_id ELSE temp_player1_id END,
      temp_player2_id = CASE WHEN player2_id = target_user_id THEN temp_player_id ELSE temp_player2_id END,
      temp_player3_id = CASE WHEN player3_id = target_user_id THEN temp_player_id ELSE temp_player3_id END,
      temp_player4_id = CASE WHEN player4_id = target_user_id THEN temp_player_id ELSE temp_player4_id END,
      player1_id = CASE WHEN player1_id = target_user_id THEN NULL ELSE player1_id END,
      player2_id = CASE WHEN player2_id = target_user_id THEN NULL ELSE player2_id END,
      player3_id = CASE WHEN player3_id = target_user_id THEN NULL ELSE player3_id END,
      player4_id = CASE WHEN player4_id = target_user_id THEN NULL ELSE player4_id END
    WHERE
      (season_id = season_record.season_id OR (season_id IS NULL AND season_record.season_id = default_season_id))
      AND target_user_id IN (player1_id, player2_id, player3_id, player4_id);
  END LOOP;

  -- Limpiar validaciones del usuario para evitar inconsistencias
  DELETE FROM public.match_validations WHERE player_id = target_user_id;
END;
$$;
