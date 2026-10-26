import { isSenior } from "@gn/domain";
import { Badge, Button, Container } from "@gn/ui";
import type { PublicCat } from "@/lib/content";
import { localizeCat } from "@/lib/i18n/content";
import { ageLabel, catWords, sexLabel } from "@/lib/i18n/labels";
import { i18n } from "@/lib/i18n/server";

/** "Gato da semana": one cat shown big, picture and words side by side on wide screens. */
export function FeaturedCat({ cat: original }: { cat: PublicCat }) {
  const { lang, t, l } = i18n();
  const cat = localizeCat(original, lang);
  const words = catWords(lang, cat.sex);
  const photo = cat.photos[0]!;
  const eyebrow = t({ pt: "Gato da semana", en: "Cat of the week", es: "Gato de la semana", fr: "Chat de la semaine" });
  return (
    <section className="gn-section gn-section--soft featured" aria-labelledby="gato-da-semana">
      <Container>
        <div className="featured__grid">
          <img className="featured__photo" src={photo.url} alt={photo.alt} width={400} height={300} />
          <div className="featured__body">
            <p className="featured__eyebrow">{eyebrow}</p>
            <h2 id="gato-da-semana" className="featured__name">
              <span className="gn-sr-only">{eyebrow}: </span>{cat.name}
            </h2>
            <p className="gn-lead" lang={cat.ptOnly ? "pt-PT" : undefined}>{cat.summary}</p>
            <div className="featured__facts">
              <dl>
                <div><dt>{t({ pt: "Idade", en: "Age", es: "Edad", fr: "Âge" })}</dt><dd>{ageLabel(lang, cat.ageYears)}</dd></div>
                <div><dt>{t({ pt: "Sexo", en: "Sex", es: "Sexo", fr: "Sexe" })}</dt><dd>{sexLabel[lang][cat.sex]}</dd></div>
              </dl>
              {isSenior(cat) || cat.specialNeeds ? (
                <div className="featured__badges">
                  {isSenior(cat) ? <Badge tone="info">{words.senior}</Badge> : null}
                  {cat.specialNeeds ? <Badge tone="warning">{words.specialCare}</Badge> : null}
                </div>
              ) : null}
            </div>
            <p className="featured__story" lang={cat.ptOnly ? "pt-PT" : undefined}>{cat.story}</p>
            <div className="action-row">
              <Button href={l(`/adotar/${cat.slug}`)}>{t({ pt: `Conhecer ${cat.name}`, en: `Meet ${cat.name}`, es: `Conocer a ${cat.name}`, fr: `Rencontrer ${cat.name}` })}</Button>
              <Button href={l(`/apadrinhar/${cat.slug}`)} variant="secondary">{t({ pt: "Apadrinhar", en: "Sponsor", es: "Apadrinar", fr: "Parrainer" })}<span className="gn-sr-only"> {cat.name}</span></Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
