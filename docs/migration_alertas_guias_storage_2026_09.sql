-- ════════════════════════════════════════════════════════════════════════
-- ALERTAS, GUÍAS Y STORAGE — FIORA MARKET — 2026-09-24
-- ════════════════════════════════════════════════════════════════════════
-- Ejecutar en el SQL editor de Supabase (proyecto kulnlwynzwdpqzyloljd).
-- Hallazgos verificados en producción con pg_policies / storage.buckets:
--
-- 1) alertas_busqueda: la policy "propias" (ALL, user_id = auth.uid() OR
--    user_id IS NULL) dejaba a cualquier visitante sin login LEER, EDITAR y
--    BORRAR todas las alertas anónimas (con su email). Además 3 policies de
--    INSERT con check=true permitían suscribir cualquier email ajeno, y el
--    cron le manda un mail diario desde noreply@fioramarket.store.
--    → Crear alertas pasa a requerir cuenta, con el email de la propia cuenta.
--      (Catalogo.jsx se actualizó en el mismo cambio.)
--
-- 2) guias: "guias_auth_write" (ALL para cualquier authenticated) dejaba a
--    cualquier usuario registrado reescribir las guías del sitio, incluido el
--    link del botón. La app sólo las lee; se editan desde el dashboard.
--
-- 3) Storage fotos-autos: sin límite de tamaño ni de tipo → se podía subir
--    SVG/HTML o archivos enormes. Se limita a JPEG/PNG/WebP de hasta 10 MB.
--
-- 4) consultas: 4 policies INSERT idénticas (check=true). Se deja una.
-- ════════════════════════════════════════════════════════════════════════

-- ─── 1. alertas_busqueda ────────────────────────────────────────────────
DROP POLICY IF EXISTS "propias" ON alertas_busqueda;
DROP POLICY IF EXISTS "alertas_insert_anyone" ON alertas_busqueda;
DROP POLICY IF EXISTS "alertas_insert_public" ON alertas_busqueda;
DROP POLICY IF EXISTS "insert_publico" ON alertas_busqueda;

DROP POLICY IF EXISTS "alertas_insert_own" ON alertas_busqueda;
CREATE POLICY "alertas_insert_own" ON alertas_busqueda
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND lower(email) = lower(auth.jwt() ->> 'email'));

-- ─── 2. guias ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "guias_auth_write" ON guias;

-- ─── 3. Storage ─────────────────────────────────────────────────────────
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'],
    file_size_limit = 10485760
WHERE id = 'fotos-autos';

-- ─── 4. consultas (duplicados) ──────────────────────────────────────────
DROP POLICY IF EXISTS "Cualquiera puede enviar consulta" ON consultas;
DROP POLICY IF EXISTS "consultas_insert_public" ON consultas;
DROP POLICY IF EXISTS "cualquiera_puede_insertar" ON consultas;
-- queda "consultas_insert_anyone"

-- ════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN
--   select policyname, cmd, roles, qual, with_check from pg_policies
--   where tablename in ('alertas_busqueda','guias') order by 1;
--   -- alertas: sin "propias" ni inserts con check=true; guias: sólo guias_public_read
--   select id, file_size_limit, allowed_mime_types from storage.buckets where id = 'fotos-autos';
--
-- OPCIONAL (decisión del dueño): las alertas anónimas ya existentes
-- (user_id IS NULL) siguen recibiendo el mail diario. Para ver cuántas son:
--   select count(*), count(distinct email) from alertas_busqueda where user_id is null and activo;
-- ════════════════════════════════════════════════════════════════════════
