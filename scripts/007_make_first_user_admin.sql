-- Este script hace admin al primer usuario aprobado (ejecutar manualmente si es necesario)
-- Para hacer un usuario administrador manualmente, ejecuta:
-- UPDATE profiles SET is_admin = TRUE WHERE email = 'tu_email@ejemplo.com';

-- Alternativamente, para aprobar y hacer admin al primer usuario registrado:
UPDATE profiles 
SET is_admin = TRUE, status = 'approved' 
WHERE id = (SELECT id FROM profiles ORDER BY created_at LIMIT 1);
