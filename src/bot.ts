import { Bot, type Context } from "grammy";
import { Buffer } from "node:buffer";
import { toLimaDateTime } from "./dates";
import { extractReceipt } from "./gemini";
import { formatReceiptSummary, messages } from "./messages";
import type { Env } from "./types";

const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

async function handleImage(ctx: Context, env: Env, fileId: string, mimeType: string) {
  const file = await ctx.api.getFile(fileId);
  const res = await fetch(`https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${file.file_path}`);
  if (!res.ok) throw new Error(`file download failed: ${res.status}`);
  // Image only lives in memory; it is never stored.
  const imageBase64 = Buffer.from(await res.arrayBuffer()).toString("base64");

  const receipt = await extractReceipt(env, imageBase64, mimeType);
  if (!receipt.isReceipt) return ctx.reply(messages.notReceipt);
  if (receipt.amount == null || !(receipt.amount > 0)) return ctx.reply(messages.noAmount);
  if (receipt.currency !== "PEN") return ctx.reply(messages.notPen);

  const occurredAt =
    receipt.occurredAt && DATETIME_RE.test(receipt.occurredAt) ? receipt.occurredAt : toLimaDateTime(ctx.message!.date);
  const summary = formatReceiptSummary(receipt, receipt.amount, occurredAt, ctx.message?.caption);
  // shortcut: raw JSON shown only while testing extraction (phase 3), remove in phase 4.
  return ctx.reply(`${summary}\n\n${messages.testNotSaved}\n${JSON.stringify(receipt)}`);
}

export function createBot(env: Env): Bot {
  const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

  // Single-user bot: silently ignore every other chat.
  bot.use(async (ctx, next) => {
    if (String(ctx.chat?.id) === env.ALLOWED_CHAT_ID) await next();
  });

  // bot.catch only works with polling; with webhooks errors must be caught by an error boundary.
  const safe = bot.errorBoundary(async (err) => {
    console.error("bot error", err.error);
    await err.ctx.reply(messages.unexpectedError).catch(() => {});
  });

  safe.command("start", (ctx) => ctx.reply(messages.start));

  // Full resolution: an 800px cap cut CPU but broke OCR (wrong app, truncated name, missing operation id).
  safe.on("message:photo", (ctx) => handleImage(ctx, env, ctx.message.photo.at(-1)!.file_id, "image/jpeg"));

  safe.on("message:document", async (ctx) => {
    const { file_id, mime_type } = ctx.message.document;
    if (mime_type?.startsWith("image/")) await handleImage(ctx, env, file_id, mime_type);
  });

  return bot;
}
