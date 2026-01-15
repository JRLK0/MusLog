-- RPC para convertir a un usuario en jugador temporal por temporada y limpiar matches

CREATE OR REPLACE FUNCTION public.temporize_user_matches(
  target_user_id UUID,
  display_name TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  season_record RECORD;
  season_player_id UUID;
BEGIN
  IF target_user_id IS NULL OR display_name IS NULL OR length(trim(display_name)) = 0 THEN
    RAISE EXCEPTION 'target_user_id y display_name son obligatorios';
  END IF;

  FOR season_record IN
    SELECT DISTINCT season_id
    FROM public.matches
    WHERE season_id IS NOT NULL
      AND (
        player1_id = target_user_id OR
        player2_id = target_user_id OR
        player3_id = target_user_id OR
        player4_id = target_user_id
      )
  LOOP
    SELECT id
    INTO season_player_id
    FROM public.season_players
    WHERE season_id = season_record.season_id
      AND name = display_name
    LIMIT 1;

    IF season_player_id IS NULL THEN
      INSERT INTO public.season_players (name, season_id, is_active, created_by)
      VALUES (display_name, season_record.season_id, FALSE, NULL)
      RETURNING id INTO season_player_id;
    END IF;

    UPDATE public.matches
    SET
      temp_player1_id = CASE WHEN player1_id = target_user_id THEN season_player_id ELSE temp_player1_id END,
      player1_id = CASE WHEN player1_id = target_user_id THEN NULL ELSE player1_id END,
      temp_player2_id = CASE WHEN player2_id = target_user_id THEN season_player_id ELSE temp_player2_id END,
      player2_id = CASE WHEN player2_id = target_user_id THEN NULL ELSE player2_id END,
      temp_player3_id = CASE WHEN player3_id = target_user_id THEN season_player_id ELSE temp_player3_id END,
      player3_id = CASE WHEN player3_id = target_user_id THEN NULL ELSE player3_id END,
      temp_player4_id = CASE WHEN player4_id = target_user_id THEN season_player_id ELSE temp_player4_id END,
      player4_id = CASE WHEN player4_id = target_user_id THEN NULL ELSE player4_id END,
      updated_at = NOW()
    WHERE season_id = season_record.season_id
      AND (
        player1_id = target_user_id OR
        player2_id = target_user_id OR
        player3_id = target_user_id OR
        player4_id = target_user_id
      );
  END LOOP;

  UPDATE public.profiles
  SET can_login = FALSE,
      is_active_player = FALSE,
      updated_at = NOW()
  WHERE id = target_user_id;
END;
$$;
