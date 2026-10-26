import { Button, Grid, Notice, Section } from "@gn/ui";
import { catFilterTags } from "@gn/domain";
import { AdoptionSteps } from "@/components/AdoptionSteps";
import { CatCard } from "@/components/CatCard";
import { CatAlertButton } from "@/components/client/CatAlerts";
import { CatFilter } from "@/components/client/CatFilter";
import { FavoritesStrip } from "@/components/client/FavoritesStrip";
import { PageHero } from "@/components/PageHero";
import { getPage, listCats, listHappyEndings, type PublicCat } from "@/lib/content";
import { localizePage } from "@/lib/i18n/content";
import { adoptionSteps, catFilters, crumbs } from "@/lib/i18n/labels";
import { langFrom, type LangProps } from "@/lib/i18n/server";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: LangProps) {
  const { lang } = await langFrom(params);
  const page = localizePage(await getPage("/adotar"), lang);
  return buildMetadata({ path: "/adotar", title: page.heading, description: page.intro, overrides: page.seo });
}

/** The words a filter chip matches against: age, who the cat lives well with, energy, sex, special needs. */
const tags = (cat: PublicCat) => catFilterTags(cat).join(" ");

export default async function AdoptPage({ params }: LangProps) {
  const { lang, t, l } = await langFrom(params);
  const [ptPage, available, recovering, happy] = await Promise.all([getPage("/adotar"), listCats("para-adocao"), listCats("a-recuperar"), listHappyEndings()]);
  const page = localizePage(ptPage, lang);
  const c = crumbs[lang];
  const n = available.length;
  return (
    <>
      <PageHero heading={page.heading} intro={page.intro} introLang={page.ptOnly ? "pt-PT" : undefined} crumbs={[{ href: "/", label: c.home }, { label: c.adopt }]}>
        <div className="action-row">
          <Button href={l("/adotar/descobrir")}>{t({ pt: "Ajude-me a escolher", en: "Help me choose", es: "Ayúdeme a elegir", fr: "Aidez-moi à choisir" })}</Button>
          <CatAlertButton />
        </div>
        <FavoritesStrip cats={available} />
        {happy.length > 0 ? (
          <a className="happy-link" href={l("/finais-felizes")}>
            <span className="happy-link__faces" aria-hidden="true">
              {happy.slice(0, 3).map(({ cat, happyEnding }) => { const p = happyEnding?.photo ?? cat.photos[0]!; return <img key={cat.id} src={p.url} alt="" width={40} height={40} />; })}
            </span>
            <span>{t({
              pt: <><strong>{happy.length} {happy.length === 1 ? "gato já encontrou" : "gatos já encontraram"} família.</strong> Ver os finais felizes</>,
              en: <><strong>{happy.length} {happy.length === 1 ? "cat has" : "cats have"} already found a family.</strong> See the happy endings</>,
              es: <><strong>{happy.length} {happy.length === 1 ? "gato ya encontró" : "gatos ya encontraron"} familia.</strong> Ver los finales felices</>,
              fr: <><strong>{happy.length} {happy.length === 1 ? "chat a" : "chats ont"} déjà trouvé une famille.</strong> Voir les belles histoires</>,
            })}</span>
          </a>
        ) : null}
      </PageHero>
      <Section heading={t({ pt: `${n} gatos procuram família`, en: `${n} cats are looking for a family`, es: `${n} gatos buscan familia`, fr: `${n} chats cherchent une famille` })}>
        <CatFilter
          total={n}
          wrap
          options={catFilters(lang).map((f) => ({ value: f.value, label: f.label, count: available.filter(f.test).length }))}
        >
          <Grid>{available.map((cat) => <div key={cat.id} data-f={tags(cat)}><CatCard cat={cat} /></div>)}</Grid>
        </CatFilter>
      </Section>
      {recovering.length > 0 ? (
        <Section
          tone="soft"
          heading={t({ pt: "Em breve", en: "Coming soon", es: "Próximamente", fr: "Bientôt" })}
          intro={t({ pt: "Estes gatos ainda estão a recuperar. Pode apadrinhá-los enquanto esperam.", en: "These cats are still recovering. You can sponsor them while they wait.", es: "Estos gatos aún se están recuperando. Puede apadrinarlos mientras esperan.", fr: "Ces chats sont encore en convalescence. Vous pouvez les parrainer en attendant." })}
        >
          <div className="action-row"><Button href={l("/apadrinhar")} variant="secondary">{t({ pt: "Apadrinhar um gato", en: "Sponsor a cat", es: "Apadrinar un gato", fr: "Parrainer un chat" })}</Button></div>
          <Grid>{recovering.map((cat) => <CatCard key={cat.id} cat={cat} />)}</Grid>
        </Section>
      ) : null}
      <Section heading={t({ pt: "Como funciona a adoção", en: "How adoption works", es: "Cómo funciona la adopción", fr: "Comment se passe l’adoption" })}>
        <AdoptionSteps steps={adoptionSteps[lang]} />
        <Notice tone="info" title={t({ pt: "Adotar é para toda a vida", en: "Adoption is for life", es: "Adoptar es para toda la vida", fr: "Adopter, c’est pour la vie" })}>
          {t({ pt: "Um gato pode viver 15 a 20 anos. Pense com calma; estamos aqui para ajudar.", en: "A cat can live 15 to 20 years. Take your time to think; we are here to help.", es: "Un gato puede vivir de 15 a 20 años. Piénselo con calma; estamos aquí para ayudar.", fr: "Un chat peut vivre 15 à 20 ans. Prenez le temps de réfléchir ; nous sommes là pour vous aider." })}
        </Notice>
        <div className="action-row"><Button href={l("/adotar/perguntas")} variant="secondary">{t({ pt: "Perguntas sobre adotar", en: "Questions about adopting", es: "Preguntas sobre adoptar", fr: "Questions sur l’adoption" })}</Button></div>
      </Section>
    </>
  );
}
