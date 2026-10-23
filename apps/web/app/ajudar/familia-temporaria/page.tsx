import { Container, Section } from "@gn/ui";
import { CatCard } from "@/components/CatCard";
import { FosterForm } from "@/components/forms/FosterForm";
import { PageHero } from "@/components/PageHero";
import { listCats, listCatsNeedingFoster } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

const intro = "Acolha em casa um gato a recuperar ou gatinhos sem mãe, até encontrarem família. A associação paga a comida, a areia e o veterinário.";

export async function generateMetadata() {
  return buildMetadata({ path: "/ajudar/familia-temporaria", title: "Ser família temporária", description: intro });
}

export default async function FosterPage() {
  const [needs, cats] = await Promise.all([listCatsNeedingFoster().catch(() => []), listCats()]);
  const waiting = needs.flatMap((n) => {
    const cat = cats.find((c) => c.slug === n.catSlug);
    return cat ? [{ cat, notes: n.notes }] : [];
  });
  return (
    <>
      <PageHero heading="Ser família temporária" intro={intro} crumbs={[{ href: "/", label: "Início" }, { href: "/ajudar", label: "Ajudar" }, { label: "Família temporária" }]}>
        <div className="action-row"><a className="gn-btn gn-btn--primary" href="#quero-ser">Quero ser família temporária</a></div>
      </PageHero>

      <Section heading="Como funciona">
        <ol className="steps">
          <li><span><strong>Deixe os seus dados</strong> aqui em baixo. Não fica com nenhum compromisso.</span></li>
          <li><span><strong>Ligamos-lhe</strong> para conversar e escolher juntos um gato que encaixe na sua casa.</span></li>
          <li><span><strong>O gato fica consigo</strong> umas semanas. Levamos tudo o que precisa e estamos sempre contactáveis.</span></li>
          <li><span><strong>Quando for adotado,</strong> despede-se dele sabendo que lhe salvou a vida.</span></li>
        </ol>
        <div className="foster-split">
          <div className="foster-split__box">
            <h3>Nós tratamos de</h3>
            <ul><li>Comida e areia</li><li>Veterinário e medicação</li><li>Transportadora e caminha</li><li>Ajuda sempre que precisar</li></ul>
          </div>
          <div className="foster-split__box">
            <h3>Você dá</h3>
            <ul><li>Um canto sossegado em casa</li><li>Carinho e companhia</li><li>Notícias e fotos de vez em quando</li></ul>
          </div>
        </div>
      </Section>

      {waiting.length > 0 ? (
        <Section tone="soft" heading={waiting.length === 1 ? "Este gato precisa de família temporária agora" : "Estes gatos precisam de família temporária agora"}>
          <ul className="cat-rail__track" role="list">
            {waiting.map(({ cat, notes }) => (
              <li key={cat.id} className="foster-need">
                <CatCard cat={cat} />
                {notes ? <p className="foster-need__note">{notes}</p> : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <section id="quero-ser" className="gn-section" aria-labelledby="quero-ser-titulo">
        <Container narrow>
          <div className="gn-stack gn-stack--m">
            <h2 id="quero-ser-titulo">Quero ser família temporária</h2>
            <p>Leva dois minutos. Ligamos-lhe nos próximos dias.</p>
            <FosterForm />
          </div>
        </Container>
      </section>
    </>
  );
}
