# Fiora Market (automarket-ar)

Marketplace de vehículos (autos, motos, náutica) para Argentina. SPA en React + Vite, con un backend de funciones serverless en `api/` (Vercel), Supabase como base de datos/auth, y MercadoPago para pagos.

Producción: [fioramarket.store](https://fioramarket.store)

## Stack

- **Frontend**: React 19 + Vite, React Router 7, sin SSR.
- **Backend**: funciones serverless en `api/` (Vercel Functions).
- **Base de datos / auth**: Supabase (Postgres + RLS + Auth).
- **Pagos**: MercadoPago (Checkout Pro + webhook).
- **Emails transaccionales**: Resend.
- **Rate limiting**: Upstash Redis (`api/_lib/ratelimit.js`).

## Desarrollo local

```bash
npm install
cp .env.local.example .env.local   # completar con tus credenciales
npm run dev
```

Scripts disponibles:

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo (Vite), puerto 5173 |
| `npm run build` | Build de producción a `dist/` |
| `npm run preview` | Sirve el build de `dist/` localmente |
| `npm run lint` | ESLint sobre todo el repo |
| `npm test` | Corre los tests (Vitest) una vez |
| `npm run test:watch` | Tests en modo watch |

## Variables de entorno

Ver `.env.local.example` para la lista completa. Resumen:

- **Frontend** (prefijo `VITE_`, van al bundle público): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ADMIN_EMAIL` (solo oculta la UI de admin, no es control de acceso — eso vive server-side).
- **Backend** (solo en funciones de `api/`, nunca al cliente): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `RESEND_API_KEY`, `ADMIN_EMAIL`, `CRON_SECRET`, `UNSUBSCRIBE_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `APP_URL`.

## Estructura

```
src/            SPA de React (páginas, componentes, contexto, libs)
api/            Funciones serverless (Vercel) — pagos, emails, cron, admin
docs/           Migraciones SQL, políticas RLS, documentación técnica
```

## Base de datos

El esquema vive en Supabase; no hay migraciones versionadas automáticas. Los cambios de schema se documentan como archivos `.sql` sueltos en `docs/` (ver `docs/rls_policies.sql` para las políticas de Row Level Security vigentes). Al agregar un cambio de schema, sumar un nuevo archivo `docs/migration_<algo>_<fecha>.sql` con instrucciones de qué correr en el SQL editor de Supabase.

## Despliegue

Vercel, con cron jobs configurados en `vercel.json` (expiración de boosts, envío de alertas de búsqueda).
