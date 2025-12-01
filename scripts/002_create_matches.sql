-- Tabla de partidas
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Jugadores (4 jugadores: equipo1 = player1 + player2, equipo2 = player3 + player4)
  player1_id UUID NOT NULL REFERENCES public.profiles(id),
  player2_id UUID NOT NULL REFERENCES public.profiles(id),
  player3_id UUID NOT NULL REFERENCES public.profiles(id),
  player4_id UUID NOT NULL REFERENCES public.profiles(id),
  
  -- Equipo ganador: 1 = equipo1 (player1+player2), 2 = equipo2 (player3+player4)
  winner_team INTEGER NOT NULL CHECK (winner_team IN (1, 2)),
  
  -- Estado de validación
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected')),
  
  -- Puntuación opcional
  team1_score INTEGER DEFAULT 0,
  team2_score INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Todos los usuarios aprobados pueden ver partidas
CREATE POLICY "matches_select_all"
  ON public.matches FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'approved'
  ));

-- Solo usuarios aprobados pueden crear partidas
CREATE POLICY "matches_insert_approved"
  ON public.matches FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'approved')
  );

-- Solo admin o creador puede actualizar
CREATE POLICY "matches_update"
  ON public.matches FOR UPDATE
  USING (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Solo admin puede eliminar
CREATE POLICY "matches_delete_admin"
  ON public.matches FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE
  ));
