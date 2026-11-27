import type { CategoryTotal, NewTransaction, Totals, Transaction } from "./types";

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

// from/to are Lima 'YYYY-MM-DD HH:MM'; that format sorts correctly as text.
export async function getTotals(db: D1Database, from: string, to: string): Promise<Totals> {
  const { results } = await db
    .prepare(
      `SELECT direction, SUM(amount_cents) AS cents, COUNT(*) AS count
       FROM transactions WHERE occurred_at >= ? AND occurred_at <= ?
       GROUP BY direction`,
    )
    .bind(from, to)
    .all<{ direction: "expense" | "income"; cents: number; count: number }>();
  const totals: Totals = { expense: { cents: 0, count: 0 }, income: { cents: 0, count: 0 } };
  for (const r of results) totals[r.direction] = { cents: r.cents, count: r.count };
  return totals;
}

// The photo caption (description) is used as the category; expenses only.
export async function getExpensesByCategory(db: D1Database, from: string, to: string): Promise<CategoryTotal[]> {
  const { results } = await db
    .prepare(
      `SELECT LOWER(TRIM(description)) AS category, SUM(amount_cents) AS cents, COUNT(*) AS count
       FROM transactions WHERE direction = 'expense' AND occurred_at >= ? AND occurred_at <= ?
       GROUP BY category ORDER BY cents DESC`,
    )
    .bind(from, to)
    .all<CategoryTotal>();
  return results;
}
