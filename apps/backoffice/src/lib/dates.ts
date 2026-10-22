import { lisbonToUtc } from "@gn/domain";

const tz = "Europe/Lisbon";
export const dayLabel = (iso: string) => new Intl.DateTimeFormat("pt-PT", { weekday: "long", day: "numeric", month: "long", timeZone: tz }).format(new Date(iso));
export const timeLabel = (iso: string) => new Intl.DateTimeFormat("pt-PT", { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(new Date(iso));
export const lisbonDate = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date(iso));

/** Monday of the week containing the given date, as "YYYY-MM-DD". */
export function weekStart(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const weekRange = (start: string) => ({ from: lisbonToUtc(start, "00:00"), to: lisbonToUtc(addDays(start, 7), "00:00") });
export { lisbonToUtc };
