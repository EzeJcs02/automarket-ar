-- ════════════════════════════════════════════════════════════════════════
-- ADMIN POR ROL EN LUGAR DE POR EMAIL — FIORA MARKET — 2026-09
-- ════════════════════════════════════════════════════════════════════════
-- Ejecutar en el SQL editor de Supabase (proyecto kulnlwynzwdpqzyloljd).
--
-- MOTIVO: había policies RLS con emails hardcodeados (cuenta vieja
-- rlautomotores24 con control total sobre autos/consultas/pagos/publicidades,
-- y fioramarket99 con lectura de todas las concesionarias), mientras que el
-- admin real (rlautomotores671) no tenía ninguna. Se reemplazan por una función
-- es_admin() basada en app_metadata.role = 'admin' del token (sólo escribible
-- desde el servidor), y con mínimo privilegio: el panel sólo LEE y marca
-- consultas como leídas; el resto de las escrituras de admin pasan por
-- /api/admin-actions con service_role.
--
-- Requisito: el usuario admin ya tiene raw_app_meta_data.role = 'admin'
-- (hecho el 2026-09-23). Tras aplicar, el admin debe cerrar sesión y volver
-- a entrar para que su token traiga el rol.
--
-- NO se toca alertas_busqueda.alertas_owner_all: usa el email del propio usuario
-- (dueño de la alerta), no de un admin.
-- ════════════════════════════════════════════════════════════════════════

-- ─── 1. Función ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

-- ─── 2. Policies nuevas (primero crear, después borrar las viejas) ──────
DROP POLICY IF EXISTS "admin_select_autos" ON autos;
CREATE POLICY "admin_select_autos" ON autos
  FOR SELECT USING (public.es_admin());

DROP POLICY IF EXISTS "admin_select_concesionarias" ON concesionarias;
CREATE POLICY "admin_select_concesionarias" ON concesionarias
  FOR SELECT USING (public.es_admin());

DROP POLICY IF EXISTS "admin_select_profesionales" ON profesionales;
CREATE POLICY "admin_select_profesionales" ON profesionales
  FOR SELECT USING (public.es_admin());

DROP POLICY IF EXISTS "admin_select_pagos" ON pagos;
CREATE POLICY "admin_select_pagos" ON pagos
  FOR SELECT USING (public.es_admin());

DROP POLICY IF EXISTS "admin_select_publicidades" ON publicidades;
CREATE POLICY "admin_select_publicidades" ON publicidades
  FOR SELECT USING (public.es_admin());

DROP POLICY IF EXISTS "admin_select_consultas" ON consultas;
CREATE POLICY "admin_select_consultas" ON consultas
  FOR SELECT USING (public.es_admin());

DROP POLICY IF EXISTS "admin_update_consultas" ON consultas;
CREATE POLICY "admin_update_consultas" ON consultas
  FOR UPDATE USING (public.es_admin()) WITH CHECK (public.es_admin());

-- ─── 3. Borrar las policies por email ───────────────────────────────────
DROP POLICY IF EXISTS "autos_admin_email" ON autos;
DROP POLICY IF EXISTS "autos_admin_full" ON autos;
DROP POLICY IF EXISTS "concesionarias_admin_full" ON concesionarias;   -- (incluía además "dueño"; ya lo cubren concesionarias_owner_all y "Concesionaria gestiona su perfil")
DROP POLICY IF EXISTS "admin_lee_todas_concesionarias" ON concesionarias;
DROP POLICY IF EXISTS "consultas_admin_full" ON consultas;
DROP POLICY IF EXISTS "pagos_admin_select" ON pagos;
DROP POLICY IF EXISTS "publicidades_admin_write" ON publicidades;

-- ════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN
-- ════════════════════════════════════════════════════════════════════════
-- 1) No debe quedar ninguna policy con un email de admin hardcodeado
--    (sólo alertas_busqueda.alertas_owner_all, que es del dueño de la alerta):
--   select tablename, policyname from pg_policies
--   where qual ilike '%@%' or with_check ilike '%@%';
--
-- 2) Como admin (después de cerrar sesión y volver a entrar), /admin debe
--    mostrar concesionarias y profesionales pendientes, pagos, publicidades
--    y consultas, y poder marcar una consulta como leída.
-- ════════════════════════════════════════════════════════════════════════
