import { ageLabel, isSenior } from "@gn/domain";
import { Badge, Button, Container } from "@gn/ui";
import type { PublicCat } from "@/lib/content";

/** "Gato da semana": one cat shown big, picture and words side by side on wide screens. */
export function FeaturedCat({ cat }: { cat: PublicCat }) {
  const photo = cat.photos[0]!;
  return (
    <section className="gn-section gn-section--soft featured" aria-labelledby="gato-da-semana">
      <Container>
        <div className="featured__grid">
          <img className="featured__photo" src={photo.url} alt={photo.alt} width={400} height={300} />
          <div className="featured__body">
            <p className="featured__eyebrow">Gato da semana</p>
            <h2 id="gato-da-semana" className="featured__name">
              <span className="gn-sr-only">Gato da semana: </span>{cat.name}
            </h2>
            <p className="gn-lead">{cat.summary}</p>
            <div className="featured__facts">
              <dl>
                <div><dt>Idade</dt><dd>{ageLabel(cat.ageYears)}</dd></div>
                <div><dt>Sexo</dt><dd>{cat.sex === "femea" ? "Fêmea" : "Macho"}</dd></div>
              </dl>
              {isSenior(cat) || cat.specialNeeds ? (
                <div className="featured__badges">
                  {isSenior(cat) ? <Badge tone="info">Sénior</Badge> : null}
                  {cat.specialNeeds ? <Badge tone="warning">Cuidados especiais</Badge> : null}
                </div>
              ) : null}
            </div>
            <p className="featured__story">{cat.story}</p>
            <div className="action-row">
              <Button href={`/adotar/${cat.slug}`}>Conhecer {cat.name}</Button>
              <Button href={`/apadrinhar/${cat.slug}`} variant="secondary">Apadrinhar<span className="gn-sr-only"> {cat.name}</span></Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
