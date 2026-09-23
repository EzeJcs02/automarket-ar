-- ════════════════════════════════════════════════════════════════════════
-- LOCKDOWN DE COLUMNAS PRIVILEGIADAS — FIORA MARKET — 2026-09
-- ════════════════════════════════════════════════════════════════════════
-- IMPORTANTE: revisar cada bloque antes de ejecutar. Hacer backup antes.
-- Ejecutar en el SQL editor de Supabase (con role postgres / service_role).
--
-- ACTUALIZADO tras correr el PASO 1 del runbook contra la DB real (ver
-- docs/RUNBOOK_deploy_seguridad_2026_09.md): `concesionarias` tiene además
-- `cupos_destacados` y `limite_vehiculos` (integer) — no documentadas en
-- ningún archivo del repo, no leídas ni escritas desde src/ ni api/ salvo
-- el RPC `incrementar_cupo_destacados` (pack_destacados_10, service_role).
-- Se agregan al guard igual: son columnas de monetización/límite de plan y
-- hoy nadie las usa desde el cliente, así que no hay ningún flujo legítimo
-- que romper — mejor cerrarlas ya que dejar el hueco latente.
--
-- MOTIVO (hallazgo H-01 de la auditoría de seguridad 2026-09-23):
-- Las políticas RLS de UPDATE en autos/concesionarias/profesionales
-- (rls_policies.sql, migration_seguridad_2026_05.sql) permiten al dueño de
-- una fila actualizar CUALQUIER columna, sin distinguir "mis datos de
-- perfil" de "flags que sólo debería poder setear el pago vía MercadoPago
-- (mp-webhook) o la aprobación del admin (admin-actions)". El propio
-- frontend hace `supabase.from('autos').update({ destacado: true })` con
-- la anon key (src/pages/Panel.jsx toggleDestacado/toggleUrgente) — lo que
-- confirma que hoy cualquier usuario autenticado puede:
--   - autos: prenderse destacado/urgente/fijado_home gratis e ilimitado,
--     "resucitar" el tope (created_at) o la renovación (renovado_at) sin
--     pagar, y evadir la expiración del cron.
--   - concesionarias: auto-aprobarse (aprobada), ponerse un plan pago
--     gratis (plan), auto-destacarse (destacada) y prenderse el banner de
--     home (banner_activo) sin pasar por el webhook de MP ni por el admin.
--   - profesionales: auto-aprobarse (aprobado/activo), auto-verificarse
--     (verificado — insignia de confianza hacia compradores) y ponerse
--     plan pago gratis (plan/plan_vence_at).
--
-- FIX: en vez de reescribir las políticas RLS existentes (riesgo de romper
-- algo no documentado), se agrega un trigger BEFORE INSERT OR UPDATE por
-- tabla que PISA esas columnas específicas al valor anterior (UPDATE) o a
-- un default seguro (INSERT) — salvo que quien escribe sea `service_role`
-- (mp-webhook.js, admin-actions.js, cron-expire-boosts.js, y el nuevo
-- api/boost-toggle.js siguen funcionando sin cambios, porque usan la
-- SERVICE_ROLE_KEY). auth.role() devuelve 'service_role' sólo para esas
-- llamadas; para 'authenticated'/'anon' el trigger bloquea el cambio.
--
-- Sigue el mismo patrón que los triggers ya existentes
-- (force_unapproved_on_insert / force_unapproved_prof_on_insert) en
-- migration_seguridad_2026_05.sql — sólo se extiende para cubrir también
-- UPDATE, y se agrega el equivalente para `autos` (que no tenía ninguno).
-- ════════════════════════════════════════════════════════════════════════


-- ─── 0. Verificación previa: confirmar nombres de columna antes de correr ─
-- Si alguna tabla tiene columnas adicionales de negocio/pago que no están
-- en la lista de abajo (ej. un `cupos_destacados` en concesionarias para
-- pack_destacados_10), agregarlas al trigger correspondiente antes de
-- ejecutar el resto de este archivo.
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('autos', 'concesionarias', 'profesionales')
ORDER BY table_name, ordinal_position;


-- ─── 1. autos: destacado/urgente/fijado_home/expiraciones/tope/renovación ─
CREATE OR REPLACE FUNCTION guard_autos_privileged_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW; -- mp-webhook / admin-actions / cron-expire-boosts / boost-toggle
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.destacado := false;
    NEW.urgente := false;
    NEW.fijado_home := false;
    NEW.destacado_expira_at := NULL;
    NEW.urgente_expira_at := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.destacado := OLD.destacado;
    NEW.urgente := OLD.urgente;
    NEW.fijado_home := OLD.fijado_home;
    NEW.destacado_expira_at := OLD.destacado_expira_at;
    NEW.urgente_expira_at := OLD.urgente_expira_at;
    NEW.created_at := OLD.created_at;   -- evita "subir_tope"/"renovar" gratis
    NEW.renovado_at := OLD.renovado_at; -- evita resetear el contador de 30 días gratis
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_autos_guard_privileged ON autos;
CREATE TRIGGER trg_autos_guard_privileged
  BEFORE INSERT OR UPDATE ON autos
  FOR EACH ROW EXECUTE FUNCTION guard_autos_privileged_columns();


-- ─── 2. concesionarias: extiende el trigger existente para cubrir UPDATE ──
-- (antes sólo forzaba aprobada=false en INSERT; el resto de columnas
-- privilegiadas quedaba sin ninguna protección, ni en INSERT ni en UPDATE)
CREATE OR REPLACE FUNCTION force_unapproved_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW; -- admin-actions (aprobar/rechazar/suspender/cambiarPlan/toggleDestacada/toggleBanner)
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.aprobada := false; -- comportamiento existente, sin cambios
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.aprobada := OLD.aprobada;
    NEW.plan := OLD.plan;
    NEW.destacada := OLD.destacada;
    NEW.banner_activo := OLD.banner_activo;
    NEW.cupos_destacados := OLD.cupos_destacados; -- sólo lo suma incrementar_cupo_destacados (RPC, service_role)
    NEW.limite_vehiculos := OLD.limite_vehiculos;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_concesionarias_unapproved ON concesionarias;
CREATE TRIGGER trg_concesionarias_unapproved
  BEFORE INSERT OR UPDATE ON concesionarias
  FOR EACH ROW EXECUTE FUNCTION force_unapproved_on_insert();


-- ─── 3. profesionales: extiende el trigger existente para cubrir UPDATE ───
CREATE OR REPLACE FUNCTION force_unapproved_prof_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW; -- admin-actions (aprobarProfesional/suspenderProfesional/toggleVerificado/toggleDestacado)
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.aprobado := false; -- comportamiento existente, sin cambios
    NEW.activo := false;   -- comportamiento existente, sin cambios
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.aprobado := OLD.aprobado;
    NEW.activo := OLD.activo;
    NEW.verificado := OLD.verificado;
    NEW.destacado := OLD.destacado;
    NEW.plan := OLD.plan;
    NEW.plan_vence_at := OLD.plan_vence_at;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profesionales_unapproved ON profesionales;
CREATE TRIGGER trg_profesionales_unapproved
  BEFORE INSERT OR UPDATE ON profesionales
  FOR EACH ROW EXECUTE FUNCTION force_unapproved_prof_on_insert();


-- ════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN POST-MIGRACIÓN
-- ════════════════════════════════════════════════════════════════════════
-- Simular, como un usuario común (no como postgres/service_role), que:
--   update autos set destacado = true where id = '<un auto propio>';
-- → debe ejecutar sin error pero la columna NO cambia (queda en el valor
--   anterior). Confirmarlo con un SELECT posterior.
--
-- Lo mismo para:
--   update concesionarias set aprobada = true, plan = 'premium', cupos_destacados = 999, limite_vehiculos = 999 where id = '<propia>';
--   update profesionales set aprobado = true, verificado = true where id = '<propio>';
--
-- Y confirmar que el flujo real sigue funcionando:
--   - Pagar un boost individual vía MercadoPago → mp-webhook (service_role)
--     sigue pudiendo setear destacado/urgente/expira_at normalmente.
--   - El admin sigue pudiendo aprobar/suspender/cambiar plan desde /admin
--     (admin-actions.js usa service_role).
--   - Panel de concesionaria: activar un destacado dentro del cupo del
--     plan ahora pasa por POST /api/boost-toggle (ver api/boost-toggle.js)
--     en vez de escribir directo — debe seguir funcionando igual para el
--     usuario, sólo que la validación de cupo ahora es también server-side.
--
--   SELECT tgname, tgrelid::regclass, tgenabled
--   FROM pg_trigger
--   WHERE tgname IN (
--     'trg_autos_guard_privileged',
--     'trg_concesionarias_unapproved',
--     'trg_profesionales_unapproved'
--   );
-- ════════════════════════════════════════════════════════════════════════
