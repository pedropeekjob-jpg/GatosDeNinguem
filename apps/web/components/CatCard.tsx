import { ageLabel, isSenior, statusLabel } from "@gn/domain";
import { Badge, Card } from "@gn/ui";
import type { PublicCat } from "@/lib/content";
import { FavoriteButton } from "./client/FavoriteButton";
import { TimeAgo } from "./client/TimeAgo";
import { When } from "./When";

/** Photo-first: the picture, the name, "11 anos · Macho", how long it has waited, and only the badges that tell something new.
 *  sponsor: the card leads to sponsoring the cat instead of its adoption page. */
export function CatCard({ cat, titleAs = "h3", sponsor }: { cat: PublicCat; titleAs?: "h2" | "h3"; sponsor?: boolean }) {
  const photo = cat.photos[0]!;
  const showStatus = cat.status !== "para-adocao";
  const badges = showStatus || isSenior(cat) || cat.specialNeeds;
  return (
    <Card
      className="cat-card"
      titleAs={titleAs}
      title={cat.name}
      href={sponsor ? `/apadrinhar/${cat.slug}` : `/adotar/${cat.slug}`}
      media={{ src: photo.url, alt: photo.alt }}
      mediaAction={cat.status === "para-adocao" && !sponsor ? <FavoriteButton slug={cat.slug} name={cat.name} compact /> : undefined}
      subtitle={`${ageLabel(cat.ageYears)} · ${cat.sex === "femea" ? "Fêmea" : "Macho"}`}
      badges={
        badges ? (
          <>
            {showStatus ? <Badge tone="neutral">{statusLabel[cat.status]}</Badge> : null}
            {isSenior(cat) ? <Badge tone="info">Sénior</Badge> : null}
            {cat.specialNeeds ? <Badge tone="warning">Cuidados especiais</Badge> : null}
          </>
        ) : undefined
      }
    >
      {cat.status === "adotado" && cat.adoptedAt ? (
        <p className="cat-card__when">Adotad{cat.sex === "femea" ? "a" : "o"} a <When iso={cat.adoptedAt} format="short" /></p>
      ) : cat.arrivedAt ? (
        <p className="cat-card__when">No gatil <TimeAgo iso={cat.arrivedAt} renderedAt={new Date().toISOString()} /></p>
      ) : null}
      <p>{cat.summary}</p>
    </Card>
  );
}
