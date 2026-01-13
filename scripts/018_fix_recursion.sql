-- 1. Función helper segura para comprobar admin sin recursión infinita
-- SECURITY DEFINER hace que se ejecute con permisos de superusuario/creador, saltándose el RLS del usuario que la llama.
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  );
END;
$$;

-- 2. Re-aplicar las policies usando la función segura
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

-- SELECT: Ver propio, ver aprobados, o ver todo si eres admin
CREATE POLICY "profiles_select_policy"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id 
    OR status = 'approved' 
    OR public.check_is_admin() = TRUE
  );

-- UPDATE: Editar propio, o editar cualquiera si eres admin
CREATE POLICY "profiles_update_policy"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() = id 
    OR public.check_is_admin() = TRUE
  );
