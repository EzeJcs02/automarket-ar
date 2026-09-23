# Runbook — Deploy de fixes de seguridad H-01 y H-02 en Supabase

Preparado el 2026-09-23. Cubre el despliegue de:
- `migration_lockdown_columnas_privilegiadas_2026_09.sql` (H-01 — bypass de pagos/auto-aprobación)
- `migration_rls_resenas_2026_09.sql` (H-02 — RLS de reseñas)

**No lo ejecuto yo mismo desde acá** — no tengo un conector a tu proyecto Supabase en esta sesión (ni credenciales para él). Este runbook te deja todo copy-paste listo para el **SQL Editor de Supabase**. Si preferís, lo hacemos juntos por el navegador (abro la página, vos confirmás cada paso).

**Proyecto:** `kulnlwynzwdpqzyloljd` → SQL Editor: https://supabase.com/dashboard/project/kulnlwynzwdpqzyloljd/sql/new

---

## 0. Antes de arrancar

- **Backup / snapshot:** Dashboard → *Database → Backups* (o `pg_dump` si tenés acceso directo). Todo lo de acá abajo es no-destructivo por diseño (no borra filas ni columnas), pero hacé el snapshot igual — es una migración de producción.
- Corré cada bloque **uno a la vez**, no todo el archivo de una — así podés leer el resultado antes de seguir.
- Si un paso da un resultado que no esperás, **parate y pegámelo** antes de seguir con el siguiente.

---

## PASO 1 — Diagnóstico (sólo lectura, no cambia nada)

Pegar y correr. Sirve para dos cosas: (a) confirmar que las columnas que asumí en el código existen con esos nombres exactos, y (b) ver si `migration_seguridad_2026_05.sql` ya estaba aplicada o no (RLS/policies/triggers existentes).

```sql
-- 1a. Columnas reales de las 4 tablas involucradas
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('autos', 'concesionarias', 'profesionales', 'resenas')
ORDER BY table_name, ordinal_position;

-- 1b. ¿RLS habilitado hoy en cada tabla?
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('autos', 'concesionarias', 'profesionales', 'resenas', 'pagos', 'pagos_rechazados', 'arrepentimientos');

-- 1c. Policies existentes
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('autos', 'concesionarias', 'profesionales', 'resenas')
ORDER BY tablename, cmd;

-- 1d. Triggers existentes
SELECT tgname, tgrelid::regclass AS tabla, tgenabled
FROM pg_trigger
WHERE tgname IN (
  'trg_concesionarias_unapproved', 'trg_profesionales_unapproved',
  'trg_autos_guard_privileged'
);
```

**Qué mirar en el resultado:**

| Verificás | Si ves esto → | Si NO lo ves → |
|---|---|---|
| 1a: `autos` tiene `destacado, urgente, fijado_home, destacado_expira_at, urgente_expira_at, created_at, renovado_at` | seguir tal cual | **avisame antes de correr el PASO 3** — hay que ajustar los nombres en el trigger |
| 1a: `concesionarias` tiene `aprobada, plan, destacada, banner_activo` | seguir tal cual | avisame — puede haber una columna de cupos (`cupos_destacados` u otra) que no vi documentada; hay que agregarla al trigger |
| 1a: `profesionales` tiene `aprobado, activo, verificado, plan, plan_vence_at` | seguir tal cual | avisame |
| 1a: `resenas` tiene `concesionaria_id, nombre, rating, comentario, user_id, created_at` | seguir tal cual | avisame |
| 1b: `rowsecurity = true` en `autos/concesionarias/profesionales` | `migration_seguridad_2026_05.sql` ya estaba aplicada → el PASO 2 es un no-op seguro | RLS nunca se habilitó → el PASO 2 es **necesario**, no opcional |
| 1b: `resenas` no aparece o `rowsecurity = false` | confirma H-02 tal cual lo audité | — |

---

## PASO 2 — (Re)aplicar la migración de seguridad base

Es la migración `docs/migration_seguridad_2026_05.sql` que ya existe en el repo desde mayo. **Es idempotente** (usa `IF NOT EXISTS` / `DROP ... IF EXISTS` en todo) — si ya estaba aplicada, correrla de nuevo no rompe nada, sólo confirma que sigue en pie. Si nunca se aplicó, es la que realmente habilita RLS en `autos/concesionarias/profesionales/pagos/...` — sin esto, el resto de la app queda con esas tablas completamente abiertas, algo peor que lo que estamos arreglando hoy.

→ Abrir `docs/migration_seguridad_2026_05.sql`, copiar todo el contenido, pegar en el SQL Editor, correr.

Confirmar al final con la query que trae el propio archivo:
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- autos, concesionarias, profesionales, favoritos, consultas, alertas_busqueda,
-- pagos, arrepentimientos, pagos_rechazados → todas deben dar rowsecurity = true
```

---

## PASO 3 — H-01: lockdown de columnas privilegiadas

→ Abrir `docs/migration_lockdown_columnas_privilegiadas_2026_09.sql`, copiar todo, pegar en el SQL Editor, correr.

(Si en el PASO 1 encontraste columnas distintas a las esperadas, avisame primero — ajusto el archivo antes de que lo corras.)

Verificación:
```sql
SELECT tgname, tgrelid::regclass AS tabla, tgenabled
FROM pg_trigger
WHERE tgname IN (
  'trg_autos_guard_privileged',
  'trg_concesionarias_unapproved',
  'trg_profesionales_unapproved'
);
-- 3 filas, tgenabled = 'O' (enabled)
```

---

## PASO 4 — H-02: RLS de reseñas

→ Abrir `docs/migration_rls_resenas_2026_09.sql`, copiar todo, pegar en el SQL Editor, correr.

Verificación:
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'resenas';
-- rowsecurity = true

SELECT policyname, cmd FROM pg_policies WHERE tablename = 'resenas';
-- sólo resenas_select_public (SELECT) y resenas_insert_anyone (INSERT) — sin UPDATE/DELETE
```

---

## PASO 5 — Prueba de que el bypass ya NO funciona

Necesitás el `id` de un auto/concesionaria/profesional real de prueba (los tuyos, no los de un usuario real). Corré esto **logueado como ese usuario dueño** (no como `postgres`/`service_role` — si lo corrés desde el SQL Editor con el rol admin, va a pasar igual porque el editor usa un rol con más privilegios). La forma más simple de probarlo de verdad es **desde la consola del navegador, logueado en la app como ese usuario**:

```js
// 1) Debería fallar en silencio (RLS ya lo bloqueaba, sin cambios acá)
await supabase.from('concesionarias').update({ aprobada: true, plan: 'premium' }).eq('id', MI_CONCESIONARIA_ID)

// 2) Antes del fix esto SÍ prendía destacado gratis. Ahora, aunque el UPDATE
//    "funcione" (no tira error — el trigger no rechaza, sólo ignora el cambio),
//    el valor de destacado NO debe haber cambiado:
await supabase.from('autos').update({ destacado: true }).eq('id', MI_AUTO_ID)
const { data } = await supabase.from('autos').select('destacado').eq('id', MI_AUTO_ID).single()
console.log(data.destacado) // debe seguir en false (o lo que estaba antes)
```

## PASO 6 — Smoke test de que la app real sigue funcionando

- **Panel de concesionaria** → activar un ⭐ Destacado dentro del cupo del plan → debe seguir funcionando (ahora pasa por `/api/boost-toggle`).
- **Pagar un boost individual** con MercadoPago (sandbox si tenés uno configurado) → el webhook debe seguir acreditándolo.
- **Admin** (`/admin`) → aprobar una concesionaria nueva, cambiar un plan → debe seguir funcionando (usa `service_role`).
- **Dejar una reseña** en `/concesionaria/:id` → debe seguir funcionando; probar también con un comentario de más de 2000 caracteres → ahora debe mostrar el mensaje de error en vez de "¡Gracias por tu reseña!" falso.

---

## Rollback (si algo se rompe)

Cada pieza se puede desactivar individualmente sin tocar código de la app (vuelve al estado *previo a hoy*, no al estado 100% seguro):

```sql
-- Deshace el lockdown de H-01 (vuelve a permitir auto-aprobación/boosts gratis)
DROP TRIGGER IF EXISTS trg_autos_guard_privileged ON autos;
-- (dejar trg_concesionarias_unapproved / trg_profesionales_unapproved con su
--  versión anterior requeriría restaurar la función original — mejor pedime
--  que te prepare el rollback puntual si llegás a necesitarlo)

-- Deshace H-02 (vuelve resenas a sin RLS — no recomendado, sólo si algo rompe)
ALTER TABLE resenas DISABLE ROW LEVEL SECURITY;
```
