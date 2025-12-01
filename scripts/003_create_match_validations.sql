-- Tabla de validaciones de partidas (cada jugador puede validar)
CREATE TABLE IF NOT EXISTS public.match_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  validated BOOLEAN NOT NULL DEFAULT FALSE,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(match_id, player_id)
);

ALTER TABLE public.match_validations ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver validaciones
CREATE POLICY "validations_select_all"
  ON public.match_validations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'approved'
  ));

-- Sistema puede insertar validaciones
CREATE POLICY "validations_insert"
  ON public.match_validations FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'approved'
  ));

-- Solo el jugador correspondiente o admin puede actualizar su validación
CREATE POLICY "validations_update"
  ON public.match_validations FOR UPDATE
  USING (
    auth.uid() = player_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );
