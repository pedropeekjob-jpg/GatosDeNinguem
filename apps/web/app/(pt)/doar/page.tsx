import { Button, Card, Container, Grid, Notice, Section } from "@gn/ui";
import { CampaignMeter } from "@/components/CampaignMeter";
import { CopyIban } from "@/components/client/CopyIban";
import { PageHero } from "@/components/PageHero";
import { getImpact, getPage } from "@/lib/content";
import { IBAN } from "@/lib/donations";
import { features } from "@/lib/features";
import { localizePage } from "@/lib/i18n/content";
import { crumbs } from "@/lib/i18n/labels";
import { langFrom, type LangProps } from "@/lib/i18n/server";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: LangProps) {
  const { lang } = await langFrom(params);
  const page = localizePage(await getPage("/doar"), lang);
  return buildMetadata({ path: "/doar", title: page.heading, description: page.intro, overrides: page.seo });
}

/** Every way of giving, on one page: money now first, then monthly, yearly, shopping and goods. */
export default async function DonatePage({ params }: LangProps) {
  const { lang, t, l } = await langFrom(params);
  const [ptPage, impact] = await Promise.all([getPage("/doar"), getImpact()]);
  const page = localizePage(ptPage, lang);
  const goods = t({ pt: "Doar comida e mantas", en: "Give food and blankets", es: "Donar comida y mantas", fr: "Donner de la nourriture et des couvertures" });
  return (
    <>
      <PageHero heading={page.heading} intro={page.intro} introLang={page.ptOnly ? "pt-PT" : undefined} crumbs={[{ href: "/", label: crumbs[lang].home }, { label: crumbs[lang].donate }]} />

      <section id="transferencia" className="gn-section">
        <Container narrow>
          <div className="gn-stack gn-stack--m">
            <h2>{t({ pt: "Transferência bancária", en: "Bank transfer", es: "Transferencia bancaria", fr: "Virement bancaire" })}</h2>
            <p>{t({
              pt: "Transfira qualquer valor para a conta da associação. Indique o seu NIF na descrição se quiser recibo. 35 euros pagam uma esterilização.",
              en: "Transfer any amount to the association’s account. Put your Portuguese tax number (NIF) in the description if you would like a receipt. 35 euros pays for one neutering.",
              es: "Transfiera cualquier cantidad a la cuenta de la asociación. Indique su NIF portugués en el concepto si quiere recibo. 35 euros pagan una esterilización.",
              fr: "Virez le montant de votre choix sur le compte de l’association. Indiquez votre numéro fiscal portugais (NIF) dans le libellé si vous voulez un reçu. 35 euros paient une stérilisation.",
            })}</p>
            <CopyIban iban={IBAN} />
            <Notice tone="info" title={t({ pt: "Em breve: MB WAY e cartão", en: "Coming soon: MB WAY and card", es: "Próximamente: MB WAY y tarjeta", fr: "Bientôt : MB WAY et carte" })}>
              {t({ pt: "Estamos a preparar pagamentos por MB WAY, Multibanco e cartão diretamente no site.", en: "We are getting payments by MB WAY, Multibanco and card ready, right here on the site.", es: "Estamos preparando pagos por MB WAY, Multibanco y tarjeta directamente en la web.", fr: "Nous préparons les paiements par MB WAY, Multibanco et carte directement sur le site." })}
            </Notice>
          </div>
        </Container>
      </section>

      {impact.campaign ? (
        <Section tone="soft" heading={t({ pt: "Campanha a decorrer", en: "Current campaign", es: "Campaña en curso", fr: "Campagne en cours" })}>
          <CampaignMeter campaign={impact.campaign} />
        </Section>
      ) : null}

      <Section heading={t({ pt: "Outras formas de doar", en: "Other ways to give", es: "Otras formas de donar", fr: "Autres façons de donner" })}>
        <Grid min="16rem">
          <Card title={t({ pt: "Apadrinhar um gato", en: "Sponsor a cat", es: "Apadrinar un gato", fr: "Parrainer un chat" })} href={l("/apadrinhar")}><p>{t({ pt: "Um valor por mês para a comida e o veterinário de um gato. Recebe fotografias e notícias dele.", en: "A monthly amount for one cat’s food and vet care. You get photos and news of them.", es: "Una cantidad al mes para la comida y el veterinario de un gato. Recibe fotos y noticias suyas.", fr: "Un montant mensuel pour la nourriture et le vétérinaire d’un chat. Vous recevez photos et nouvelles." })}</p></Card>
          {features.amigo ? <Card title={t({ pt: "Ser Amigo da associação", en: "Become a Friend of the association", es: "Hacerse Amigo de la asociación", fr: "Devenir Ami de l’association" })} href={l("/ajudar/amigo")}><p>{t({ pt: "24 euros por ano, com 10% a 15% de desconto nos parceiros.", en: "24 euros a year, with 10% to 15% off at our partners.", es: "24 euros al año, con un 10 % a 15 % de descuento en los colaboradores.", fr: "24 euros par an, avec 10 % à 15 % de réduction chez les partenaires." })}</p></Card> : null}
          <Card title={t({ pt: "Comprar na loja solidária", en: "Shop at the charity shop", es: "Comprar en la tienda solidaria", fr: "Acheter à la boutique solidaire" })} href={l("/loja")}><p>{t({ pt: "T-shirts, canecas e calendários. Também pode doar coisas para vender.", en: "T-shirts, mugs and calendars. You can also give things for us to sell.", es: "Camisetas, tazas y calendarios. También puede donar cosas para vender.", fr: "T-shirts, mugs et calendriers. Vous pouvez aussi donner des objets à vendre." })}</p></Card>
          <Card title={goods} href="#bens"><p>{t({ pt: "Areia, ração e mantas, entregues no gatil.", en: "Litter, cat food and blankets, dropped off at the shelter.", es: "Arena, pienso y mantas, entregados en el refugio.", fr: "Litière, croquettes et couvertures, déposées au refuge." })}</p></Card>
        </Grid>
      </Section>

      <section id="bens" className="gn-section gn-section--soft">
        <Container narrow>
          <div className="gn-stack gn-stack--m">
            <h2>{goods}</h2>
            <p>{t({ pt: "Aceitamos areia, ração seca, ração húmida para gatinhos e mantas. Entregue no gatil aos sábados de manhã.", en: "We accept litter, dry food, wet food for kittens and blankets. Drop them off at the shelter on Saturday mornings.", es: "Aceptamos arena, pienso seco, comida húmeda para gatitos y mantas. Entréguelos en el refugio los sábados por la mañana.", fr: "Nous acceptons litière, croquettes, pâtée pour chatons et couvertures. Déposez-les au refuge le samedi matin." })}</p>
            <div className="action-row"><Button href={l("/loja#doar-artigos")} variant="secondary">{t({ pt: "Doar artigos para a loja solidária", en: "Give items to the charity shop", es: "Donar artículos a la tienda solidaria", fr: "Donner des objets à la boutique solidaire" })}</Button></div>
          </div>
        </Container>
      </section>
    </>
  );
}
