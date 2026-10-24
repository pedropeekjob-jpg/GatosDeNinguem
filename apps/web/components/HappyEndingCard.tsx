import { Card } from "@gn/ui";
import type { HappyEndingItem } from "@/lib/content";
import { durationSince } from "@gn/domain";
import { When } from "./When";

/** One adopted cat: the photo from the new home when there is one, the family's words and who they are (only with consent). */
export function HappyEndingCard({ item: { cat, happyEnding }, titleAs = "h3" }: { item: HappyEndingItem; titleAs?: "h2" | "h3" }) {
  const photo = happyEnding?.photo ?? cat.photos[0]!;
  const who = happyEnding?.adopterName ? `${happyEnding.adopterName}${happyEnding.adopterTown ? `, ${happyEnding.adopterTown}` : ""}` : undefined;
  return (
    <Card
      className="happy-card"
      titleAs={titleAs}
      title={cat.name}
      href={`/adotar/${cat.slug}`}
      media={{ src: photo.url, alt: photo.alt }}
      subtitle={cat.adoptedAt ? (
        <>
          Adotad{cat.sex === "femea" ? "a" : "o"} a <When iso={cat.adoptedAt} />
          {cat.arrivedAt && cat.arrivedAt < cat.adoptedAt ? `, depois de ${durationSince(cat.arrivedAt, new Date(cat.adoptedAt))} no gatil` : null}
        </>
      ) : undefined}
    >
      <p className="happy-card__quote">“{happyEnding?.text ?? cat.summary}”</p>
      {who ? <p className="small muted">{who}</p> : null}
    </Card>
  );
}
