-- ════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN DE SEGURIDAD — FIORA MARKET — 2026-05
-- ════════════════════════════════════════════════════════════════════════
-- IMPORTANTE: revisar cada bloque antes de ejecutar. Hacer backup antes.
-- Ejecutar en el SQL editor de Supabase (con role postgres / service_role).
-- ════════════════════════════════════════════════════════════════════════

-- ─── 1. Tabla pagos_rechazados ──────────────────────────────────────────
-- Para auditar pagos cobrados por MP que fueron rechazados por el webhook
-- (fraude de monto, ownership mismatch, auto inexistente, tipo desconocido).
CREATE TABLE IF NOT EXISTS pagos_rechazados (
  id              BIGSERIAL PRIMARY KEY,
  mp_payment_id   TEXT NOT NULL,
  tipo            TEXT,
  motivo          TEXT NOT NULL,
  monto           NUMERIC,
  metadata        JSONB,
  payer_email     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pagos_rechazados_mp ON pagos_rechazados(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_pagos_rechazados_created ON pagos_rechazados(created_at DESC);

-- Sólo el service_role puede leer/escribir. RLS habilitado, sin policies = nadie del lado client.
ALTER TABLE pagos_rechazados ENABLE ROW LEVEL SECURITY;


-- ─── 2. Trigger para forzar aprobada=false / aprobado=false ─────────────
-- El cliente puede mandar lo que quiera en el INSERT; este trigger los pisa.
CREATE OR REPLACE FUNCTION force_unapproved_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  NEW.aprobada := false;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_concesionarias_unapproved ON concesionarias;
CREATE TRIGGER trg_concesionarias_unapproved
  BEFORE INSERT ON concesionarias
  FOR EACH ROW EXECUTE FUNCTION force_unapproved_on_insert();

CREATE OR REPLACE FUNCTION force_unapproved_prof_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  NEW.aprobado := false;
  NEW.activo := false;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profesionales_unapproved ON profesionales;
CREATE TRIGGER trg_profesionales_unapproved
  BEFORE INSERT ON profesionales
  FOR EACH ROW EXECUTE FUNCTION force_unapproved_prof_on_insert();


-- ─── 3. RLS completo en TODAS las tablas críticas ───────────────────────
-- IMPORTANTE: si ya tenés políticas, revisar para no duplicar/conflictuar.

-- ── concesionarias ──
ALTER TABLE concesionarias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "concesionarias_select_public" ON concesionarias;
CREATE POLICY "concesionarias_select_public" ON concesionarias
  FOR SELECT USING (aprobada = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "concesionarias_insert_own" ON concesionarias;
CREATE POLICY "concesionarias_insert_own" ON concesionarias
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "concesionarias_update_own" ON concesionarias;
CREATE POLICY "concesionarias_update_own" ON concesionarias
  FOR UPDATE USING (auth.uid() = user_id);

-- ── profesionales ──
ALTER TABLE profesionales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profesionales_select_public" ON profesionales;
CREATE POLICY "profesionales_select_public" ON profesionales
  FOR SELECT USING (aprobado = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "profesionales_insert_own" ON profesionales;
CREATE POLICY "profesionales_insert_own" ON profesionales
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "profesionales_update_own" ON profesionales;
CREATE POLICY "profesionales_update_own" ON profesionales
  FOR UPDATE USING (auth.uid() = user_id);

-- ── autos ──
ALTER TABLE autos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "autos_select_public" ON autos;
CREATE POLICY "autos_select_public" ON autos
  FOR SELECT USING (
    activo = true
    OR auth.uid() = user_id
    OR concesionaria_id IN (SELECT id FROM concesionarias WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "autos_insert_own" ON autos;
CREATE POLICY "autos_insert_own" ON autos
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR concesionaria_id IN (SELECT id FROM concesionarias WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "autos_update_own" ON autos;
CREATE POLICY "autos_update_own" ON autos
  FOR UPDATE USING (
    auth.uid() = user_id
    OR concesionaria_id IN (SELECT id FROM concesionarias WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "autos_delete_own" ON autos;
CREATE POLICY "autos_delete_own" ON autos
  FOR DELETE USING (
    auth.uid() = user_id
    OR concesionaria_id IN (SELECT id FROM concesionarias WHERE user_id = auth.uid())
  );

-- ── favoritos ──
ALTER TABLE favoritos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "favoritos_own" ON favoritos;
CREATE POLICY "favoritos_own" ON favoritos
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── consultas ──
ALTER TABLE consultas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consultas_insert_anyone" ON consultas;
-- Cualquiera (incluso anónimo) puede crear una consulta sobre un auto activo
CREATE POLICY "consultas_insert_anyone" ON consultas
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "consultas_select_owner" ON consultas;
CREATE POLICY "consultas_select_owner" ON consultas
  FOR SELECT USING (
    concesionaria_id IN (SELECT id FROM concesionarias WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "consultas_update_owner" ON consultas;
CREATE POLICY "consultas_update_owner" ON consultas
  FOR UPDATE USING (
    concesionaria_id IN (SELECT id FROM concesionarias WHERE user_id = auth.uid())
  );

-- ── alertas_busqueda ──
ALTER TABLE alertas_busqueda ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "alertas_insert_anyone" ON alertas_busqueda;
CREATE POLICY "alertas_insert_anyone" ON alertas_busqueda
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "alertas_select_own" ON alertas_busqueda;
CREATE POLICY "alertas_select_own" ON alertas_busqueda
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "alertas_delete_own" ON alertas_busqueda;
CREATE POLICY "alertas_delete_own" ON alertas_busqueda
  FOR DELETE USING (auth.uid() = user_id);

-- ── pagos ──
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pagos_select_owner" ON pagos;
CREATE POLICY "pagos_select_owner" ON pagos
  FOR SELECT USING (
    auth.uid() = user_id
    OR concesionaria_id IN (SELECT id FROM concesionarias WHERE user_id = auth.uid())
    OR profesional_id IN (SELECT id FROM profesionales WHERE user_id = auth.uid())
  );
-- No hay INSERT policy: sólo el service_role (vía mp-webhook) puede insertar.

-- ── arrepentimientos ──
ALTER TABLE arrepentimientos ENABLE ROW LEVEL SECURITY;
-- Sólo service_role escribe (vía /api/arrepentimiento). El usuario lee la suya.
DROP POLICY IF EXISTS "arrepentimientos_select_own" ON arrepentimientos;
CREATE POLICY "arrepentimientos_select_own" ON arrepentimientos
  FOR SELECT USING (auth.uid() = user_id);


-- ─── 4. Función transaccional para eliminar usuario ─────────────────────
-- Reemplaza el bucle JS de admin-actions.js por una sola transacción.
-- Después de aplicar, podés cambiar admin-actions.js para llamar a esta función
-- en vez del bucle manual.
CREATE OR REPLACE FUNCTION admin_eliminar_usuario(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_concs UUID[];
BEGIN
  -- Recolectar concesionarias del user
  SELECT array_agg(id) INTO v_concs FROM concesionarias WHERE user_id = p_user_id;

  -- Borrado en cascada (todo o nada por la transacción implícita)
  DELETE FROM consultas WHERE concesionaria_id = ANY(v_concs);
  DELETE FROM autos WHERE concesionaria_id = ANY(v_concs) OR user_id = p_user_id;
  DELETE FROM concesionarias WHERE user_id = p_user_id;
  DELETE FROM profesionales WHERE user_id = p_user_id;
  DELETE FROM favoritos WHERE user_id = p_user_id;
  DELETE FROM alertas_busqueda WHERE user_id = p_user_id;
  -- auth.users debe borrarse con supabase.auth.admin.deleteUser DESPUÉS de esto

  RETURN jsonb_build_object('ok', true, 'user_id', p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION admin_eliminar_usuario(UUID) FROM PUBLIC;
-- Sólo el service_role (que es quien llama desde admin-actions) puede ejecutar.


-- ─── 5. Columna renovado_at en autos (si no existe) ─────────────────────
ALTER TABLE autos ADD COLUMN IF NOT EXISTS renovado_at TIMESTAMPTZ DEFAULT now();
UPDATE autos SET renovado_at = created_at WHERE renovado_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_autos_renovado ON autos(renovado_at) WHERE activo = true AND concesionaria_id IS NULL;


-- ─── 6. Tabla alertas_enviadas (si no existe) ───────────────────────────
CREATE TABLE IF NOT EXISTS alertas_enviadas (
  id          BIGSERIAL PRIMARY KEY,
  alerta_id   UUID NOT NULL REFERENCES alertas_busqueda(id) ON DELETE CASCADE,
  auto_id     UUID NOT NULL,
  enviado_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (alerta_id, auto_id)
);
CREATE INDEX IF NOT EXISTS idx_alertas_enviadas_alerta ON alertas_enviadas(alerta_id);
CREATE INDEX IF NOT EXISTS idx_alertas_activo ON alertas_busqueda(activo) WHERE activo = true;


-- ════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN POST-MIGRACIÓN
-- ════════════════════════════════════════════════════════════════════════
-- Después de correr todo, ejecutar para chequear:
--
--   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
--   -- Todas las tablas críticas deben tener rowsecurity = true.
--
--   SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname='public' ORDER BY tablename;
--   -- Listado completo de políticas activas.
-- ════════════════════════════════════════════════════════════════════════
