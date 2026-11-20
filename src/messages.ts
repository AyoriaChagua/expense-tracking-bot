import type { NewTransaction } from "./types";

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
};

const APP_LABEL = { yape: "Yape", plin: "Plin" } as const;
const DIRECTION_LABEL = { expense: "Egreso", income: "Ingreso" } as const;

// -> 'Egreso S/ 25.00 · Yape · Juan P. · 17/11 13:42 · "almuerzo"'
function formatTransaction(tx: NewTransaction): string {
  const [date, time] = tx.occurred_at.split(" "); // 'YYYY-MM-DD HH:MM'
  const [, month, day] = date.split("-");
  return [
    `${DIRECTION_LABEL[tx.direction]} S/ ${(tx.amount_cents / 100).toFixed(2)}`,
    APP_LABEL[tx.app],
    tx.counterparty ?? "—",
    `${day}/${month} ${time}`,
    ...(tx.description ? [`"${tx.description}"`] : []),
  ].join(" · ");
}
