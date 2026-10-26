import { dates } from "@/lib/i18n/labels";
import { i18n } from "@/lib/i18n/server";

/** A date people can read ("12 de outubro de 2026") that machines can too (<time datetime>). */
export function When({ iso, format = "date" }: { iso: string; format?: "date" | "short" | "month" }) {
  const d = dates(i18n().lang);
  const text = format === "short" ? d.formatDateShort(iso) : format === "month" ? d.formatMonthYear(iso) : d.formatDate(iso);
  return <time dateTime={iso}>{text}</time>;
}
