import { formatDate, formatDateShort, formatMonthYear } from "@gn/domain";

const formats = { date: formatDate, short: (iso: string) => formatDateShort(iso), month: formatMonthYear };

/** A date people can read ("12 de outubro de 2026") that machines can too (<time datetime>). */
export function When({ iso, format = "date" }: { iso: string; format?: keyof typeof formats }) {
  return <time dateTime={iso}>{formats[format](iso)}</time>;
}
