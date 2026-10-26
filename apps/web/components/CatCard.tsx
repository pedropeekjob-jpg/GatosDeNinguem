import { isSenior } from "@gn/domain";
import { Badge, Card } from "@gn/ui";
import type { PublicCat } from "@/lib/content";
import { localizeCat } from "@/lib/i18n/content";
import { ageLabel, catWords, sexLabel, statusLabel } from "@/lib/i18n/labels";
import { i18n } from "@/lib/i18n/server";
import { FavoriteButton } from "./client/FavoriteButton";
import { TimeAgo } from "./client/TimeAgo";
import { When } from "./When";

/** Photo-first: the picture, the name, "11 anos · Macho", how long it has waited, and only the badges that tell something new.
 *  sponsor: the card leads to sponsoring the cat instead of its adoption page. */
export function CatCard({ cat: original, titleAs = "h3", sponsor }: { cat: PublicCat; titleAs?: "h2" | "h3"; sponsor?: boolean }) {
  const { lang, t, l } = i18n();
  const cat = localizeCat(original, lang);
  const words = catWords(lang, cat.sex);
  const photo = cat.photos[0]!;
  const showStatus = cat.status !== "para-adocao";
  const badges = showStatus || isSenior(cat) || cat.specialNeeds;
  return (
    <Card
      className="cat-card"
      titleAs={titleAs}
      title={cat.name}
      href={l(sponsor ? `/apadrinhar/${cat.slug}` : `/adotar/${cat.slug}`)}
      media={{ src: photo.url, alt: photo.alt }}
      mediaAction={cat.status === "para-adocao" && !sponsor ? <FavoriteButton slug={cat.slug} name={cat.name} compact /> : undefined}
      subtitle={`${ageLabel(lang, cat.ageYears)} · ${sexLabel[lang][cat.sex]}`}
      badges={
        badges ? (
          <>
            {showStatus ? <Badge tone="neutral">{statusLabel[lang][cat.status]}</Badge> : null}
            {isSenior(cat) ? <Badge tone="info">{words.senior}</Badge> : null}
            {cat.specialNeeds ? <Badge tone="warning">{words.specialCare}</Badge> : null}
          </>
        ) : undefined
      }
    >
      {cat.status === "adotado" && cat.adoptedAt ? (
        <p className="cat-card__when">{t({ pt: `${words.adopted} a `, en: `${words.adopted} on `, es: `${words.adopted} el `, fr: `${words.adopted} le ` })}<When iso={cat.adoptedAt} format="short" /></p>
      ) : cat.arrivedAt ? (
        <p className="cat-card__when">{t({ pt: "No gatil ", en: "At the shelter for ", es: "En el refugio desde hace ", fr: "Au refuge depuis " })}<TimeAgo iso={cat.arrivedAt} kind={lang === "pt" ? "since" : "duration"} renderedAt={new Date().toISOString()} /></p>
      ) : null}
      <p lang={cat.ptOnly ? "pt-PT" : undefined}>{cat.summary}</p>
    </Card>
  );
}
