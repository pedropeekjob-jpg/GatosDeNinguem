/**
 * Dates as people read them in Portugal: "12 de outubro de 2026", "ontem às 14:30", "há 3 dias",
 * "há 2 anos". Everything is shown in Lisbon time, whatever the server's time zone.
 */
const tz = "Europe/Lisbon";
const dayMs = 86_400_000;

const longDate = new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "long", year: "numeric", timeZone: tz });
const dayMonth = new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "long", timeZone: tz });
const monthYearFormat = new Intl.DateTimeFormat("pt-PT", { month: "long", year: "numeric", timeZone: tz });
const hourFormat = new Intl.DateTimeFormat("pt-PT", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: tz });
const dayKeyFormat = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: tz });
const relative = new Intl.RelativeTimeFormat("pt-PT", { numeric: "auto" });

/** Accepts a full ISO date-time or a plain day ("2024-03-15", read as that day in Lisbon). */
const toDate = (iso: string) => new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00Z` : iso);
const dayKey = (d: Date) => dayKeyFormat.format(d);
/** Whole calendar days between two moments, counted in Lisbon. */
const daysBetween = (from: Date, to: Date) => Math.round((Date.parse(`${dayKey(to)}T00:00:00Z`) - Date.parse(`${dayKey(from)}T00:00:00Z`)) / dayMs);

/** "12 de outubro de 2026" */
export const formatDate = (iso: string) => longDate.format(toDate(iso));

/** "12 de outubro", with the year only when it is not this year. */
export const formatDateShort = (iso: string, now: Date = new Date()) => {
  const d = toDate(iso);
  return dayKey(d).slice(0, 4) === dayKey(now).slice(0, 4) ? dayMonth.format(d) : longDate.format(d);
};

/** "março de 2024" */
export const formatMonthYear = (iso: string) => monthYearFormat.format(toDate(iso));

/** "14:30" */
export const formatHour = (iso: string) => hourFormat.format(toDate(iso));

/**
 * For things that just happened, like a notification or a comment:
 * "agora mesmo", "há 5 minutos", "hoje às 14:30", "ontem às 9:10", "há 3 dias", then the date.
 */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const d = toDate(iso);
  const minutes = Math.floor((now.getTime() - d.getTime()) / 60_000);
  if (minutes < 1) return "agora mesmo";
  if (minutes < 60) return relative.format(-minutes, "minute");
  const days = daysBetween(d, now);
  if (days === 0) return `hoje às ${formatHour(iso)}`;
  if (days === 1) return `ontem às ${formatHour(iso)}`;
  if (days < 7) return relative.format(-days, "day");
  return formatDateShort(iso, now);
}

/** How long something has lasted, without "há": "5 dias", "3 semanas", "8 meses", "2 anos". */
export function durationSince(iso: string, now: Date = new Date()): string {
  const days = Math.max(0, daysBetween(toDate(iso), now));
  if (days === 0) return "menos de um dia";
  if (days < 14) return days === 1 ? "1 dia" : `${days} dias`;
  if (days < 60) return `${Math.floor(days / 7)} semanas`;
  const months = Math.floor(days / 30.44);
  if (months < 12) return `${months} meses`;
  const years = Math.floor(days / 365.25);
  return years === 1 ? "1 ano" : `${years} anos`;
}

/** For a date in the past, on a public page: "hoje", "ontem", "há 3 dias", "há 2 semanas", "há 8 meses", "há 2 anos". */
export function sinceLabel(iso: string, now: Date = new Date()): string {
  const days = Math.max(0, daysBetween(toDate(iso), now));
  if (days < 2) return relative.format(-days, "day");
  return `há ${durationSince(iso, now)}`;
}
