# Bot de control de gastos (Yape / Plin)

Bot de Telegram personal: le envías la captura de un voucher de Yape o Plin (con una descripción opcional en el texto de la foto), Gemini extrae los datos y se guardan en Cloudflare D1.

**Comandos:** `/hoy`, `/semana`, `/mes` (totales de egresos e ingresos) y `/deshacer` (borra el último registro).

**Stack:** Cloudflare Workers + D1, grammY, Gemini API (REST). Detalle completo en [PLAN.md](PLAN.md).

## Requisitos

- Node.js 20 o superior
- Sesión de Cloudflare: `npx wrangler login`
- Archivo `.dev.vars` en la raíz (no se sube a git):

```
TELEGRAM_BOT_TOKEN=...
TELEGRAM_WEBHOOK_SECRET=...
GEMINI_API_KEY=...
ALLOWED_CHAT_ID=...
WEBHOOK_URL=https://expense-tracking-bot.<subdominio>.workers.dev
```

## Flujo para hacer un cambio

Subir a GitHub **no** actualiza el bot: el deploy a Cloudflare es un paso aparte.

```
1. Editar el código en src/
2. npm run typecheck    → errores de tipos
3. npm test             → pruebas de fechas
4. npm run deploy       → sube el worker; el bot cambia en segundos
5. Probar en Telegram
6. git add -A && git commit -m "..." && git push
```

Si algo sale mal, vuelve al código anterior (`git revert` o `git checkout <archivo>`) y corre `npm run deploy` otra vez.

## Casos especiales

| Si cambias… | Además haces… |
|---|---|
| La base de datos (tablas o columnas) | Crear `migrations/000N_xxx.sql`, correr `npm run db:migrate:remote` y **después** `npm run deploy` |
| Un secreto (token, API key, chat ID) | `npx wrangler secret put NOMBRE` y actualizarlo también en `.dev.vars` |
| El modelo de Gemini | Editar `GEMINI_MODEL` en `wrangler.jsonc` y `npm run deploy` |
| La URL del worker o el secret del webhook | `npm run set-webhook` (en cualquier otro caso no hace falta) |

## Ver logs en vivo

```
npx wrangler tail
```

Muestra los errores y logs de cada mensaje mientras usas el bot. Se corta con Ctrl+C.

`npm run dev` levanta el worker en local, pero Telegram no puede llegar ahí (el webhook apunta a Cloudflare), así que para probar con Telegram hay que hacer deploy.

## Instalar desde cero

```
npm install
npx wrangler login
npx wrangler d1 create expense-tracking-bot   # copiar el database_id a wrangler.jsonc
npm run db:migrate:remote
npx wrangler secret bulk .dev.vars            # antes de añadir WEBHOOK_URL a .dev.vars
npm run deploy
npm run set-webhook
```
