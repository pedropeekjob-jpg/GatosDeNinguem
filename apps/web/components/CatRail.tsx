import { Container } from "@gn/ui";
import type { PublicCat } from "@/lib/content";
import { CatCard } from "./CatCard";

/** "Procuram família" on the home page. Phones: a row to swipe, with the next cat peeking in so the row reads as scrollable.
 *  Wide screens: a plain grid. It never moves by itself. */
export function CatRail({ cats, total }: { cats: PublicCat[]; total: number }) {
  if (cats.length === 0) return null;
  return (
    <section className="cat-rail" aria-labelledby="procuram-familia">
      <Container>
        <div className="cat-rail__head">
          <h2 id="procuram-familia">Procuram família</h2>
          <a className="cat-rail__all" href="/adotar">Ver os {total}</a>
        </div>
        <ul className="cat-rail__track" role="list">
          {cats.map((cat) => <li key={cat.id}><CatCard cat={cat} /></li>)}
        </ul>
      </Container>
    </section>
  );
}
