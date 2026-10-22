"use client";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "./Button";

export type NavItem = { href: string; label: string; icon?: ReactNode };

function isCurrent(itemHref: string, currentPath: string) {
  if (itemHref === "/") return currentPath === "/";
  return currentPath === itemHref || currentPath.startsWith(itemHref + "/");
}

/**
 * Header with always-visible navigation (no hamburger menu): every option is a
 * large labelled link, so nothing is hidden from people less used to the web.
 * With `tabBar`, phones get the menu as an app-style bar fixed to the bottom of
 * the screen (best for up to five items, each with an icon).
 */
export function SiteHeader({ brand, homeHref, items, currentPath, urgent, tools, tabBar }: {
  brand: ReactNode; homeHref: string; items: NavItem[]; currentPath: string; urgent?: NavItem; tools?: ReactNode; tabBar?: boolean;
}) {
  return (
    <header className={tabBar ? "gn-header gn-header--tabbar" : "gn-header"}>
      <a className="gn-skip" href="#conteudo">Saltar para o conteúdo</a>
      <div className="gn-header__inner gn-container">
        <a className="gn-header__brand" href={homeHref}>{brand}</a>
        <div className="gn-header__tools">
          {tools}
          {urgent ? <Button href={urgent.href} variant="urgent" icon={urgent.icon}>{urgent.label}</Button> : null}
        </div>
        <nav className="gn-nav" aria-label="Menu principal">
          <ul className="gn-nav__list">
          {items.map((item) => (
            <li key={item.href}>
              <a href={item.href} className="gn-nav__link" aria-current={isCurrent(item.href, currentPath) ? "page" : undefined}>
                {item.icon ? <span aria-hidden="true" className="gn-nav__icon">{item.icon}</span> : null}
                <span className="gn-nav__label">{item.label}</span>
              </a>
            </li>
          ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Está aqui" className="gn-crumbs">
      <ol>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`}>
              {item.href && !last ? <a href={item.href}>{item.label}</a> : <span aria-current={last ? "page" : undefined}>{item.label}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

const SIZES = [
  { value: "normal", label: "A", name: "Letra normal" },
  { value: "grande", label: "A+", name: "Letra grande" },
  { value: "muito-grande", label: "A++", name: "Letra muito grande" },
] as const;
type Size = (typeof SIZES)[number]["value"];
const STORAGE_KEY = "gn-text-size";

/** Lets visitors enlarge all text. Stored on this device only. */
export function TextSizeControl() {
  const [size, setSize] = useState<Size>("normal");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Size | null;
      if (saved && SIZES.some((s) => s.value === saved)) apply(saved);
    } catch { /* storage unavailable: keep default */ }
  }, []);

  function apply(next: Size) {
    setSize(next);
    document.documentElement.dataset.textSize = next;
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
  }

  const index = SIZES.findIndex((s) => s.value === size);
  const current = SIZES[index]!;
  const next = SIZES[(index + 1) % SIZES.length]!;

  // Wide screens show the three sizes side by side; small phones show one button that steps through them.
  return (
    <div className="gn-textsize-wrap">
      <div className="gn-textsize" role="group" aria-label="Tamanho da letra">
        {SIZES.map((s) => (
          <button key={s.value} type="button" className="gn-textsize__btn" aria-pressed={size === s.value} onClick={() => apply(s.value)}>
            <span aria-hidden="true">{s.label}</span>
            <span className="gn-sr-only">{s.name}</span>
          </button>
        ))}
      </div>
      <button type="button" className="gn-textsize__btn gn-textsize__cycle" onClick={() => apply(next.value)}
        aria-label={`Tamanho da letra: ${current.name.toLowerCase()}. Mudar para ${next.name.toLowerCase()}`}>
        <span aria-hidden="true">Aa</span>
      </button>
    </div>
  );
}
