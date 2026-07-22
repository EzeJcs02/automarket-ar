-- ════════════════════════════════════════════════════════════════════════
-- IDEMPOTENCIA DE PAGOS — FIORA MARKET — 2026-07
-- ════════════════════════════════════════════════════════════════════════
-- IMPORTANTE: revisar cada bloque antes de ejecutar. Hacer backup antes.
-- Ejecutar en el SQL editor de Supabase (con role postgres / service_role).
--
-- Motivo: MercadoPago puede reintentar la entrega del mismo webhook.
-- api/mp-webhook.js sólo chequeaba "¿ya existe un pago con este
-- mp_payment_id?" (SELECT) antes de aplicar los efectos (boost, plan, etc)
-- y recién insertaba el registro en `pagos` al final. Dos entregas casi
-- simultáneas del mismo pago podían pasar ambas ese SELECT antes de que
-- cualquiera insertara, y las dos terminar aplicando el efecto — acreditando
-- dos veces un solo pago real. El código ya se movió para insertar en
-- `pagos` antes de aplicar cualquier efecto secundario; esta migración
-- agrega la restricción que hace que esa inserción sea realmente atómica.
-- ════════════════════════════════════════════════════════════════════════

-- NOTA (2026-07): al correr esto se descubrió que la restricción UNIQUE ya
-- existía en la tabla (error 42P07 "relation pagos_mp_payment_id_key already
-- exists" al intentar crearla). O sea que este paso ya estaba hecho desde
-- antes — no hace falta ejecutar el ALTER TABLE. Se deja comentado como
-- referencia, y se agrega la query de verificación para confirmarlo.

-- 1. Verificar que no haya duplicados hoy (informativo — si la restricción ya
--    existe, esto siempre debería devolver 0 filas).
SELECT mp_payment_id, COUNT(*)
FROM pagos
GROUP BY mp_payment_id
HAVING COUNT(*) > 1;

-- 2. Ya NO hace falta correr esto — la restricción ya existe:
-- ALTER TABLE pagos ADD CONSTRAINT pagos_mp_payment_id_key UNIQUE (mp_payment_id);

-- 3. Confirmar que la restricción existente es realmente UNIQUE sobre
--    mp_payment_id (y no, por ejemplo, un índice no-único con nombre parecido):
SELECT conname, contype, pg_get_constraintdef(oid) AS definicion
FROM pg_constraint
WHERE conrelid = 'pagos'::regclass AND conname = 'pagos_mp_payment_id_key';
-- contype debe ser 'u' (unique) y definicion debe decir "UNIQUE (mp_payment_id)".
