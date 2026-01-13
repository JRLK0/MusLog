-- Borrar el usuario si ya existe para poder recrearlo con el nuevo trigger
DELETE FROM auth.users WHERE email = 'admin@megia.eu';

-- Función para auto-confirmar el email de admin@megia.eu en la tabla de AUTH
CREATE OR REPLACE FUNCTION public.auto_confirm_admin_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'admin@megia.eu' THEN
    NEW.email_confirmed_at := NOW();
    NEW.last_sign_in_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que se ejecuta ANTES de insertar en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_admin_user();
