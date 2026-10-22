import type { ReactNode } from "react";

export type CardProps = {
  title: ReactNode;
  /** Heading level for the title so cards fit any page outline. */
  titleAs?: "h2" | "h3" | "h4";
  href?: string;
  eyebrow?: ReactNode;
  media?: { src: string; alt: string };
  meta?: { label: string; value: ReactNode }[];
  badges?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
};

/** Generic content card. Knows nothing about cats, people or products. */
export function Card({ title, titleAs: H = "h3", href, eyebrow, media, meta, badges, actions, children }: CardProps) {
  return (
    <article className="gn-card">
      {media ? <img className="gn-card__media" src={media.src} alt={media.alt} loading="lazy" /> : null}
      <div className="gn-card__body">
        {eyebrow ? <p className="gn-eyebrow">{eyebrow}</p> : null}
        <H className="gn-card__title">{href ? <a href={href}>{title}</a> : title}</H>
        {badges ? <div className="gn-card__badges">{badges}</div> : null}
        {children ? <div className="gn-card__text">{children}</div> : null}
        {meta && meta.length > 0 ? (
          <dl className="gn-card__meta">
            {meta.map((m) => (
              <div key={m.label}>
                <dt>{m.label}</dt>
                <dd>{m.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {actions ? <div className="gn-card__actions">{actions}</div> : null}
      </div>
    </article>
  );
}
