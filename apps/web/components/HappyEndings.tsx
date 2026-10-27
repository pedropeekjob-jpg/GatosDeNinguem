import { Container } from "@gn/ui";
import type { HappyEndingItem } from "@/lib/content";
import { i18n } from "@/lib/i18n/server";
import { HappyEndingCard } from "./HappyEndingCard";

/** Home: proof that adopting works. The newest happy endings, swipeable on phones like "Procuram família". */
export function HappyEndings({ items }: { items: HappyEndingItem[] }) {
  const { t, l } = i18n();
  if (items.length === 0) return null;
  const n = items.length;
  return (
    <section className="happy-home" aria-labelledby="finais-felizes">
      <Container>
        <div className="cat-rail__head">
          <div>
            <h2 id="finais-felizes">{t({ pt: "Finais felizes", en: "Happy endings", es: "Finales felices", fr: "Belles histoires" })}</h2>
            <p className="happy-home__count">{t({
              pt: n === 1 ? "1 gato já encontrou família" : `${n} gatos já encontraram família`,
              en: n === 1 ? "1 cat has already found a family" : `${n} cats have already found a family`,
              es: n === 1 ? "1 gato ya encontró familia" : `${n} gatos ya encontraron familia`,
              fr: n === 1 ? "1 chat a déjà trouvé une famille" : `${n} chats ont déjà trouvé une famille`,
            })}</p>
          </div>
          <a className="cat-rail__all" href={l("/finais-felizes")}>{t({ pt: "Ver todos", en: "See all", es: "Ver todos", fr: "Tout voir" })}</a>
        </div>
        <ul className="cat-rail__track" role="list">
          {items.slice(0, 6).map((item) => <li key={item.cat.id}><HappyEndingCard item={item} /></li>)}
        </ul>
      </Container>
    </section>
  );
}
