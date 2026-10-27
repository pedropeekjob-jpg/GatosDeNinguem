import { Container } from "@gn/ui";
import type { PublicCat } from "@/lib/content";
import { i18n } from "@/lib/i18n/server";
import { CatCard } from "./CatCard";

/** "Procuram família" on the home page. Phones: a row to swipe, with the next cat peeking in so the row reads as scrollable.
 *  Wide screens: a plain grid. It never moves by itself. */
export function CatRail({ cats, total }: { cats: PublicCat[]; total: number }) {
  const { t, l } = i18n();
  if (cats.length === 0) return null;
  return (
    <section className="cat-rail" aria-labelledby="procuram-familia">
      <Container>
        <div className="cat-rail__head">
          <h2 id="procuram-familia">{t({ pt: "Procuram família", en: "Looking for a family", es: "Buscan familia", fr: "Cherchent une famille" })}</h2>
          <a className="cat-rail__all" href={l("/adotar")}>{t({ pt: `Ver os ${total}`, en: `See all ${total}`, es: `Ver los ${total}`, fr: `Voir les ${total}` })}</a>
        </div>
        <ul className="cat-rail__track" role="list">
          {cats.map((cat) => <li key={cat.id}><CatCard cat={cat} /></li>)}
        </ul>
      </Container>
    </section>
  );
}
