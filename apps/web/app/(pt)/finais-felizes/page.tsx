import { Button, Grid, Section } from "@gn/ui";
import { HappyEndingCard } from "@/components/HappyEndingCard";
import { PageHero } from "@/components/PageHero";
import { getPage, listHappyEndings } from "@/lib/content";
import { localizePage } from "@/lib/i18n/content";
import { crumbs } from "@/lib/i18n/labels";
import { langFrom, type LangProps } from "@/lib/i18n/server";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: LangProps) {
  const { lang } = await langFrom(params);
  const page = localizePage(await getPage("/finais-felizes"), lang);
  return buildMetadata({ path: "/finais-felizes", title: page.heading, description: page.intro, overrides: page.seo });
}

export default async function HappyEndingsPage({ params }: LangProps) {
  const { lang, t, l } = await langFrom(params);
  const [ptPage, items] = await Promise.all([getPage("/finais-felizes"), listHappyEndings()]);
  const page = localizePage(ptPage, lang);
  const n = items.length;
  return (
    <>
      <PageHero heading={page.heading} intro={page.intro} introLang={page.ptOnly ? "pt-PT" : undefined} crumbs={[{ href: "/", label: crumbs[lang].home }, { label: page.heading }]}>
        <p className="gn-lead">{t({
          pt: <><strong>{n}</strong> {n === 1 ? "gato encontrou" : "gatos encontraram"} família através do site.</>,
          en: <><strong>{n}</strong> {n === 1 ? "cat has" : "cats have"} found a family through the site.</>,
          es: <><strong>{n}</strong> {n === 1 ? "gato encontró" : "gatos encontraron"} familia a través de la web.</>,
          fr: <><strong>{n}</strong> {n === 1 ? "chat a" : "chats ont"} trouvé une famille grâce au site.</>,
        })}</p>
      </PageHero>
      <Section>
        <Grid>
          {items.map((item) => <HappyEndingCard key={item.cat.id} item={item} titleAs="h2" />)}
        </Grid>
      </Section>
      <Section
        tone="soft"
        heading={t({ pt: "Adotou um dos nossos gatos?", en: "Did you adopt one of our cats?", es: "¿Adoptó a uno de nuestros gatos?", fr: "Vous avez adopté l’un de nos chats ?" })}
        intro={t({ pt: "Envie-nos uma fotografia e umas palavras. Os outros gatos agradecem: as histórias felizes ajudam-nos a encontrar mais famílias.", en: "Send us a photo and a few words. The other cats will thank you: happy stories help us find more families.", es: "Envíenos una foto y unas palabras. Los demás gatos se lo agradecen: las historias felices nos ayudan a encontrar más familias.", fr: "Envoyez-nous une photo et quelques mots. Les autres chats vous remercient : les belles histoires nous aident à trouver d’autres familles." })}
      >
        <div className="action-row">
          <Button href={l("/adotar")}>{t({ pt: "Conhecer os gatos que esperam família", en: "Meet the cats waiting for a family", es: "Conocer a los gatos que esperan familia", fr: "Découvrir les chats qui attendent une famille" })}</Button>
        </div>
      </Section>
    </>
  );
}
