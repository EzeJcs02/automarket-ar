-- ════════════════════════════════════════════════════════════════════════
-- RLS DE RESEÑAS — FIORA MARKET — 2026-09
-- ════════════════════════════════════════════════════════════════════════
-- IMPORTANTE: revisar cada bloque antes de ejecutar. Hacer backup antes.
-- Ejecutar en el SQL editor de Supabase (con role postgres / service_role).
--
-- MOTIVO (hallazgo H-02 de la auditoría de seguridad 2026-09-23):
-- La tabla `resenas` (usada en src/pages/Concesionarias.jsx para las
-- reseñas públicas de cada concesionaria) no aparece en ninguna migración
-- de RLS del repo. Si nunca se habilitó Row Level Security sobre ella,
-- Postgres aplica los GRANTs de tabla por defecto de Supabase — lo que en
-- la práctica significa que cualquier usuario (incluso anónimo) podría no
-- sólo insertar reseñas sin límite, sino también UPDATE/DELETE de
-- reseñas ajenas directo con la anon key (nadie lo modera: no hay ninguna
-- pantalla de admin para reseñas). Tampoco hay validación de servidor
-- sobre `rating` (se puede mandar cualquier número, no sólo 1-5) ni límite
-- de longitud de `nombre`/`comentario`.
--
-- FIX: habilitar RLS con policies mínimas — lectura pública (son reseñas
-- públicas, como hoy), inserción abierta pero validada (mismo compor-
-- tamiento actual: cualquiera puede dejar una reseña, con o sin sesión),
-- y CERO políticas de UPDATE/DELETE para anon/authenticated → sólo
-- service_role puede editar/borrar (moderación futura desde un endpoint
-- admin, si se agrega).
--
-- ACTUALIZADO tras correr el PASO 1 del runbook (ver
-- docs/RUNBOOK_deploy_seguridad_2026_09.md) contra la DB real: `resenas` YA
-- tenía RLS habilitada, con dos políticas llamadas literalmente "insert all"
-- (INSERT) y "public read" (SELECT) — sin ninguna de UPDATE/DELETE, así que
-- la parte más grave que se había señalado como riesgo potencial (editar o
-- borrar reseñas ajenas) NO estaba pasando en la práctica. Pero esos
-- nombres no coinciden con los que este archivo asumía al principio
-- (resenas_insert_anyone / resenas_select_public) — si el DROP POLICY no
-- apunta a los nombres reales, la política vieja sin validar queda viva en
-- paralelo a la nueva, y como Postgres combina políticas permisivas del
-- mismo comando con OR, la vieja (probablemente WITH CHECK (true), sin
-- exigir concesionaria aprobada ni validar user_id) anula por completo la
-- validación que agrega esta migración. Se corrigieron los DROP POLICY para
-- apuntar a los nombres reales.
-- ════════════════════════════════════════════════════════════════════════


-- ─── 0. Verificación previa: confirmar columnas reales antes de correr ───
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'resenas'
ORDER BY ordinal_position;

-- Confirmar si RLS ya estaba habilitado (si `rowsecurity` ya es `true`,
-- este script es idempotente igual — CREATE POLICY usa DROP POLICY IF
-- EXISTS antes, así que no rompe nada si ya existían policies).
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'resenas';


-- ─── 1. Integridad de datos — válido para CUALQUIER origen (incluye service_role) ─
-- CHECK constraints (a diferencia de RLS) no se pueden saltear ni con la
-- service_role key: protegen contra ratings fuera de rango o texto
-- desmedido sin importar quién escriba.
ALTER TABLE resenas
  DROP CONSTRAINT IF EXISTS resenas_rating_valido,
  ADD  CONSTRAINT resenas_rating_valido CHECK (rating BETWEEN 1 AND 5);

ALTER TABLE resenas
  DROP CONSTRAINT IF EXISTS resenas_nombre_valido,
  ADD  CONSTRAINT resenas_nombre_valido
    CHECK (nombre IS NOT NULL AND char_length(btrim(nombre)) BETWEEN 1 AND 200);

ALTER TABLE resenas
  DROP CONSTRAINT IF EXISTS resenas_comentario_valido,
  ADD  CONSTRAINT resenas_comentario_valido
    CHECK (comentario IS NOT NULL AND char_length(btrim(comentario)) BETWEEN 1 AND 2000);


-- ─── 2. RLS ────────────────────────────────────────────────────────────
ALTER TABLE resenas ENABLE ROW LEVEL SECURITY;

-- Lectura pública — mismo comportamiento actual (cualquiera ve las reseñas).
-- Se borran las policies reales existentes ("public read") además del
-- nombre nuevo, para no dejar dos policies de SELECT en paralelo.
DROP POLICY IF EXISTS "public read" ON resenas;
DROP POLICY IF EXISTS "resenas_select_public" ON resenas;
CREATE POLICY "resenas_select_public" ON resenas
  FOR SELECT USING (true);

-- Inserción abierta (con o sin sesión, igual que hoy) pero:
--   - sólo sobre concesionarias ya aprobadas (no se puede reseñar algo
--     que ni siquiera pasó la moderación del admin);
--   - si se manda user_id, tiene que ser el del usuario logueado
--     (no se puede insertar una reseña "a nombre de" otro user_id ajeno).
-- IMPORTANTE: se borra la policy real existente ("insert all") — si sigue
-- viva en paralelo a la nueva, anula toda la validación de abajo (Postgres
-- combina policies permisivas del mismo comando con OR).
DROP POLICY IF EXISTS "insert all" ON resenas;
DROP POLICY IF EXISTS "resenas_insert_anyone" ON resenas;
CREATE POLICY "resenas_insert_anyone" ON resenas
  FOR INSERT WITH CHECK (
    concesionaria_id IN (SELECT id FROM concesionarias WHERE aprobada = true)
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- Sin policy de UPDATE ni de DELETE para anon/authenticated a propósito:
-- nadie (ni siquiera el autor) puede editar o borrar una reseña ya
-- publicada desde el cliente. Sólo service_role (bypassa RLS) — para
-- moderación futura desde un endpoint admin, si se necesita.


-- ════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN POST-MIGRACIÓN
-- ════════════════════════════════════════════════════════════════════════
--   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'resenas';
--   -- debe dar rowsecurity = true
--
--   SELECT policyname, cmd FROM pg_policies WHERE tablename = 'resenas';
--   -- debe listar sólo resenas_select_public (SELECT) y resenas_insert_anyone (INSERT)
--
-- Simular como usuario común (no postgres/service_role):
--   insert into resenas (concesionaria_id, nombre, rating, comentario)
--   values ('<concesionaria NO aprobada>', 'x', 5, 'test');
--   → debe fallar (RLS).
--
--   insert into resenas (concesionaria_id, nombre, rating, comentario)
--   values ('<concesionaria aprobada>', 'x', 99, 'test');
--   → debe fallar (CHECK resenas_rating_valido).
--
--   update resenas set comentario = 'hackeado' where id = '<reseña ajena>';
--   → debe afectar 0 filas (sin policy de UPDATE).
--
--   delete from resenas where id = '<reseña ajena>';
--   → debe afectar 0 filas (sin policy de DELETE).
-- ════════════════════════════════════════════════════════════════════════
