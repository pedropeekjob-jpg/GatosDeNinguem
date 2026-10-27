import type { Perk } from "@gn/domain";
import { Badge, Card, Container, Grid, Section } from "@gn/ui";
import { FormModal } from "@/components/client/FormModal";
import { PartnerApplicationForm } from "@/components/forms/PartnerApplicationForm";
import { PageHero } from "@/components/PageHero";
import { getPage, listPartners } from "@/lib/content";
import { features } from "@/lib/features";
import type { Lang } from "@/lib/i18n/config";
import { localizePage, localizePartner } from "@/lib/i18n/content";
import { crumbs, partnerCategoryLabel } from "@/lib/i18n/labels";
import { langFrom, type LangProps } from "@/lib/i18n/server";
import type { I18n } from "@/lib/i18n/t";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: LangProps) {
  const { lang } = await langFrom(params);
  const page = localizePage(await getPage("/parceiros"), lang);
  return buildMetadata({ path: "/parceiros", title: page.heading, description: page.intro, overrides: page.seo });
}

const withPatinhas = (perk: Perk, { t }: I18n) =>
  features.trocas && perk.patinhasCost
    ? [{
        label: t({ pt: "Com Patinhas", en: "With Patinhas", es: "Con Patinhas", fr: "Avec des Patinhas" }),
        value: [`${perk.patinhasCost} Patinhas`, perk.minLevel ? t({ pt: `a partir do nível ${perk.minLevel}`, en: `from level ${perk.minLevel}`, es: `desde el nivel ${perk.minLevel}`, fr: `dès le niveau ${perk.minLevel}` }) : null].filter(Boolean).join(", "),
      }]
    : [];

// While Ser Amigo is not offered, its discounts are described simply as the partner's offer.
const audience = ({ t }: I18n): Record<Perk["audience"], string> => ({
  amigos: features.amigo
    ? t({ pt: "Para Amigos da associação", en: "For Friends of the association", es: "Para Amigos de la asociación", fr: "Pour les Amis de l’association" })
    : t({ pt: "Vantagem", en: "Offer", es: "Ventaja", fr: "Avantage" }),
  voluntarios: t({ pt: "Para voluntários", en: "For volunteers", es: "Para voluntarios", fr: "Pour les bénévoles" }),
  todos: t({ pt: "Para todos", en: "For everyone", es: "Para todos", fr: "Pour tous" }),
});

const perkText = (perk: Perk, lang: Lang) => (lang === "pt" ? undefined : perk.translations?.[lang]?.description) ?? perk.description;

export default async function PartnersPage({ params }: LangProps) {
  const i18n = await langFrom(params);
  const { lang, t, l } = i18n;
  const [found, all] = await Promise.all([getPage("/parceiros"), listPartners()]);
  const page = localizePage(found, lang);
  const partners = all.map((p) => localizePartner(p, lang));
  const forWhom = audience(i18n);
  return (
    <>
      <PageHero heading={page.heading} intro={page.intro} introLang={page.ptOnly ? "pt-PT" : undefined} crumbs={[{ href: "/", label: crumbs[lang].home }, { label: t({ pt: "Parceiros", en: "Partners", es: "Socios", fr: "Partenaires" }) }]} />
      <Section>
        <Grid min="20rem">
          {partners.map((p) => (
            <Card
              key={p.id}
              titleAs="h2"
              title={p.name}
              href={p.website}
              eyebrow={`${partnerCategoryLabel[lang][p.category]} · ${p.town}`}
              media={p.logo ? { src: p.logo.url, alt: p.logo.alt } : undefined}
              meta={p.perks.flatMap((perk) => [{ label: forWhom[perk.audience], value: perkText(perk, lang) }, ...withPatinhas(perk, i18n)])}
              badges={p.category === "veterinario" ? <Badge tone="info">{t({ pt: "Clínica parceira", en: "Partner clinic", es: "Clínica asociada", fr: "Clinique partenaire" })}</Badge> : undefined}
            >
              {p.why ? <p lang={p.ptOnly ? "pt-PT" : undefined}>{p.why}</p> : null}
            </Card>
          ))}
        </Grid>
        <p className="small muted">
          {t({
            pt: <>Para usar uma vantagem, {features.amigo ? "mostre o seu cartão de Amigo ou " : ""}diga que vem da parte da Gatos de Ninguém.</>,
            en: <>To use an offer, {features.amigo ? "show your Friend card or " : ""}say you come from Gatos de Ninguém.</>,
            es: <>Para usar una ventaja, {features.amigo ? "muestre su tarjeta de Amigo o " : ""}diga que viene de parte de Gatos de Ninguém.</>,
            fr: <>Pour profiter d’un avantage, {features.amigo ? "montrez votre carte d’Ami ou " : ""}dites que vous venez de la part de Gatos de Ninguém.</>,
          })}
          {features.trocas ? (
            <> {t({
              pt: <>Também pode trocar <a href={l("/patinhas")}>Patinhas</a> por vantagens na <a href="/conta">sua conta</a>.</>,
              en: <>You can also exchange <a href={l("/patinhas")}>Patinhas</a> for offers in <a href="/conta">your account</a>.</>,
              es: <>También puede canjear <a href={l("/patinhas")}>Patinhas</a> por ventajas en <a href="/conta">su cuenta</a>.</>,
              fr: <>Vous pouvez aussi échanger des <a href={l("/patinhas")}>Patinhas</a> contre des avantages dans <a href="/conta">votre compte</a>.</>,
            })}</>
          ) : null}
        </p>
      </Section>
      <section id="seja-parceiro" className="gn-section gn-section--soft">
        <Container narrow>
          <div className="gn-stack gn-stack--m">
            <h2>{t({ pt: "Seja parceiro", en: "Become a partner", es: "Hágase socio", fr: "Devenez partenaire" })}</h2>
            <p className="gn-lead">{t({
              pt: "Tem um negócio em Viana do Castelo ou arredores? Ofereça uma vantagem a quem ajuda os gatos e nós divulgamos o seu negócio.",
              en: "Do you run a business in or around Viana do Castelo? Offer something to the people who help the cats and we will promote your business.",
              es: "¿Tiene un negocio en Viana do Castelo o alrededores? Ofrezca una ventaja a quien ayuda a los gatos y nosotros damos a conocer su negocio.",
              fr: "Vous avez un commerce à Viana do Castelo ou dans les environs ? Offrez un avantage à ceux qui aident les chats et nous faisons connaître votre commerce.",
            })}</p>
            <ul className="gn-stack gn-stack--s">
              <li>{t({ pt: "O seu negócio nesta página e nas nossas redes sociais", en: "Your business on this page and on our social media", es: "Su negocio en esta página y en nuestras redes sociales", fr: "Votre commerce sur cette page et sur nos réseaux sociaux" })}</li>
              <li>{t({ pt: "Um autocolante “Parceiro Gatos de Ninguém” para a montra", en: "A “Gatos de Ninguém partner” sticker for your window", es: "Una pegatina “Socio de Gatos de Ninguém” para el escaparate", fr: "Un autocollant « Partenaire Gatos de Ninguém » pour la vitrine" })}</li>
              <li>{t({ pt: "Um resumo anual do que ajudou a conseguir", en: "A yearly summary of what you helped achieve", es: "Un resumen anual de lo que ayudó a conseguir", fr: "Un bilan annuel de ce que vous avez aidé à accomplir" })}</li>
            </ul>
            <div className="action-row">
              <FormModal
                label={t({ pt: "Quero ser parceiro", en: "I want to be a partner", es: "Quiero ser socio", fr: "Je veux devenir partenaire" })}
                title={t({ pt: "Seja parceiro", en: "Become a partner", es: "Hágase socio", fr: "Devenez partenaire" })}
                intro={t({ pt: "Leva dois minutos. Entramos em contacto para combinar a vantagem.", en: "It takes two minutes. We will get in touch to agree on the offer.", es: "Son dos minutos. Le contactamos para acordar la ventaja.", fr: "Cela prend deux minutes. Nous vous contacterons pour convenir de l’avantage." })}
              >
                <PartnerApplicationForm />
              </FormModal>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
