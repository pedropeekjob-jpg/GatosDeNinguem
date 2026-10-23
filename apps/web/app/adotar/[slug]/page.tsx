import { notFound } from "next/navigation";
import { ageLabel, statusLabel } from "@gn/domain";
import { breadcrumbJsonLd } from "@gn/seo";
import { Badge, Container, Notice, ShareBar } from "@gn/ui";
import { FavoriteButton } from "@/components/client/FavoriteButton";
import { FormModal } from "@/components/client/FormModal";
import { AdoptionInterestForm } from "@/components/forms/AdoptionInterestForm";
import { SponsorForm } from "@/components/forms/SponsorForm";
import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { getCat, getSeoSettings, listCats } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  // Pre-rendering is only a speed-up: if the API is down, the pages are built on request instead.
  return (await listCats().catch(() => [])).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props) {
  const cat = await getCat((await params).slug);
  if (!cat) return {};
  const kind = cat.sex === "femea" ? "gata" : "gato";
  const title = cat.status === "adotado" ? `${cat.name}, ${kind} adotad${cat.sex === "femea" ? "a" : "o"}` : `${cat.name}, ${kind} para adoção em Viana do Castelo`;
  return buildMetadata({ path: `/adotar/${cat.slug}`, title, description: cat.summary, image: cat.photos[0]?.url, overrides: cat.seo });
}

const yesNo = (v: boolean | undefined) => (v === undefined ? "Ainda não sabemos" : v ? "Sim" : "Não");

export default async function CatPage({ params }: Props) {
  const cat = await getCat((await params).slug);
  if (!cat) notFound();
  const settings = await getSeoSettings();
  const url = `${settings.siteUrl}/adotar/${cat.slug}`;
  const photo = cat.photos[0]!;
  const pronoun = cat.sex === "femea" ? "a" : "o";

  return (
    <>
      <PageHero heading={cat.name} crumbs={[{ href: "/", label: "Início" }, { href: "/adotar", label: "Adotar" }, { label: cat.name }]}>
        <div className="action-row">
          <Badge tone={cat.status === "para-adocao" ? "success" : "neutral"}>{statusLabel[cat.status]}</Badge>
          {cat.specialNeeds ? <Badge tone="warning">Cuidados especiais</Badge> : null}
        </div>
      </PageHero>
      <Container>
        <div className="cat-profile">
          <img className="cat-profile__photo" src={photo.url} alt={photo.alt} width={800} height={600} />
          <div className="gn-stack gn-stack--m">
            <p className="gn-lead">{cat.summary}</p>
            {cat.status === "para-adocao" ? (
              <div className="action-row cat-profile__cta">
                <FormModal
                  label={`Quero conhecer ${pronoun} ${cat.name}`}
                  href={`/adotar/${cat.slug}/conhecer`}
                  title={`Quero conhecer ${pronoun} ${cat.name}`}
                  intro="Deixe o seu contacto. Ligamos-lhe para conversar e marcar uma visita. Não precisa de decidir nada agora."
                >
                  <AdoptionInterestForm catSlug={cat.slug} catName={cat.name} />
                </FormModal>
                <FavoriteButton slug={cat.slug} name={cat.name} compact />
              </div>
            ) : null}
            {cat.status === "adotado" && cat.happyEnding ? (
              <Notice tone="success" title={`${cat.name} já tem família!`}>
                <p>“{cat.happyEnding.text}”</p>
                {cat.happyEnding.adopterName ? <p className="small">{cat.happyEnding.adopterName}{cat.happyEnding.adopterTown ? `, ${cat.happyEnding.adopterTown}` : ""}</p> : null}
              </Notice>
            ) : null}
            <dl className="facts">
              <div><dt>Idade</dt><dd>{ageLabel(cat.ageYears)}</dd></div>
              <div><dt>Sexo</dt><dd>{cat.sex === "femea" ? "Fêmea" : "Macho"}</dd></div>
              <div><dt>Feitio</dt><dd>{cat.traits.join(", ") || "A conhecer"}</dd></div>
              <div><dt>Dá-se bem com crianças</dt><dd>{yesNo(cat.goodWithKids)}</dd></div>
              <div><dt>Dá-se bem com gatos</dt><dd>{yesNo(cat.goodWithCats)}</dd></div>
              <div><dt>Dá-se bem com cães</dt><dd>{yesNo(cat.goodWithDogs)}</dd></div>
              <div><dt>Esterilizad{pronoun}</dt><dd>{cat.sterilized ? "Sim" : "Não"}</dd></div>
              <div><dt>Vacinad{pronoun}</dt><dd>{cat.vaccinated ? "Sim" : "Não"}</dd></div>
              <div><dt>Com chip</dt><dd>{cat.microchipped ? "Sim" : "Não"}</dd></div>
            </dl>
            {cat.specialNeeds ? <Notice tone="warning" title="Cuidados especiais">{cat.specialNeeds}. A associação explica tudo e ajuda nos primeiros tempos.</Notice> : null}
            <h2>A história d{pronoun} {cat.name}</h2>
            <p>{cat.story}</p>
            {cat.status !== "adotado" ? (
              <Notice tone="info" title={`Não pode adotar? Pode apadrinhar ${pronoun} ${cat.name}`}>
                <p>A partir de 5 euros por mês ajuda a pagar a comida e o veterinário, e recebe notícias.</p>
                <div className="action-row">
                  <FormModal
                    label={`Apadrinhar ${pronoun} ${cat.name}`}
                    href={`/apadrinhar/${cat.slug}`}
                    variant="secondary"
                    title={`Apadrinhar ${pronoun} ${cat.name}`}
                    intro="Deixe os seus dados e entramos em contacto para combinar."
                  >
                    <SponsorForm catSlug={cat.slug} catName={cat.name} pronoun={pronoun} />
                  </FormModal>
                </div>
              </Notice>
            ) : null}
            <ShareBar url={url} text={cat.status === "adotado" ? `${cat.name} encontrou família!` : `Conheça ${pronoun} ${cat.name}, procura família em Viana do Castelo`} label={`Partilhar ${pronoun} ${cat.name}`} />
          </div>
        </div>
      </Container>
      <JsonLd data={[breadcrumbJsonLd(settings, [{ name: "Início", path: "/" }, { name: "Adotar", path: "/adotar" }, { name: cat.name, path: `/adotar/${cat.slug}` }]), ...(cat.seo.jsonLd ?? [])]} />
    </>
  );
}
