/**
 * Dates as people read them in Portugal: "12 de outubro de 2026", "ontem às 14:30", "há 3 dias",
 * "há 2 anos". Everything is shown in Lisbon time, whatever the server's time zone.
 * The same in the site's other languages with datesIn("en-GB"), datesIn("es-ES"), datesIn("fr-FR").
 */
const tz = "Europe/Lisbon";
const dayMs = 86_400_000;

const dayKeyFormat = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: tz });

/** Accepts a full ISO date-time or a plain day ("2024-03-15", read as that day in Lisbon). */
const toDate = (iso: string) => new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00Z` : iso);
const dayKey = (d: Date) => dayKeyFormat.format(d);
/** Whole calendar days between two moments, counted in Lisbon. */
const daysBetween = (from: Date, to: Date) => Math.round((Date.parse(`${dayKey(to)}T00:00:00Z`) - Date.parse(`${dayKey(from)}T00:00:00Z`)) / dayMs);

/** The words Intl does not give us, per language. */
type DateWords = {
  justNow: string;
  todayAt: (time: string) => string;
  yesterdayAt: (time: string) => string;
  lessThanADay: string;
  days: (n: number) => string;
  weeks: (n: number) => string;
  months: (n: number) => string;
  years: (n: number) => string;
  ago: (duration: string) => string;
};

const words: Record<string, DateWords> = {
  pt: {
    justNow: "agora mesmo",
    todayAt: (t) => `hoje às ${t}`,
    yesterdayAt: (t) => `ontem às ${t}`,
    lessThanADay: "menos de um dia",
    days: (n) => (n === 1 ? "1 dia" : `${n} dias`),
    weeks: (n) => `${n} semanas`,
    months: (n) => `${n} meses`,
    years: (n) => (n === 1 ? "1 ano" : `${n} anos`),
    ago: (d) => `há ${d}`,
  },
  en: {
    justNow: "just now",
    todayAt: (t) => `today at ${t}`,
    yesterdayAt: (t) => `yesterday at ${t}`,
    lessThanADay: "less than a day",
    days: (n) => (n === 1 ? "1 day" : `${n} days`),
    weeks: (n) => `${n} weeks`,
    months: (n) => `${n} months`,
    years: (n) => (n === 1 ? "1 year" : `${n} years`),
    ago: (d) => `${d} ago`,
  },
  es: {
    justNow: "ahora mismo",
    todayAt: (t) => `hoy a las ${t}`,
    yesterdayAt: (t) => `ayer a las ${t}`,
    lessThanADay: "menos de un día",
    days: (n) => (n === 1 ? "1 día" : `${n} días`),
    weeks: (n) => `${n} semanas`,
    months: (n) => `${n} meses`,
    years: (n) => (n === 1 ? "1 año" : `${n} años`),
    ago: (d) => `hace ${d}`,
  },
  fr: {
    justNow: "à l’instant",
    todayAt: (t) => `aujourd’hui à ${t}`,
    yesterdayAt: (t) => `hier à ${t}`,
    lessThanADay: "moins d’un jour",
    days: (n) => (n === 1 ? "1 jour" : `${n} jours`),
    weeks: (n) => `${n} semaines`,
    months: (n) => `${n} mois`,
    years: (n) => (n === 1 ? "1 an" : `${n} ans`),
    ago: (d) => `il y a ${d}`,
  },
};

export type Dates = ReturnType<typeof datesIn>;

/** The date helpers below, in one language ("pt-PT", "en-GB", "es-ES", "fr-FR"). */
export function datesIn(locale: string) {
  const w = words[locale.slice(0, 2)] ?? words.pt!;
  const longDate = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: tz });
  const dayMonth = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: tz });
  const monthYearFormat = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: tz });
  const hourFormat = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: tz });
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  /** "12 de outubro de 2026" */
  const formatDate = (iso: string) => longDate.format(toDate(iso));

  /** "12 de outubro", with the year only when it is not this year. */
  const formatDateShort = (iso: string, now: Date = new Date()) => {
    const d = toDate(iso);
    return dayKey(d).slice(0, 4) === dayKey(now).slice(0, 4) ? dayMonth.format(d) : longDate.format(d);
  };

  /** "março de 2024" */
  const formatMonthYear = (iso: string) => monthYearFormat.format(toDate(iso));

  /** "14:30" */
  const formatHour = (iso: string) => hourFormat.format(toDate(iso));

  /**
   * For things that just happened, like a notification or a comment:
   * "agora mesmo", "há 5 minutos", "hoje às 14:30", "ontem às 9:10", "há 3 dias", then the date.
   */
  function timeAgo(iso: string, now: Date = new Date()): string {
    const d = toDate(iso);
    const minutes = Math.floor((now.getTime() - d.getTime()) / 60_000);
    if (minutes < 1) return w.justNow;
    if (minutes < 60) return relative.format(-minutes, "minute");
    const days = daysBetween(d, now);
    if (days === 0) return w.todayAt(formatHour(iso));
    if (days === 1) return w.yesterdayAt(formatHour(iso));
    if (days < 7) return relative.format(-days, "day");
    return formatDateShort(iso, now);
  }

  /** How long something has lasted, without "há": "5 dias", "3 semanas", "8 meses", "2 anos". */
  function durationSince(iso: string, now: Date = new Date()): string {
    const days = Math.max(0, daysBetween(toDate(iso), now));
    if (days === 0) return w.lessThanADay;
    if (days < 14) return w.days(days);
    if (days < 60) return w.weeks(Math.floor(days / 7));
    const months = Math.floor(days / 30.44);
    if (months < 12) return w.months(months);
    return w.years(Math.floor(days / 365.25));
  }

  /** For a date in the past, on a public page: "hoje", "ontem", "há 3 dias", "há 2 semanas", "há 8 meses", "há 2 anos". */
  function sinceLabel(iso: string, now: Date = new Date()): string {
    const days = Math.max(0, daysBetween(toDate(iso), now));
    if (days < 2) return relative.format(-days, "day");
    return w.ago(durationSince(iso, now));
  }

  return { formatDate, formatDateShort, formatMonthYear, formatHour, timeAgo, durationSince, sinceLabel };
}

export const { formatDate, formatDateShort, formatMonthYear, formatHour, timeAgo, durationSince, sinceLabel } = datesIn("pt-PT");
