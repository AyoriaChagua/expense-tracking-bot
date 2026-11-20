import { Bot } from "grammy";
import { messages } from "./messages";
import type { Env } from "./types";

export function createBot(env: Env): Bot {
  const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

  // Single-user bot: silently ignore every other chat.
  bot.use(async (ctx, next) => {
    if (String(ctx.chat?.id) === env.ALLOWED_CHAT_ID) await next();
  });

  bot.command("start", (ctx) => ctx.reply(messages.start));

  bot.catch(async (err) => {
    console.error("bot error", err.error);
    await err.ctx.reply(messages.unexpectedError).catch(() => {});
  });

  return bot;
}
