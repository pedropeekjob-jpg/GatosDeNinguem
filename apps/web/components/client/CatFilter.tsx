"use client";
import { useState, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n/client";

export type CatFilterOption = { value: string; label: string; count: number };

/** Quick filter chips over a list of cats. Each item carries data-f="femea senior …"; the list hides what doesn't match.
 *  Without JavaScript nothing is hidden. */
export function CatFilter({ options, total, noun, wrap, children }: { options: CatFilterOption[]; total: number; noun?: string; wrap?: boolean; children: ReactNode }) {
  const { t } = useI18n();
  const what = noun ?? t({ pt: "gatos", en: "cats", es: "gatos", fr: "chats" });
  const [value, setValue] = useState("");
  const shown = value ? options.find((o) => o.value === value)?.count ?? total : total;
  const chips = [{ value: "", label: t({ pt: "Todos", en: "All", es: "Todos", fr: "Tous" }), count: total }, ...options.filter((o) => o.count > 0)];
  return (
    <div className={wrap ? "cat-filter cat-filter--wrap" : "cat-filter"}>
      <div className="cat-filter__chips" role="group" aria-label={t({ pt: "Mostrar", en: "Show", es: "Mostrar", fr: "Afficher" })}>
        {chips.map((o) => (
          <button key={o.value || "todos"} type="button" className="cat-filter__chip" aria-pressed={value === o.value} onClick={() => setValue(o.value)}>
            {o.label} <span className="cat-filter__count">{o.count}</span>
          </button>
        ))}
      </div>
      <p className="gn-sr-only" aria-live="polite">{value ? t({ pt: `A mostrar ${shown} de ${total} ${what}`, en: `Showing ${shown} of ${total} ${what}`, es: `Mostrando ${shown} de ${total} ${what}`, fr: `${shown} ${what} sur ${total}` }) : ""}</p>
      <div className="cat-filter__list" data-filtro={value || undefined}>{children}</div>
    </div>
  );
}
