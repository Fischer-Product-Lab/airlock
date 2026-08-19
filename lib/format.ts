const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** UTC timestamp in the board format: `17 Aug 2026, 18:00 UTC`. */
export function formatUtc(input: Date | string): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const day = date.getUTCDate();
  const month = MONTHS[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${day} ${month} ${year}, ${hours}:${minutes} UTC`;
}

export function titleCase(value: string): string {
  if (value.length === 0) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** Human age from a millisecond delta. Null or negative → `none`. */
export function formatAge(ms: number | null): string {
  if (ms === null || ms < 0) return "none";
  if (ms < HOUR_MS) {
    const minutes = Math.round(ms / MINUTE_MS);
    return minutes === 1 ? "1 minute" : `${minutes} minutes`;
  }
  if (ms < 2 * DAY_MS) {
    const hours = Math.round(ms / HOUR_MS);
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }
  const days = Math.round(ms / DAY_MS);
  return days === 1 ? "1 day" : `${days} days`;
}
