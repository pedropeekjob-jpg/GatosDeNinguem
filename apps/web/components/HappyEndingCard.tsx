import { Card } from "@gn/ui";
import type { HappyEndingItem } from "@/lib/content";
import { localizeHappyEnding } from "@/lib/i18n/content";
import { catWords, dates } from "@/lib/i18n/labels";
import { i18n } from "@/lib/i18n/server";
import { When } from "./When";

/** One adopted cat: the photo from the new home when there is one, the family's words and who they are (only with consent). */
export function HappyEndingCard({ item, titleAs = "h3" }: { item: HappyEndingItem; titleAs?: "h2" | "h3" }) {
  const { lang, t, l } = i18n();
  const { cat, happyEnding } = localizeHappyEnding(item, lang);
  const photo = happyEnding?.photo ?? cat.photos[0]!;
  const who = happyEnding?.adopterName ? `${happyEnding.adopterName}${happyEnding.adopterTown ? `, ${happyEnding.adopterTown}` : ""}` : undefined;
  const adopted = catWords(lang, cat.sex).adopted;
  const translated = lang === "pt" || !!item.cat.translations?.[lang]?.happyEndingText;
  return (
    <Card
      className="happy-card"
      titleAs={titleAs}
      title={cat.name}
      href={l(`/adotar/${cat.slug}`)}
      media={{ src: photo.url, alt: photo.alt }}
      subtitle={cat.adoptedAt ? (
        <>
          {t({ pt: `${adopted} a `, en: `${adopted} on `, es: `${adopted} el `, fr: `${adopted} le ` })}<When iso={cat.adoptedAt} />
          {cat.arrivedAt && cat.arrivedAt < cat.adoptedAt ? (() => {
            const time = dates(lang).durationSince(cat.arrivedAt, new Date(cat.adoptedAt));
            return t({ pt: `, depois de ${time} no gatil`, en: `, after ${time} at the shelter`, es: `, después de ${time} en el refugio`, fr: `, après ${time} au refuge` });
          })() : null}
        </>
      ) : undefined}
    >
      <p className="happy-card__quote" lang={translated ? undefined : "pt-PT"}>“{happyEnding?.text ?? cat.summary}”</p>
      {who ? <p className="small muted">{who}</p> : null}
    </Card>
  );
}
