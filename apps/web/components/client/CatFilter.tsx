"use client";
import { useState, type ReactNode } from "react";

export type CatFilterOption = { value: string; label: string; count: number };

/** Quick filter chips over a list of cats. Each item carries data-f="femea senior …"; the list hides what doesn't match.
 *  Without JavaScript nothing is hidden. */
export function CatFilter({ options, total, noun = "gatos", wrap, children }: { options: CatFilterOption[]; total: number; noun?: string; wrap?: boolean; children: ReactNode }) {
  const [value, setValue] = useState("");
  const shown = value ? options.find((o) => o.value === value)?.count ?? total : total;
  const chips = [{ value: "", label: "Todos", count: total }, ...options.filter((o) => o.count > 0)];
  return (
    <div className={wrap ? "cat-filter cat-filter--wrap" : "cat-filter"}>
      <div className="cat-filter__chips" role="group" aria-label="Mostrar">
        {chips.map((o) => (
          <button key={o.value || "todos"} type="button" className="cat-filter__chip" aria-pressed={value === o.value} onClick={() => setValue(o.value)}>
            {o.label} <span className="cat-filter__count">{o.count}</span>
          </button>
        ))}
      </div>
      <p className="gn-sr-only" aria-live="polite">{value ? `A mostrar ${shown} de ${total} ${noun}` : ""}</p>
      <div className="cat-filter__list" data-filtro={value || undefined}>{children}</div>
    </div>
  );
}
