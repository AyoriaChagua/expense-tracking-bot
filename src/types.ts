export interface Env {
  DB: D1Database;
  GEMINI_MODEL: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_WEBHOOK_SECRET: string;
  GEMINI_API_KEY: string;
  ALLOWED_CHAT_ID: string;
}

// Shape returned by Gemini; any field may be null when unreadable.
export interface ExtractedReceipt {
  isReceipt: boolean;
  app: "yape" | "plin" | null;
  direction: "expense" | "income" | null;
  amount: number | null;
  currency: string | null;
  counterparty: string | null;
  occurredAt: string | null; // 'YYYY-MM-DDTHH:MM', Lima time
  operationId: string | null;
}
