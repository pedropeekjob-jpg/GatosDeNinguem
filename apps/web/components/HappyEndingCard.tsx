import { Card } from "@gn/ui";
import type { HappyEndingItem } from "@/lib/content";
import { formatDate } from "@/lib/format";

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
      subtitle={cat.adoptedAt ? `Adotad${cat.sex === "femea" ? "a" : "o"} em ${formatDate(cat.adoptedAt)}` : undefined}
    >
      <p className="happy-card__quote">“{happyEnding?.text ?? cat.summary}”</p>
      {who ? <p className="small muted">{who}</p> : null}
    </Card>
  );
}
