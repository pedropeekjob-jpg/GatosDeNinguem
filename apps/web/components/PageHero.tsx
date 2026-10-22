import { Breadcrumbs, Container } from "@gn/ui";
import type { ReactNode } from "react";

export function PageHero({ heading, intro, crumbs, children }: { heading: string; intro?: string; crumbs?: { href?: string; label: string }[]; children?: ReactNode }) {
  return (
    <div className="page-hero">
      <Container>
        {crumbs ? <Breadcrumbs items={crumbs} /> : null}
        <h1>{heading}</h1>
        {intro ? <p className="gn-lead">{intro}</p> : null}
        {children}
      </Container>
    </div>
  );
}
