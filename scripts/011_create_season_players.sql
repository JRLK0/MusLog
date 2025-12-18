-- Tabla de jugadores temporales por temporada
CREATE TABLE IF NOT EXISTS public.season_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de ayuda
CREATE INDEX IF NOT EXISTS season_players_season_id_idx ON public.season_players(season_id);
CREATE INDEX IF NOT EXISTS season_players_is_active_idx ON public.season_players(is_active);
CREATE INDEX IF NOT EXISTS season_players_name_trgm_idx ON public.season_players USING GIN (name gin_trgm_ops);

-- Habilitar RLS
ALTER TABLE public.season_players ENABLE ROW LEVEL SECURITY;

-- Políticas:
--  - Select: usuarios aprobados pueden ver jugadores activos de la temporada; los admins pueden ver todos
--  - Insert/Update/Delete: solo admins

-- Select para usuarios aprobados (solo activos)
CREATE POLICY season_players_select_active_for_users
  ON public.season_players
  FOR SELECT
  USING (
    is_active = TRUE
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'approved')
  );

-- Select para admins (todos)
CREATE POLICY season_players_select_admin
  ON public.season_players
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Insert solo admin
CREATE POLICY season_players_insert_admin
  ON public.season_players
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Update solo admin
CREATE POLICY season_players_update_admin
  ON public.season_players
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Delete solo admin
CREATE POLICY season_players_delete_admin
  ON public.season_players
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.set_season_players_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_season_players_updated_at ON public.season_players;
CREATE TRIGGER set_season_players_updated_at
  BEFORE UPDATE ON public.season_players
  FOR EACH ROW
  EXECUTE FUNCTION public.set_season_players_updated_at();


