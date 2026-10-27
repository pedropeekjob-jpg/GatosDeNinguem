import { Breadcrumbs, Container } from "@gn/ui";
import type { ReactNode } from "react";
import { i18n } from "@/lib/i18n/server";

/** A page's title and first words. Breadcrumb links are written as Portuguese addresses and get the visitor's language here.
 *  introLang: set when the intro is shown in Portuguese on a page in another language (no translation yet). */
export function PageHero({ heading, intro, introLang, crumbs, children }: { heading: string; intro?: string; introLang?: string; crumbs?: { href?: string; label: string }[]; children?: ReactNode }) {
  const { l } = i18n();
  return (
    <div className="page-hero">
      <Container>
        {crumbs ? <Breadcrumbs items={crumbs.map((c) => (c.href ? { ...c, href: l(c.href) } : c))} /> : null}
        <h1>{heading}</h1>
        {intro ? <p className="gn-lead" lang={introLang}>{intro}</p> : null}
        {children}
      </Container>
    </div>
  );
}
