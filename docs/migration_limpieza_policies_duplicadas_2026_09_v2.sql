-- ════════════════════════════════════════════════════════════════════════
-- LIMPIEZA DE POLICIES RLS DUPLICADAS (PARTE 2) — FIORA MARKET — 2026-09
-- ════════════════════════════════════════════════════════════════════════
-- Ejecutar en el SQL editor de Supabase (proyecto kulnlwynzwdpqzyloljd).
--
-- Continuación de migration_limpieza_policies_duplicadas_2026_09.sql (que ya
-- se corrió: borró "Concesionaria gestiona su perfil" en concesionarias).
-- Mapeando pg_policies completo de autos/concesionarias/profesionales se
-- encontraron más duplicados: policies que cubren exactamente el mismo caso
-- que otra ya existente (mismo criterio, incluidas en un OR permisivo por
-- Postgres). No es un problema de seguridad — el resultado de acceso final
-- es idéntico antes y después — es sólo prolijidad y reduce el riesgo de
-- tocar una y no la otra en el futuro.
--
-- IMPORTANTE — NO se toca ninguna policy que sea la ÚNICA fuente de un
-- permiso (ej. concesionarias_owner_all es la única que da DELETE en
-- concesionarias, así que se mantiene).
--
-- ANTES DE CORRER: confirmar que los nombres siguen siendo estos (pueden
-- haber cambiado desde el mapeo). Si una policy no aparece en el resultado,
-- el DROP IF EXISTS simplemente no hace nada para esa línea.
--   select tablename, policyname, cmd, qual, with_check
--   from pg_policies
--   where tablename in ('autos','profesionales')
--   order by tablename, cmd, policyname;
-- ════════════════════════════════════════════════════════════════════════

-- ─── autos ───────────────────────────────────────────────────────────────
-- autos_select_own: subconjunto exacto de autos_select_public (que además
-- suma "activo = true" para el público).
DROP POLICY IF EXISTS "autos_select_own" ON autos;

-- "Concesionarias editan sus propios autos": duplicado exacto (mismo qual)
-- de autos_update_own.
DROP POLICY IF EXISTS "Concesionarias editan sus propios autos" ON autos;

-- ─── profesionales ──────────────────────────────────────────────────────
-- INSERT: 3 policies idénticas (auth.uid() = user_id) — se deja sólo
-- profesionales_insert_own (mismo naming que el resto de las tablas).
DROP POLICY IF EXISTS "insertar_propio" ON profesionales;
DROP POLICY IF EXISTS "profesionales_insert" ON profesionales;

-- SELECT: profesionales_select_public (aprobado=true OR dueño) ya cubre a
-- las otras 4 — ver_activos/profesionales_public_read exigen además
-- activo=true, pero como es un OR permisivo con select_public (que no exige
-- activo), sacarlas no cambia qué se ve. profesionales_own_read/ver_propio
-- son sólo el caso "dueño", ya cubierto por el OR de select_public.
DROP POLICY IF EXISTS "profesionales_own_read" ON profesionales;
DROP POLICY IF EXISTS "profesionales_public_read" ON profesionales;
DROP POLICY IF EXISTS "ver_activos" ON profesionales;
DROP POLICY IF EXISTS "ver_propio" ON profesionales;

-- UPDATE: 3 policies idénticas (auth.uid() = user_id) — se deja sólo
-- profesionales_update_own.
DROP POLICY IF EXISTS "editar_propio" ON profesionales;
DROP POLICY IF EXISTS "profesionales_own_update" ON profesionales;

-- ════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN
-- ════════════════════════════════════════════════════════════════════════
-- 1) autos debe quedar con 5 policies: admin_select_autos, autos_delete_own,
--    autos_insert_own, autos_select_public, autos_update_own.
--   select policyname, cmd from pg_policies where tablename = 'autos' order by cmd, policyname;
--
-- 2) profesionales debe quedar con 4 policies: admin_select_profesionales,
--    profesionales_select_public, profesionales_insert_own, profesionales_update_own.
--    (Nota: profesionales no tiene ninguna policy de DELETE, es preexistente,
--    no relacionado a esta limpieza.)
--   select policyname, cmd from pg_policies where tablename = 'profesionales' order by cmd, policyname;
--
-- 3) Smoke test: una concesionaria logueada sigue viendo/editando sus autos
--    (Panel.jsx), y un profesional logueado sigue viendo/editando su perfil
--    (PanelProfesional.jsx). El catálogo público sigue mostrando autos
--    activos y profesionales aprobados+activos sin login.
-- ════════════════════════════════════════════════════════════════════════
