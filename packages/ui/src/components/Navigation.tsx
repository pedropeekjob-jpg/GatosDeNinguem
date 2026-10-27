"use client";
import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { Button } from "./Button";
import { IconChevronDown, IconChevronRight, IconMenu } from "./icons";
import { Modal, useModalHistory } from "./Modal";
import { useUiText } from "./UiText";

/** count: a small number next to the label, e.g. unread news. */
/** key: one of the site's main paths, drawn bolder in the top menu so it stands out among the others. */
/** children: the pages under this item; on wide screens the item opens a small menu with them. */
/** description: one short line under a page's name in those menus, saying what is there. */
export type NavItem = { href: string; label: string; icon?: ReactNode; count?: number; countLabel?: string; key?: boolean; description?: string; children?: NavItem[] };

/** The home page (or a language's home, like "/en") is only current on itself, not on every page under it. */
function isCurrent(itemHref: string, currentPath: string, homeHref = "/") {
  if (itemHref === "/" || itemHref === homeHref) return currentPath === itemHref || currentPath === `${itemHref}/`;
  return currentPath === itemHref || currentPath.startsWith(itemHref + "/");
}

/** The one page in the menus that matches where the visitor is: the most specific link wins. */
function currentHref(items: NavItem[], currentPath: string, homeHref?: string) {
  const leaves = items.flatMap((item) => item.children ?? [item]);
  return leaves.filter((l) => isCurrent(l.href, currentPath, homeHref)).sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

function NavLink({ item, current, onClick }: { item: NavItem; current: boolean; onClick?: (e: MouseEvent<HTMLAnchorElement>) => void }) {
  const text = useUiText();
  return (
    <a href={item.href} className={item.key ? "gn-nav__link gn-nav__link--key" : "gn-nav__link"} aria-current={current ? "page" : undefined} onClick={onClick}>
      {item.icon ? <span aria-hidden="true" className="gn-nav__icon">{item.icon}</span> : null}
      <span className="gn-nav__label">{item.label}</span>
      {item.count ? <span className="gn-nav__count">{item.count}<span className="gn-sr-only"> {item.countLabel ?? text.news}</span></span> : null}
    </a>
  );
}

/** A page in a menu: its name in bold and, under it, what it is for. */
function SubLink({ item, current, onClick }: { item: NavItem; current: boolean; onClick?: (e: MouseEvent<HTMLAnchorElement>) => void }) {
  return (
    <a href={item.href} className="gn-subnav__link" aria-current={current ? "page" : undefined} onClick={onClick}>
      <span className="gn-subnav__text">
        <span className="gn-subnav__label">{item.label}</span>
        {item.description ? <span className="gn-subnav__desc">{item.description}</span> : null}
      </span>
      <span className="gn-subnav__arrow" aria-hidden="true"><IconChevronRight /></span>
    </a>
  );
}

/**
 * The top menu on wide screens. An item with pages under it is a button that opens them in a small menu
 * on click, tap, Enter or Space (never on hover alone), and closes with Esc, a click elsewhere or on leaving it.
 * The links are always in the page, so search engines see them even while the menu is closed.
 */
function TopMenu({ items, currentPath, current }: { items: NavItem[]; currentPath: string; current?: string }) {
  const [open, setOpen] = useState<string>();
  const navRef = useRef<HTMLElement>(null);
  const baseId = useId();
  const text = useUiText();

  useEffect(() => setOpen(undefined), [currentPath]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!navRef.current?.contains(e.target as Node)) setOpen(undefined); };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  return (
    <nav
      ref={navRef}
      className="gn-nav"
      aria-label={text.mainMenu}
      onKeyDown={(e) => {
        if (e.key !== "Escape" || !open) return;
        const button = navRef.current?.querySelector<HTMLButtonElement>(`[aria-controls="${baseId}-${open}"]`);
        setOpen(undefined);
        button?.focus();
      }}
      // Only when focus really moves elsewhere (Tab): some browsers give no target on a click, which the pointer handler covers.
      onBlur={(e) => { if (open && e.relatedTarget && !navRef.current?.contains(e.relatedTarget as Node)) setOpen(undefined); }}
    >
      <ul className="gn-nav__list">
        {items.map((item) => {
          if (!item.children?.length) return <li key={item.href}><NavLink item={item} current={item.href === current} /></li>;
          const id = `${baseId}-${item.href}`;
          const expanded = open === item.href;
          const here = item.children.some((c) => c.href === current);
          const classes = ["gn-nav__link", "gn-nav__toggle", item.key && "gn-nav__link--key", here && "gn-nav__link--here"].filter(Boolean).join(" ");
          return (
            <li key={item.href} className="gn-nav__group">
              <button type="button" className={classes} aria-expanded={expanded} aria-controls={id} onClick={() => setOpen(expanded ? undefined : item.href)}>
                <span className="gn-nav__label">{item.label}</span>
                {here ? <span className="gn-sr-only"> {text.inThisSection}</span> : null}
                <span className="gn-nav__chevron" aria-hidden="true"><IconChevronDown /></span>
              </button>
              <div id={id} className="gn-subnav" hidden={!expanded}>
                <ul className="gn-subnav__list">
                  {item.children.map((child) => <li key={child.href}><SubLink item={child} current={child.href === current} /></li>)}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Phones: an app-style bar fixed to the bottom of the screen with a few main pages, each with an icon and
 * its name, and a last "Mais" tab that opens every other page, grouped as in the top menu, in a full-screen
 * window. It closes with "Fechar", Esc or the phone's Back button.
 */
function TabBar({ tabs, items, currentPath, current, homeHref, onNavigate }: { tabs: NavItem[]; items: NavItem[]; currentPath: string; current?: string; homeHref?: string; onNavigate?: (href: string) => void }) {
  const menu = useModalHistory();
  const text = useUiText();
  const onTab = tabs.some((t) => isCurrent(t.href, currentPath, homeHref));
  // Sections that have no tab of their own come first: they are what someone opening "Mais" is looking for.
  const sections = [...items].sort((a, b) => Number(tabs.some((t) => t.href === a.href)) - Number(tabs.some((t) => t.href === b.href)));

  // A link in the window: close it first (which takes back the step Back would undo), then open the page.
  function go(e: MouseEvent<HTMLAnchorElement>, href: string) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!onNavigate || !window.history.state?.gnModal) { menu.hide(); return; }
    e.preventDefault();
    const after = () => { window.removeEventListener("popstate", after); onNavigate(href); };
    window.addEventListener("popstate", after);
    menu.hide();
  }

  return (
    <nav className="gn-tabbar" aria-label={text.mainMenu}>
      <ul className="gn-tabbar__list">
        {tabs.map((tab) => <li key={tab.href}><NavLink item={tab} current={isCurrent(tab.href, currentPath, homeHref)} /></li>)}
        <li>
          <button type="button" className={onTab ? "gn-nav__link" : "gn-nav__link gn-nav__link--here"} aria-haspopup="dialog" aria-expanded={menu.open} onClick={menu.show}>
            <span aria-hidden="true" className="gn-nav__icon"><IconMenu /></span>
            <span className="gn-nav__label">{text.more}</span>
          </button>
        </li>
      </ul>
      <Modal open={menu.open} onClose={menu.hide} title={text.menu}>
        <div className="gn-menu">
          {sections.map((item) => (
            <section key={item.href} className="gn-menu__group" aria-labelledby={`menu-${item.href}`}>
              <h3 id={`menu-${item.href}`} className="gn-menu__title">{item.label}</h3>
              <ul className="gn-subnav__list">
                {(item.children ?? [item]).map((child) => (
                  <li key={child.href}><SubLink item={child} current={child.href === current} onClick={(e) => go(e, child.href)} /></li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Modal>
    </nav>
  );
}

/**
 * Header with always-visible navigation: every option is a labelled link or button, never a hidden gesture.
 * Wide screens show the `items` in one row (a few at most; pages under an item open from it).
 * With `tabs`, phones get those few pages in a bar at the bottom of the screen plus "Mais" for the rest;
 * `onNavigate` lets that window open pages inside the app.
 */
export function SiteHeader({ brand, homeHref, items, currentPath, urgent, tools, tabs, onNavigate }: {
  brand: ReactNode; homeHref: string; items: NavItem[]; currentPath: string; urgent?: NavItem; tools?: ReactNode; tabs?: NavItem[]; onNavigate?: (href: string) => void;
}) {
  const current = currentHref(items, currentPath, homeHref);
  const text = useUiText();
  return (
    <header className={tabs ? "gn-header gn-header--tabbar" : "gn-header"}>
      <a className="gn-skip" href="#conteudo">{text.skipToContent}</a>
      <div className="gn-header__inner gn-container">
        <a className="gn-header__brand" href={homeHref}>{brand}</a>
        <div className="gn-header__tools">
          {tools}
          {urgent ? <Button href={urgent.href} variant="urgent" icon={urgent.icon}>{urgent.label}</Button> : null}
        </div>
        <TopMenu items={items} currentPath={currentPath} current={current} />
      </div>
      {tabs ? <TabBar tabs={tabs} items={items} currentPath={currentPath} current={current} homeHref={homeHref} onNavigate={onNavigate} /> : null}
    </header>
  );
}

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  const text = useUiText();
  return (
    <nav aria-label={text.youAreHere} className="gn-crumbs">
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
