"use client";
import type { ReactNode } from "react";
import { Button } from "./Button";

/** count: a small number next to the label, e.g. unread news. */
export type NavItem = { href: string; label: string; icon?: ReactNode; count?: number; countLabel?: string };

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
                {item.count ? <span className="gn-nav__count">{item.count}<span className="gn-sr-only"> {item.countLabel ?? "novidades"}</span></span> : null}
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
