import { webhookCallback } from "grammy";
import { createBot } from "./bot";
import type { Env } from "./types";

export default {
  async fetch(request, env): Promise<Response> {
    // Always 200: any other status makes Telegram retry the update.
    if (
      request.method !== "POST" ||
      request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== env.TELEGRAM_WEBHOOK_SECRET
    ) {
      return new Response("ok");
    }
    try {
      await webhookCallback(createBot(env), "cloudflare-mod")(request);
    } catch (err) {
      console.error("webhook error", err);
    }
    return new Response("ok");
  },
} satisfies ExportedHandler<Env>;
