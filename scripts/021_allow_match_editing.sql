-- Allow match editing and handle validation resets

-- 1. Actualizar política de RLS para permitir edición a jugadores
DROP POLICY IF EXISTS "matches_update" ON public.matches;

CREATE POLICY "matches_update"
  ON public.matches FOR UPDATE
  USING (
    (
      -- Jugadores y Creador pueden editar si está pendiente
      (
        (auth.uid() = created_by OR auth.uid() IN (player1_id, player2_id, player3_id, player4_id))
        AND status = 'pending'
      )
      OR
      -- Administradores pueden editar siempre
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
    )
  );

-- 2. Crear función trigger para resetear validaciones al editar
CREATE OR REPLACE FUNCTION public.handle_match_edit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar si cambiaron campos relevantes (evitar bucles infinitos con status/updated_at)
  IF (
    NEW.player1_id IS DISTINCT FROM OLD.player1_id OR
    NEW.player2_id IS DISTINCT FROM OLD.player2_id OR
    NEW.player3_id IS DISTINCT FROM OLD.player3_id OR
    NEW.player4_id IS DISTINCT FROM OLD.player4_id OR
    NEW.temp_player1_id IS DISTINCT FROM OLD.temp_player1_id OR
    NEW.temp_player2_id IS DISTINCT FROM OLD.temp_player2_id OR
    NEW.temp_player3_id IS DISTINCT FROM OLD.temp_player3_id OR
    NEW.temp_player4_id IS DISTINCT FROM OLD.temp_player4_id OR
    NEW.winner_team IS DISTINCT FROM OLD.winner_team OR
    NEW.team1_score IS DISTINCT FROM OLD.team1_score OR
    NEW.team2_score IS DISTINCT FROM OLD.team2_score OR
    NEW.played_at IS DISTINCT FROM OLD.played_at
  ) THEN
    -- Resetear todas las validaciones a FALSE
    UPDATE public.match_validations
    SET validated = FALSE, validated_at = NULL
    WHERE match_id = NEW.id;
    
    -- Si el usuario que edita es un jugador de la partida, auto-validar su parte
    -- Usamos auth.uid() para detectar quién hace la edición
    UPDATE public.match_validations
    SET validated = TRUE, validated_at = NOW()
    WHERE match_id = NEW.id 
      AND player_id = auth.uid();
      
    -- Forzar estado a pending (si estaba validated o rejected)
    -- Nota: Si un admin edita, auth.uid() no coincidirá con match_validations (a menos que juegue),
    -- por lo que todas quedarán en FALSE, cumpliendo el requisito.
    NEW.status := 'pending';
    NEW.updated_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Crear el trigger
DROP TRIGGER IF EXISTS on_match_edit ON public.matches;

CREATE TRIGGER on_match_edit
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_match_edit();

