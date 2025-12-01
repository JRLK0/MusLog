-- Trigger para crear validaciones automáticamente al crear una partida
CREATE OR REPLACE FUNCTION public.handle_new_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Crear validaciones para cada jugador
  INSERT INTO public.match_validations (match_id, player_id, validated, validated_at)
  VALUES 
    (NEW.id, NEW.player1_id, NEW.player1_id = NEW.created_by, CASE WHEN NEW.player1_id = NEW.created_by THEN NOW() ELSE NULL END),
    (NEW.id, NEW.player2_id, NEW.player2_id = NEW.created_by, CASE WHEN NEW.player2_id = NEW.created_by THEN NOW() ELSE NULL END),
    (NEW.id, NEW.player3_id, NEW.player3_id = NEW.created_by, CASE WHEN NEW.player3_id = NEW.created_by THEN NOW() ELSE NULL END),
    (NEW.id, NEW.player4_id, NEW.player4_id = NEW.created_by, CASE WHEN NEW.player4_id = NEW.created_by THEN NOW() ELSE NULL END)
  ON CONFLICT (match_id, player_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_match_created ON public.matches;

CREATE TRIGGER on_match_created
  AFTER INSERT ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_match();
