import type { ReactNode } from "react";

export type CardProps = {
  title: ReactNode;
  /** Heading level for the title so cards fit any page outline. */
  titleAs?: "h2" | "h3" | "h4";
  href?: string;
  eyebrow?: ReactNode;
  media?: { src: string; alt: string };
  /** A small control laid over the top corner of the photo, e.g. a save button. */
  mediaAction?: ReactNode;
  /** One short line under the title, e.g. key facts joined with " · ". */
  subtitle?: ReactNode;
  className?: string;
  meta?: { label: string; value: ReactNode }[];
  badges?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
};

/** Generic content card. Knows nothing about cats, people or products. */
export function Card({ title, titleAs: H = "h3", href, eyebrow, media, mediaAction, subtitle, className, meta, badges, actions, children }: CardProps) {
  const img = media ? <img className="gn-card__media" src={media.src} alt={media.alt} loading="lazy" /> : null;
  return (
    <article className={className ? `gn-card ${className}` : "gn-card"}>
      {img && mediaAction ? <div className="gn-card__media-wrap">{img}<div className="gn-card__media-action">{mediaAction}</div></div> : img}
      <div className="gn-card__body">
        {eyebrow ? <p className="gn-eyebrow">{eyebrow}</p> : null}
        <H className="gn-card__title">{href ? <a href={href}>{title}</a> : title}</H>
        {subtitle ? <p className="gn-card__subtitle">{subtitle}</p> : null}
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
