-- ════════════════════════════════════════════════════════════════════════
-- VENCIMIENTO DE FIJADO EN HOME Y BANNER — FIORA MARKET — 2026-09-24
-- ════════════════════════════════════════════════════════════════════════
-- Ejecutar en el SQL editor de Supabase (proyecto kulnlwynzwdpqzyloljd)
-- ANTES de desplegar el código que las usa (mp-webhook y cron-expire-boosts):
-- si el webhook intenta escribir una columna que no existe, el pago falla.
--
-- MOTIVO: "Fijado en Home" ($25.000) y "Banner en Home" ($50.000) se venden
-- por 30 días, pero no guardaban fecha de vencimiento y nadie los apagaba:
-- quedaban activos para siempre. Mismo caso con el plan profesional
-- destacado (esa columna, plan_vence_at, ya existe).
--
-- NULL = sin vencimiento (lo que activa el admin a mano sigue igual).
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE autos ADD COLUMN IF NOT EXISTS fijado_home_expira_at timestamptz;
ALTER TABLE concesionarias ADD COLUMN IF NOT EXISTS banner_expira_at timestamptz;

-- Los que ya están activos por un pago aprobado: vencen a los 30 días de ese pago
-- (si ya pasaron, el próximo cron los apaga).
UPDATE autos a SET fijado_home_expira_at = p.ult + interval '30 days'
FROM (SELECT auto_id, max(created_at) ult FROM pagos
      WHERE tipo = 'fijado_home' AND estado = 'approved' GROUP BY auto_id) p
WHERE a.id = p.auto_id AND a.fijado_home IS TRUE AND a.fijado_home_expira_at IS NULL;

UPDATE concesionarias c SET banner_expira_at = p.ult + interval '30 days'
FROM (SELECT concesionaria_id, max(created_at) ult FROM pagos
      WHERE tipo = 'banner_home' AND estado = 'approved' GROUP BY concesionaria_id) p
WHERE c.id = p.concesionaria_id AND c.banner_activo IS TRUE AND c.banner_expira_at IS NULL;

-- ════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN
--   select column_name from information_schema.columns
--   where (table_name='autos' and column_name='fijado_home_expira_at')
--      or (table_name='concesionarias' and column_name='banner_expira_at');
--   -- 2 filas
-- ════════════════════════════════════════════════════════════════════════
