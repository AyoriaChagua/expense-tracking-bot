export interface Env {
  DB: D1Database;
  GEMINI_MODEL: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_WEBHOOK_SECRET: string;
  GEMINI_API_KEY: string;
  ALLOWED_CHAT_ID: string;
}
