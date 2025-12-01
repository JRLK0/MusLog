-- Este trigger hace que admin@megia.eu sea automáticamente admin y aprobado
-- cuando se registre

CREATE OR REPLACE FUNCTION public.auto_approve_admin_email()
RETURNS trigger AS $$
BEGIN
  -- Si el email es admin@megia.eu, hacer admin y aprobar automáticamente
  IF NEW.email = 'admin@megia.eu' THEN
    NEW.is_admin := true;
    NEW.status := 'approved';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger que se ejecuta ANTES de insertar en profiles
DROP TRIGGER IF EXISTS on_auto_admin_email ON public.profiles;
CREATE TRIGGER on_auto_admin_email
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_admin_email();
