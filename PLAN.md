# Plan — Bot de control de gastos (Yape / Plin)

## Convenciones de idioma

- **Código en inglés:** nombres de archivos, variables, funciones, tipos, tablas, columnas, comentarios, mensajes de commit y logs.
- **Textos que ve el usuario en Telegram en español:** respuestas del bot y nombres de comandos (`/hoy`, `/semana`, `/mes`, `/deshacer`). Todos estos textos se centralizan en `src/messages.ts`.
- **Conversación conmigo en español:** explicaciones, preguntas y resúmenes de lo hecho.

## Objetivo

Registrar mis gastos personales enviando a un bot de Telegram la captura del voucher de Yape o Plin, con una descripción opcional en el texto de la foto. El bot extrae los datos con IA, los guarda y me da totales simples.

Uso exclusivamente personal (un solo usuario).

## Alcance del MVP

**Incluye**
- Recibir una foto (o una imagen enviada como archivo) con texto opcional, que es la descripción.
- Extraer con IA: app (Yape/Plin), tipo (egreso/ingreso), monto, contraparte, fecha y hora, número de operación.
- Guardar en base de datos y responder con un resumen de lo registrado.
- Comandos: `/hoy`, `/semana`, `/mes` (total de egresos, total de ingresos y cantidad de movimientos) y `/deshacer` (borra el último registro).
- Rechazar imágenes que no sean vouchers de Yape o Plin.

**No incluye (por ahora)**
- Categorías, presupuestos, alertas, dashboard web, multiusuario, otros bancos o boletas físicas, botones de confirmación o edición.

## Stack

- **Runtime:** Cloudflare Workers (plan Free), TypeScript.
- **Bot:** grammY con `webhookCallback(bot, "cloudflare-mod")`.
- **Base de datos:** Cloudflare D1 (SQLite), con migraciones de `wrangler d1 migrations`.
- **IA:** Gemini API (SDK `@google/genai`), modelo configurable por variable. Por defecto `gemini-2.5-flash-lite`, en tier **pagado** (para que los datos no se usen para entrenar).
- **Herramientas:** `wrangler` para desarrollo, deploy, secretos y logs (`wrangler tail`).
- **Entorno de desarrollo:** macOS.

## Configuración y secretos

| Nombre | Tipo | Descripción |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | secret | Token de BotFather |
| `TELEGRAM_WEBHOOK_SECRET` | secret | Se valida contra el header `X-Telegram-Bot-Api-Secret-Token` |
| `GEMINI_API_KEY` | secret | API key de Google AI Studio (con billing activo) |
| `ALLOWED_CHAT_ID` | secret | Mi chat ID; cualquier otro chat se ignora en silencio |
| `GEMINI_MODEL` | var | Por defecto `gemini-2.5-flash-lite` |

Para desarrollo local, los secretos van en `.dev.vars`, que debe estar en `.gitignore`.

## Modelo de datos (D1)

```sql
CREATE TABLE transactions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  app           TEXT    NOT NULL CHECK (app IN ('yape','plin')),
  direction     TEXT    NOT NULL CHECK (direction IN ('expense','income')),
  amount_cents  INTEGER NOT NULL,          -- S/ 25.50 -> 2550 (avoids float errors)
  counterparty  TEXT,
  occurred_at   TEXT    NOT NULL,          -- Lima time, 'YYYY-MM-DD HH:MM'
  operation_id  TEXT    UNIQUE,            -- prevents duplicates; may be NULL
  description   TEXT,                      -- caption sent with the photo
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_transactions_occurred_at ON transactions(occurred_at);
```

Solo se maneja moneda PEN. Si el voucher no está en soles, se rechaza.

## Flujo de una foto

1. Llega el webhook. Se valida el secret header y el chat ID; si no coinciden, se responde 200 sin hacer nada.
2. Se toma la foto de mayor resolución (`photo.at(-1)`), o el `document` si es una imagen.
3. Se descarga con `getFile` y se pasa a base64.
4. Se llama a Gemini con la imagen, el prompt y un `responseSchema` JSON (salida estructurada).
5. Validación:
   - Si `isReceipt = false`: responder "No reconocí un voucher de Yape/Plin."
   - Si falta el monto: responder "No pude leer el monto, reenvía la captura."
6. Se inserta. Si el `operation_id` choca con el índice UNIQUE, se responde "Este voucher ya estaba registrado."
7. Se responde con el resumen, por ejemplo: `✅ Egreso S/ 25.00 · Yape · Juan P. · 17/11 13:42 · "almuerzo"`.

**Importante:** el webhook **siempre** debe devolver 200, incluso si hay error (en ese caso se avisa al usuario por mensaje). Si no, Telegram reintenta y se generan bucles.

### Esquema de salida de Gemini

```json
{
  "isReceipt": true,
  "app": "yape | plin",
  "direction": "expense | income",
  "amount": 25.00,
  "currency": "PEN",
  "counterparty": "Juan P.",
  "occurredAt": "2026-11-17T13:42",
  "operationId": "12345678"
}
```

El prompt para Gemini se escribe en inglés, pero debe aclarar que el texto del voucher está en español:
- "Yapeaste", "Pagaste" o "Enviaste" es `expense`; "Te yapearon" o "Recibiste" es `income`.
- La fecha y hora están en hora de Perú (UTC−5).
- Si un campo no es legible, devolver `null` y no inventarlo.

## Fechas y zona horaria

- Perú es UTC−5 fijo, sin horario de verano. Basta un helper `nowInLima()` que reste 5 horas a UTC.
- Se usa la fecha del voucher. Si viene `null`, se usa la fecha del mensaje de Telegram convertida a hora de Lima.
- `/hoy` va de 00:00 de hoy hasta ahora. `/semana` va desde el lunes de la semana actual. `/mes` va desde el día 1 del mes actual.

## Comandos

| Comando | Handler | Respuesta |
|---|---|---|
| `/start` | `handleStart` | Instrucciones breves |
| `/hoy`, `/semana`, `/mes` | `handleSummary(range)` con `range = "today" \| "week" \| "month"` | Egresos: S/ X (n) · Ingresos: S/ Y (m) |
| `/deshacer` | `handleUndo` | Borra el último registro (`ORDER BY id DESC LIMIT 1`) y muestra cuál borró |

## Estructura sugerida

```
src/
  index.ts        // Worker entrypoint: validates the secret and mounts the grammY webhook
  bot.ts          // handlers: photo, document and commands
  gemini.ts       // receipt extraction: prompt + responseSchema
  db.ts           // insert, totals by range, undo
  dates.ts        // Lima time and range helpers
  messages.ts     // every Spanish user-facing text
  types.ts        // shared types (Transaction, ExtractedReceipt, Env)
migrations/
  0001_init.sql
wrangler.jsonc
.dev.vars         // NOT committed
```

## Fases

**Fase 0 — Cuentas (manual, la hago yo)**
- Crear el bot con @BotFather y guardar el token.
- Crear la API key en Google AI Studio y activar billing.
- Crear la cuenta de Cloudflare e instalar wrangler (`npm i -D wrangler`, luego `npx wrangler login`).
- Obtener mi chat ID, por ejemplo escribiéndole a @userinfobot.

**Fase 1 — Scaffold**
- Proyecto TypeScript con `wrangler.jsonc`, grammY y `@google/genai`.
- Crear la base D1 y aplicar la migración `0001_init.sql`.

**Fase 2 — Webhook mínimo**
- Endpoint con validación del secret y del chat ID; `/start` responde.
- Primer deploy a `*.workers.dev` y registro del webhook con `setWebhook` (url + secret_token).
- Script `npm run set-webhook` para repetir el registro.

**Fase 3 — Extracción**
- Descarga de la foto, llamada a Gemini y validación de la respuesta.
- Por ahora solo responde lo extraído, sin guardar, para probar con vouchers reales.

**Fase 4 — Persistencia**
- Insert, manejo de duplicados y `/deshacer`.

**Fase 5 — Reportes**
- `/hoy`, `/semana` y `/mes`.

**Fase 6 — Pruebas reales**
- Probar con al menos 5 vouchers de Yape y 5 de Plin (egresos e ingresos), uno repetido y una imagen que no sea voucher.
- Revisar con `wrangler tail` que la CPU por invocación no pase de 10 ms (límite del plan Free). Si se pasa, evaluar el plan de $5.

## Criterios de aceptación

- Un voucher de Yape o Plin queda registrado correctamente en menos de unos 5 segundos.
- El mismo voucher enviado dos veces no se duplica.
- Una imagen que no es voucher no se registra.
- Los mensajes de otros chats se ignoran.
- Los totales de `/hoy`, `/semana` y `/mes` cuadran con los registros.
- Las imágenes no se guardan en ningún lado.
- No hay identificadores en español en el código; los únicos textos en español están en `src/messages.ts`.
