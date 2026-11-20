import type { NewTransaction, Transaction } from "./types";

// ON CONFLICT only swallows operation_id duplicates; other constraint errors still throw.
export async function insertTransaction(db: D1Database, tx: NewTransaction): Promise<"inserted" | "duplicate"> {
  const { meta } = await db
    .prepare(
      `INSERT INTO transactions (app, direction, amount_cents, counterparty, occurred_at, operation_id, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(operation_id) DO NOTHING`,
    )
    .bind(tx.app, tx.direction, tx.amount_cents, tx.counterparty, tx.occurred_at, tx.operation_id, tx.description)
    .run();
  return meta.changes > 0 ? "inserted" : "duplicate";
}

export async function deleteLastTransaction(db: D1Database): Promise<Transaction | null> {
  return db
    .prepare("DELETE FROM transactions WHERE id = (SELECT MAX(id) FROM transactions) RETURNING *")
    .first<Transaction>();
}
