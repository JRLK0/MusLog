-- 1) Borrar al usuario admin si existe para que pueda ser recreado
DELETE FROM auth.users WHERE email = 'admin@megia.eu';

-- 2) Asegurar que el trigger de auto-confirmación esté activo (por si acaso)
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

DROP TRIGGER IF EXISTS on_auth_user_created_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_admin_user();
