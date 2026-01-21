-- Trigger para proteger al super administrador (admin@megia.eu)
-- Previene borrado, bloqueo, suspensión o eliminación de privilegios

CREATE OR REPLACE FUNCTION public.protect_super_admin()
RETURNS trigger AS $$
BEGIN
  -- Prevent deletion of super admin
  IF TG_OP = 'DELETE' THEN
    IF OLD.email = 'admin@megia.eu' THEN
      RAISE EXCEPTION 'No se puede eliminar al super administrador';
    END IF;
    RETURN OLD;
  END IF;

  -- Check updates
  IF TG_OP = 'UPDATE' THEN
    -- If modifying the super admin
    IF OLD.email = 'admin@megia.eu' THEN
        -- Prevent changing email
        IF NEW.email != OLD.email THEN
             RAISE EXCEPTION 'No se puede cambiar el email del super administrador';
        END IF;

        -- Prevent removing admin role
        IF NEW.is_admin = FALSE THEN
            RAISE EXCEPTION 'No se puede quitar el rol de administrador al super administrador';
        END IF;

        -- Prevent blocking login
        IF NEW.can_login = FALSE THEN
             RAISE EXCEPTION 'No se puede bloquear el acceso al super administrador';
        END IF;
        
        -- Prevent suspending player
        IF NEW.is_active_player = FALSE THEN
             RAISE EXCEPTION 'No se puede suspender al super administrador';
        END IF;

        -- Prevent changing status from approved
        IF NEW.status != 'approved' THEN
             RAISE EXCEPTION 'No se puede cambiar el estado del super administrador';
        END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_super_admin_trigger ON public.profiles;
CREATE TRIGGER protect_super_admin_trigger
  BEFORE UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_super_admin();
