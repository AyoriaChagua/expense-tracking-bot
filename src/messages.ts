import type { Range } from "./dates";
import type { CategoryTotal, NewTransaction, Totals } from "./types";

// Every user-facing (Spanish) text lives here.
export const messages = {
  start:
    "👋 Envíame la captura de un voucher de Yape o Plin y lo registro.\n" +
    "Puedes añadir una descripción en el texto de la foto.\n\n" +
    "Comandos: /hoy, /semana, /mes, /deshacer",
  unexpectedError: "⚠️ Ocurrió un error inesperado. Inténtalo de nuevo.",
  notReceipt: "No reconocí un voucher de Yape/Plin.",
  noAmount: "No pude leer el monto, reenvía la captura.",
  noAppOrDirection: "No pude leer si es Yape/Plin o si es egreso/ingreso, reenvía la captura.",
  notPen: "Solo registro pagos en soles (S/).",
  duplicate: "Este voucher ya estaba registrado.",
  nothingToUndo: "No hay registros para deshacer.",
  saved: (tx: NewTransaction) => `✅ ${formatTransaction(tx)}`,
  undone: (tx: NewTransaction) => `🗑️ Borré: ${formatTransaction(tx)}`,
  // -> '📊 Semana (16/11 – 20/11)\nEgresos: S/ 51.50 (2)\nIngresos: S/ 5.00 (1)'
  // categories (week/month only) appends '\n\nPor categoría:\ncomida: S/ 30.00 (2)\n...'
  summary: (range: Range, from: string, to: string, t: Totals, categories: CategoryTotal[] = []) =>
    [
      `📊 ${RANGE_LABEL[range]} (${range === "today" ? shortDate(to) : `${shortDate(from)} – ${shortDate(to)}`})`,
      `Egresos: S/ ${formatSoles(t.expense.cents)} (${t.expense.count})`,
      `Ingresos: S/ ${formatSoles(t.income.cents)} (${t.income.count})`,
      ...(categories.length
        ? ["", "Por categoría:", ...categories.map((c) => `${c.category ?? "sin categoría"}: S/ ${formatSoles(c.cents)} (${c.count})`)]
        : []),
    ].join("\n"),
};

const APP_LABEL = { yape: "Yape", plin: "Plin" } as const;
const DIRECTION_LABEL = { expense: "Egreso", income: "Ingreso" } as const;
const RANGE_LABEL = { today: "Hoy", week: "Semana", month: "Mes" } as const;

const formatSoles = (cents: number) => (cents / 100).toFixed(2);

// 'YYYY-MM-DD HH:MM' -> '17/11'
function shortDate(dateTime: string): string {
  const [, month, day] = dateTime.slice(0, 10).split("-");
  return `${day}/${month}`;
}

// -> 'Egreso S/ 25.00 · Yape · Juan P. · 17/11 13:42 · "almuerzo"'
function formatTransaction(tx: NewTransaction): string {
  return [
    `${DIRECTION_LABEL[tx.direction]} S/ ${formatSoles(tx.amount_cents)}`,
    APP_LABEL[tx.app],
    tx.counterparty ?? "—",
    `${shortDate(tx.occurred_at)} ${tx.occurred_at.slice(11)}`,
    ...(tx.description ? [`"${tx.description}"`] : []),
  ].join(" · ");
}
