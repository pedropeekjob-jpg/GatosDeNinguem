"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { dates } from "@/lib/i18n/labels";

/**
 * "há 3 semanas", counted from today. Pages are built ahead of time, so the first render counts from
 * when the page was built (renderedAt, the same on the server and in the browser) and then from now.
 * The full date shows on hover.
 */
export function TimeAgo({ iso, kind = "since", renderedAt }: { iso: string; kind?: "since" | "ago" | "duration"; renderedAt: string }) {
  const [now, setNow] = useState(() => new Date(renderedAt));
  useEffect(() => setNow(new Date()), []);
  const d = dates(useI18n().lang);
  const label = kind === "ago" ? d.timeAgo(iso, now) : kind === "duration" ? d.durationSince(iso, now) : d.sinceLabel(iso, now);
  return <time dateTime={iso} title={d.formatDate(iso)}>{label}</time>;
}
