import type { ExtractedReceipt } from "./types";

// Every user-facing (Spanish) text lives here.
export const messages = {
  start:
    "👋 Envíame la captura de un voucher de Yape o Plin y lo registro.\n" +
    "Puedes añadir una descripción en el texto de la foto.\n\n" +
    "Comandos: /hoy, /semana, /mes, /deshacer",
  unexpectedError: "⚠️ Ocurrió un error inesperado. Inténtalo de nuevo.",
  notReceipt: "No reconocí un voucher de Yape/Plin.",
  noAmount: "No pude leer el monto, reenvía la captura.",
  notPen: "Solo registro pagos en soles (S/).",
  testNotSaved: "🧪 Prueba, no guardado:",
};

const APP_LABEL = { yape: "Yape", plin: "Plin" } as const;
const DIRECTION_LABEL = { expense: "Egreso", income: "Ingreso" } as const;

// occurredAt is 'YYYY-MM-DDTHH:MM' -> '17/11 13:42'
export function formatReceiptSummary(r: ExtractedReceipt, amount: number, occurredAt: string, description?: string): string {
  const [date, time] = occurredAt.split("T");
  const [, month, day] = date.split("-");
  return [
    `✅ ${r.direction ? DIRECTION_LABEL[r.direction] : "¿Egreso/Ingreso?"} S/ ${amount.toFixed(2)}`,
    r.app ? APP_LABEL[r.app] : "¿App?",
    r.counterparty ?? "—",
    `${day}/${month} ${time}`,
    ...(description ? [`"${description}"`] : []),
  ].join(" · ");
}
