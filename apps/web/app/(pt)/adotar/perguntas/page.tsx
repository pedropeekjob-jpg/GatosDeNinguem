import { breadcrumbJsonLd, faqJsonLd } from "@gn/seo";
import { Button, Container } from "@gn/ui";
import { AdoptionSteps } from "@/components/AdoptionSteps";
import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { getPage, getSeoSettings } from "@/lib/content";
import { localize } from "@/lib/i18n/config";
import { localizePage } from "@/lib/i18n/content";
import { adoptionFaq, adoptionSteps, crumbs } from "@/lib/i18n/labels";
import { langFrom, type LangProps } from "@/lib/i18n/server";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: LangProps) {
  const { lang } = await langFrom(params);
  const page = localizePage(await getPage("/adotar/perguntas"), lang);
  return buildMetadata({ path: "/adotar/perguntas", title: page.heading, description: page.intro, overrides: page.seo });
}

export default async function AdoptionQuestionsPage({ params }: LangProps) {
  const { lang, t, l } = await langFrom(params);
  const [ptPage, settings] = await Promise.all([getPage("/adotar/perguntas"), getSeoSettings()]);
  const page = localizePage(ptPage, lang);
  const c = crumbs[lang];
  const questions = t({ pt: "Perguntas", en: "Questions", es: "Preguntas", fr: "Questions" });
  const faq = adoptionFaq[lang];
  return (
    <>
      <PageHero heading={page.heading} intro={page.intro} introLang={page.ptOnly ? "pt-PT" : undefined} crumbs={[{ href: "/", label: c.home }, { href: "/adotar", label: c.adopt }, { label: questions }]} />
      <Container>
        <div className="gn-stack gn-stack--l">
          <div className="faq">
            {faq.map(({ q, a }) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
          <h2>{t({ pt: "Como funciona a adoção", en: "How adoption works", es: "Cómo funciona la adopción", fr: "Comment se passe l’adoption" })}</h2>
          <AdoptionSteps steps={adoptionSteps[lang]} />
          <div className="action-row">
            <Button href={l("/adotar")}>{t({ pt: "Ver os gatos", en: "See the cats", es: "Ver los gatos", fr: "Voir les chats" })}</Button>
            <Button href={l("/adotar/descobrir")} variant="secondary">{t({ pt: "Ajude-me a escolher", en: "Help me choose", es: "Ayúdeme a elegir", fr: "Aidez-moi à choisir" })}</Button>
          </div>
        </div>
      </Container>
      <JsonLd data={[breadcrumbJsonLd(settings, [{ name: c.home, path: localize("/", lang) }, { name: c.adopt, path: localize("/adotar", lang) }, { name: questions, path: localize("/adotar/perguntas", lang) }]), faqJsonLd(faq)]} />
    </>
  );
}
