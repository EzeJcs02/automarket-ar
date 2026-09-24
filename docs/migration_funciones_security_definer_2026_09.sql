-- ════════════════════════════════════════════════════════════════════════
-- CERRAR FUNCIONES SECURITY DEFINER EXPUESTAS — FIORA MARKET — 2026-09-24
-- ════════════════════════════════════════════════════════════════════════
-- Ejecutar en el SQL editor de Supabase (proyecto kulnlwynzwdpqzyloljd).
--
-- MOTIVO (CRÍTICO, verificado en producción el 2026-09-24):
--   admin_eliminar_usuario(uuid) y incrementar_cupo_destacados(uuid, int)
--   son SECURITY DEFINER, no validan quién llama, y `anon` y `authenticated`
--   tenían EXECUTE (Supabase lo otorga por default; el REVOKE FROM PUBLIC
--   de migration_seguridad_2026_05.sql no alcanza). Cualquier visitante sin
--   login podía llamar /rest/v1/rpc/admin_eliminar_usuario y borrar
--   concesionarias, autos, consultas, favoritos y alertas de cualquier usuario,
--   o sumarse cupos de destacados sin pagar.
--
-- Los únicos llamadores legítimos usan SUPABASE_SERVICE_ROLE_KEY:
--   api/admin-actions.js (admin_eliminar_usuario)
--   api/mp-webhook.js    (incrementar_cupo_destacados)
-- incrementar_vistas se llama desde el cliente (AutoDetalle.jsx) y se deja
-- abierta a propósito: sólo suma 1 a `vistas`.
-- ════════════════════════════════════════════════════════════════════════

REVOKE EXECUTE ON FUNCTION public.admin_eliminar_usuario(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.incrementar_cupo_destacados(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_eliminar_usuario(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.incrementar_cupo_destacados(uuid, integer) TO service_role;

-- Defensa en profundidad: aunque vuelva a quedar expuesta, no hace nada sin service_role.
-- (search_path fijo: requisito de cualquier SECURITY DEFINER.)
CREATE OR REPLACE FUNCTION public.admin_eliminar_usuario(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE v_concs UUID[];
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'no autorizado' USING ERRCODE = '42501';
  END IF;

  SELECT array_agg(id) INTO v_concs FROM concesionarias WHERE user_id = p_user_id;

  DELETE FROM consultas WHERE concesionaria_id = ANY(v_concs);
  DELETE FROM autos WHERE concesionaria_id = ANY(v_concs) OR user_id = p_user_id;
  DELETE FROM concesionarias WHERE user_id = p_user_id;
  DELETE FROM profesionales WHERE user_id = p_user_id;
  DELETE FROM favoritos WHERE user_id = p_user_id;
  DELETE FROM alertas_busqueda WHERE user_id = p_user_id;

  RETURN jsonb_build_object('ok', true, 'user_id', p_user_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.incrementar_cupo_destacados(p_concesionaria_id uuid, cantidad integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'no autorizado' USING ERRCODE = '42501';
  END IF;

  UPDATE public.concesionarias
  SET cupos_destacados = COALESCE(cupos_destacados, 0) + cantidad
  WHERE id = p_concesionaria_id;
END;
$function$;

-- CREATE OR REPLACE conserva los grants, pero se re-aplican por las dudas.
REVOKE EXECUTE ON FUNCTION public.admin_eliminar_usuario(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.incrementar_cupo_destacados(uuid, integer) FROM PUBLIC, anon, authenticated;

-- ════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN (debe dar `false` en las 4 filas):
--   select p.proname, r.rolname, has_function_privilege(r.rolname, p.oid, 'EXECUTE')
--   from pg_proc p cross join (values ('anon'),('authenticated')) r(rolname)
--   where p.pronamespace = 'public'::regnamespace
--     and p.proname in ('admin_eliminar_usuario','incrementar_cupo_destacados');
-- ════════════════════════════════════════════════════════════════════════
