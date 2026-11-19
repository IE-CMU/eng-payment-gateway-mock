// The real API uses "Y-m-d H:i:s" with no timezone; we assume Asia/Bangkok (UTC+7, no DST).
const OFFSET_MS = 7 * 60 * 60 * 1000;
const PATTERN = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;

/** Parse "YYYY-MM-DD HH:mm:ss" (Bangkok time). Returns null if invalid. */
export function parseBangkok(value: string): Date | null {
  const m = PATTERN.exec(value.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m.map(Number);
  const date = new Date(Date.UTC(y!, mo! - 1, d!, h!, mi!, s!) - OFFSET_MS);
  // Reject overflowed values like 2027-02-31
  return formatBangkok(date) === value.trim() ? date : null;
}

/** Format a Date as "YYYY-MM-DD HH:mm:ss" in Bangkok time. */
export function formatBangkok(date: Date): string {
  return new Date(date.getTime() + OFFSET_MS).toISOString().slice(0, 19).replace("T", " ");
}
