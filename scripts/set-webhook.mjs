// Usage: npm run set-webhook  (reads TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, WEBHOOK_URL from .dev.vars)
const { TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, WEBHOOK_URL } = process.env;
if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_WEBHOOK_SECRET || !WEBHOOK_URL) {
  console.error("Missing TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET or WEBHOOK_URL in .dev.vars");
  process.exit(1);
}
const api = (method, body) =>
  fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  }).then((r) => r.json());

console.log("setWebhook:", await api("setWebhook", {
  url: WEBHOOK_URL,
  secret_token: TELEGRAM_WEBHOOK_SECRET,
  allowed_updates: ["message"],
}));
const { result } = await api("getWebhookInfo");
console.log("getWebhookInfo:", { url: result.url, pending: result.pending_update_count, last_error: result.last_error_message });
