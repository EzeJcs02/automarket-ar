-- ════════════════════════════════════════════════════════════════════════
-- AUTOS DE CONCESIONARIAS NO APROBADAS NO PUEDEN QUEDAR ACTIVOS — 2026-09-24
-- ════════════════════════════════════════════════════════════════════════
-- Ejecutar en el SQL editor de Supabase (proyecto kulnlwynzwdpqzyloljd).
--
-- MOTIVO: el panel no mira `concesionarias.aprobada`. Una concesionaria
-- pendiente de aprobación publicaba autos con activo = true (visibles en el
-- catálogo por la policy autos_select_public), y una suspendida por el admin
-- podía "Reactivar" sus autos y deshacer la suspensión.
--
-- Fix: trigger que fuerza activo = false si el auto es de una concesionaria
-- no aprobada. No aplica a service_role (/api/admin-actions reactiva los autos
-- al aprobar, y lo hace después de marcar aprobada = true).
-- Los autos de particulares (concesionaria_id IS NULL) no se tocan.
-- ════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.autos_solo_concesionarias_aprobadas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF coalesce(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF NEW.concesionaria_id IS NOT NULL AND NEW.activo IS TRUE AND NOT EXISTS (
    SELECT 1 FROM concesionarias WHERE id = NEW.concesionaria_id AND aprobada IS TRUE
  ) THEN
    NEW.activo := false;
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.autos_solo_concesionarias_aprobadas() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_autos_solo_aprobadas ON autos;
CREATE TRIGGER trg_autos_solo_aprobadas
  BEFORE INSERT OR UPDATE OF activo, concesionaria_id ON autos
  FOR EACH ROW EXECUTE FUNCTION public.autos_solo_concesionarias_aprobadas();

-- ════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN (sólo lectura): autos activos hoy de concesionarias no aprobadas.
-- Si da > 0, son publicaciones que se colaron antes del fix; se pueden pausar
-- con el UPDATE comentado de abajo.
--   select a.id, a.marca, a.modelo, c.nombre
--   from autos a join concesionarias c on c.id = a.concesionaria_id
--   where a.activo and not c.aprobada;
--
-- update autos a set activo = false from concesionarias c
-- where c.id = a.concesionaria_id and a.activo and not c.aprobada;
-- ════════════════════════════════════════════════════════════════════════
