const LIMA_OFFSET_MS = -5 * 60 * 60 * 1000; // Peru is fixed UTC-5, no DST

// Unix seconds -> 'YYYY-MM-DDTHH:MM' in Lima time.
export function toLimaDateTime(unixSeconds: number): string {
  return new Date(unixSeconds * 1000 + LIMA_OFFSET_MS).toISOString().slice(0, 16);
}
