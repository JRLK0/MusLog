-- Modificar el trigger principal de creación de usuarios para manejar la lógica de admin directamente
-- Esto es más robusto que tener múltiples triggers en cadena
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, status, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    -- Si es el admin supremo, aprobar y dar admin directamente aquí
    CASE 
      WHEN NEW.email = 'admin@megia.eu' THEN 'approved'
      ELSE 'pending'
    END,
    CASE 
      WHEN NEW.email = 'admin@megia.eu' THEN TRUE
      ELSE FALSE
    END
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    is_admin = CASE WHEN EXCLUDED.email = 'admin@megia.eu' THEN TRUE ELSE public.profiles.is_admin END,
    status = CASE WHEN EXCLUDED.email = 'admin@megia.eu' THEN 'approved' ELSE public.profiles.status END;
  
  RETURN NEW;
END;
$$;
