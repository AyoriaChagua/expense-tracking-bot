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

// Row of the transactions table.
export interface Transaction {
  id: number;
  app: "yape" | "plin";
  direction: "expense" | "income";
  amount_cents: number;
  counterparty: string | null;
  occurred_at: string; // Lima time, 'YYYY-MM-DD HH:MM'
  operation_id: string | null;
  description: string | null;
  created_at: string;
}

export type NewTransaction = Omit<Transaction, "id" | "created_at">;

export interface Totals {
  expense: { cents: number; count: number };
  income: { cents: number; count: number };
}
