-- Trigger para prevenir que un admin se quite admin a sí mismo
-- Este trigger se ejecuta ANTES de actualizar un perfil y previene
-- que un usuario se quite el rol de admin a sí mismo

CREATE OR REPLACE FUNCTION public.prevent_admin_self_removal()
RETURNS trigger AS $$
BEGIN
  -- Si se está intentando quitar admin (is_admin cambia de TRUE a FALSE)
  -- y el usuario que se está actualizando es el mismo que está haciendo la actualización
  IF OLD.is_admin = TRUE AND NEW.is_admin = FALSE AND NEW.id = auth.uid() THEN
    RAISE EXCEPTION 'No puedes quitarte el rol de admin a ti mismo';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger que se ejecuta ANTES de actualizar en profiles
DROP TRIGGER IF EXISTS prevent_admin_self_removal_trigger ON public.profiles;
CREATE TRIGGER prevent_admin_self_removal_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.is_admin IS DISTINCT FROM NEW.is_admin)
  EXECUTE FUNCTION public.prevent_admin_self_removal();
