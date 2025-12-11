-- Tabla de temporadas
CREATE TABLE IF NOT EXISTS public.seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

-- Todos los usuarios aprobados pueden ver temporadas
CREATE POLICY "seasons_select_all"
  ON public.seasons FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'approved'
  ));

-- Solo admins pueden crear temporadas
CREATE POLICY "seasons_insert_admin"
  ON public.seasons FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Solo admins pueden actualizar temporadas
CREATE POLICY "seasons_update_admin"
  ON public.seasons FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Solo admins pueden eliminar temporadas
CREATE POLICY "seasons_delete_admin"
  ON public.seasons FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Agregar campo season_id a matches
ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES public.seasons(id) ON DELETE SET NULL;

-- Función para asegurar solo una temporada activa
CREATE OR REPLACE FUNCTION public.ensure_single_active_season()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si se está activando una temporada, desactivar todas las demás
  IF NEW.is_active = TRUE THEN
    UPDATE public.seasons
    SET is_active = FALSE, updated_at = NOW()
    WHERE id != NEW.id AND is_active = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para asegurar solo una temporada activa
DROP TRIGGER IF EXISTS ensure_single_active_season_trigger ON public.seasons;

CREATE TRIGGER ensure_single_active_season_trigger
  BEFORE INSERT OR UPDATE ON public.seasons
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_active_season();

-- Función para asignar partidas existentes a la primera temporada
CREATE OR REPLACE FUNCTION public.assign_existing_matches_to_first_season()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  first_season_id UUID;
BEGIN
  -- Obtener la primera temporada creada
  SELECT id INTO first_season_id
  FROM public.seasons
  ORDER BY created_at ASC
  LIMIT 1;
  
  -- Si existe una temporada, asignar todas las partidas sin temporada
  IF first_season_id IS NOT NULL THEN
    UPDATE public.matches
    SET season_id = first_season_id
    WHERE season_id IS NULL;
  END IF;
END;
$$;

-- Trigger para asignar automáticamente season_id a la temporada activa al crear partida
CREATE OR REPLACE FUNCTION public.assign_match_to_active_season()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_season_id UUID;
BEGIN
  -- Si no se especificó season_id, buscar temporada activa
  IF NEW.season_id IS NULL THEN
    SELECT id INTO active_season_id
    FROM public.seasons
    WHERE is_active = TRUE
    LIMIT 1;
    
    -- Asignar a temporada activa si existe
    IF active_season_id IS NOT NULL THEN
      NEW.season_id := active_season_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para asignar temporada activa al crear partida
DROP TRIGGER IF EXISTS assign_match_to_active_season_trigger ON public.matches;

CREATE TRIGGER assign_match_to_active_season_trigger
  BEFORE INSERT ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_match_to_active_season();


