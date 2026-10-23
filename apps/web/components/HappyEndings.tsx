import { Container } from "@gn/ui";
import type { HappyEndingItem } from "@/lib/content";
import { HappyEndingCard } from "./HappyEndingCard";

/** Home: proof that adopting works. The newest happy endings, swipeable on phones like "Procuram família". */
export function HappyEndings({ items }: { items: HappyEndingItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="happy-home" aria-labelledby="finais-felizes">
      <Container>
        <div className="cat-rail__head">
          <div>
            <h2 id="finais-felizes">Finais felizes</h2>
            <p className="happy-home__count">{items.length === 1 ? "1 gato já encontrou família" : `${items.length} gatos já encontraram família`}</p>
          </div>
          <a className="cat-rail__all" href="/finais-felizes">Ver todos</a>
        </div>
        <ul className="cat-rail__track" role="list">
          {items.slice(0, 6).map((item) => <li key={item.cat.id}><HappyEndingCard item={item} /></li>)}
        </ul>
      </Container>
    </section>
  );
}
