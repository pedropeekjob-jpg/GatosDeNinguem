"use client";
import { durationSince, formatDate, sinceLabel, timeAgo } from "@gn/domain";
import { useEffect, useState } from "react";

const labels = { since: sinceLabel, ago: timeAgo, duration: durationSince };

/**
 * "há 3 semanas", counted from today. Pages are built ahead of time, so the first render counts from
 * when the page was built (renderedAt, the same on the server and in the browser) and then from now.
 * The full date shows on hover.
 */
export function TimeAgo({ iso, kind = "since", renderedAt }: { iso: string; kind?: keyof typeof labels; renderedAt: string }) {
  const [now, setNow] = useState(() => new Date(renderedAt));
  useEffect(() => setNow(new Date()), []);
  return <time dateTime={iso} title={formatDate(iso)}>{labels[kind](iso, now)}</time>;
}
