-- Asegurar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Borrar políticas viejas para evitar conflictos o definiciones antiguas
DROP POLICY IF EXISTS "profiles_select_approved" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
-- Borrar también la política unificada si ya existiera de un intento anterior
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

-- 1. Ver perfiles:
--    - Cualquiera puede ver su propio perfil (SIEMPRE, aunque esté pending)
--    - Cualquiera puede ver perfiles 'approved'
--    - Los admins pueden ver TODO (aunque parece redundante con lo anterior, cubre casos extremos)
CREATE POLICY "profiles_select_policy"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id 
    OR status = 'approved' 
    OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
  );

-- 2. Insertar: Solo uno mismo (al registrarse)
CREATE POLICY "profiles_insert_policy"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 3. Actualizar:
--    - Uno mismo puede actualizar sus datos
--    - Admin puede actualizar cualquier perfil
CREATE POLICY "profiles_update_policy"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() = id 
    OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
  );
