const LIMA_OFFSET_MS = -5 * 60 * 60 * 1000; // Peru is fixed UTC-5, no DST

export type Range = "today" | "week" | "month";

// 'YYYY-MM-DD HH:MM' from a Date whose UTC fields hold Lima wall-clock time.
const toDbDateTime = (d: Date) => d.toISOString().slice(0, 16).replace("T", " ");

// Unix seconds -> 'YYYY-MM-DDTHH:MM' in Lima time.
export function toLimaDateTime(unixSeconds: number): string {
  return new Date(unixSeconds * 1000 + LIMA_OFFSET_MS).toISOString().slice(0, 16);
}

// Returned Date's UTC getters read as Lima wall-clock time.
export function nowInLima(now = new Date()): Date {
  return new Date(now.getTime() + LIMA_OFFSET_MS);
}

// Receipts often omit the year and Gemini then guesses one. Force the current Lima year;
// a date later than today means it is from last year (e.g. a December receipt sent in January).
// Compares dates only, so a receipt a few minutes "ahead" of the server clock stays this year.
export function withCurrentYear(occurredAt: string, now = new Date()): string {
  const lima = nowInLima(now);
  const year = lima.getUTCFullYear();
  const rest = occurredAt.slice(4); // '-MM-DDTHH:MM'
  const today = lima.toISOString().slice(0, 10);
  return `${year}${rest}`.slice(0, 10) > today ? `${year - 1}${rest}` : `${year}${rest}`;
}

// Today from 00:00, week from Monday 00:00, month from day 1 00:00 — all until now (Lima time).
export function rangeBounds(range: Range, now = new Date()): { from: string; to: string } {
  const lima = nowInLima(now);
  const start = new Date(Date.UTC(lima.getUTCFullYear(), lima.getUTCMonth(), lima.getUTCDate()));
  if (range === "week") start.setUTCDate(start.getUTCDate() - ((lima.getUTCDay() + 6) % 7));
  if (range === "month") start.setUTCDate(1);
  return { from: toDbDateTime(start), to: toDbDateTime(lima) };
}
