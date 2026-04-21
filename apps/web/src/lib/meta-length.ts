/** Unicode-safe length (grapheme-aware enough for social limits). */
export function charCount(s: string): number {
  return [...s].length;
}

const TARGET = 4000;
const MIN = 3800;
const MAX = 4200;

export function isMetaLengthOk(body: string): boolean {
  const n = charCount(body);
  return n >= MIN && n <= MAX;
}

export function metaLengthHint(body: string): string {
  const n = charCount(body);
  if (n < MIN) return `Zu kurz: ${n} Zeichen (Ziel ca. ${TARGET}, min ${MIN}).`;
  if (n > MAX) return `Zu lang: ${n} Zeichen (max ${MAX}).`;
  return `OK: ${n} Zeichen.`;
}
