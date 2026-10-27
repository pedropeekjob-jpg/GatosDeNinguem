import { Button, Container, Section, StatTile } from "@gn/ui";
import { CampaignMeter } from "@/components/CampaignMeter";
import { PageHero } from "@/components/PageHero";
import { getImpact, getPage } from "@/lib/content";
import { When } from "@/components/When";
import { localizePage } from "@/lib/i18n/content";
import { crumbs } from "@/lib/i18n/labels";
import { langFrom, type LangProps } from "@/lib/i18n/server";
import { buildMetadata } from "@/lib/seo";
import { TeamBanner } from "@/components/TeamBanner";
import { teamPhoto } from "@/lib/equipa";
import { ParallaxLogo } from "@/components/client/ParallaxLogo";

export async function generateMetadata({ params }: LangProps) {
  const { lang } = await langFrom(params);
  const page = localizePage(await getPage("/sobre"), lang);
  return buildMetadata({ path: "/sobre", title: page.heading, description: page.intro, overrides: page.seo });
}

export default async function AboutPage({ params }: LangProps) {
  const { lang, t, l } = await langFrom(params);
  const [found, impact] = await Promise.all([getPage("/sobre"), getImpact()]);
  const page = localizePage(found, lang);
  return (
    <>
      <PageHero heading={page.heading} intro={page.intro} introLang={page.ptOnly ? "pt-PT" : undefined} crumbs={[{ href: "/", label: crumbs[lang].home }, { label: crumbs[lang].about }]} />
      <Container>
        <TeamBanner photo={teamPhoto} />
      </Container>
      <div className="story">
        <ParallaxLogo />
        <Container narrow>
        <div className="gn-stack gn-stack--m">
          <h2>{t({ pt: "A nossa missão", en: "Our mission", es: "Nuestra misión", fr: "Notre mission" })}</h2>
          {t({
            pt: (
              <ul className="gn-stack gn-stack--s">
                <li><strong>Sensibilizar</strong> contra o abandono e os maus tratos, que são crime desde a Lei 69/2014.</li>
                <li><strong>Esterilizar:</strong> o programa CED (capturar, esterilizar, devolver) é a forma mais eficaz de controlar as colónias de rua.</li>
                <li><strong>Cuidar das colónias</strong> com abrigos para o frio, alimentação e cuidados de saúde.</li>
                <li><strong>Adoção responsável:</strong> um gato é da família para toda a vida.</li>
                <li><strong>Animais comunitários:</strong> promover a presença responsável de animais em escolas, casas e outros espaços.</li>
              </ul>
            ),
            en: (
              <ul className="gn-stack gn-stack--s">
                <li><strong>Raising awareness</strong> against abandonment and cruelty, both crimes in Portugal since Law 69/2014.</li>
                <li><strong>Neutering:</strong> the TNR programme (trap, neuter, return) is the most effective way to manage street colonies.</li>
                <li><strong>Caring for colonies</strong> with winter shelters, food and health care.</li>
                <li><strong>Responsible adoption:</strong> a cat is family for life.</li>
                <li><strong>Community animals:</strong> encouraging the responsible presence of animals in schools, homes and other places.</li>
              </ul>
            ),
            es: (
              <ul className="gn-stack gn-stack--s">
                <li><strong>Concienciar</strong> contra el abandono y el maltrato, delitos en Portugal desde la Ley 69/2014.</li>
                <li><strong>Esterilizar:</strong> el programa CER (capturar, esterilizar, retornar) es la forma más eficaz de controlar las colonias callejeras.</li>
                <li><strong>Cuidar de las colonias</strong> con refugios para el frío, alimentación y atención sanitaria.</li>
                <li><strong>Adopción responsable:</strong> un gato es de la familia para toda la vida.</li>
                <li><strong>Animales comunitarios:</strong> promover la presencia responsable de animales en escuelas, casas y otros espacios.</li>
              </ul>
            ),
            fr: (
              <ul className="gn-stack gn-stack--s">
                <li><strong>Sensibiliser</strong> contre l’abandon et la maltraitance, punis par la loi au Portugal depuis la loi 69/2014.</li>
                <li><strong>Stériliser :</strong> le programme TNR (capturer, stériliser, relâcher) est le moyen le plus efficace de gérer les colonies de rue.</li>
                <li><strong>Prendre soin des colonies</strong> avec des abris contre le froid, de la nourriture et des soins.</li>
                <li><strong>Adoption responsable :</strong> un chat fait partie de la famille pour toute sa vie.</li>
                <li><strong>Animaux communautaires :</strong> encourager la présence responsable d’animaux dans les écoles, les maisons et d’autres lieux.</li>
              </ul>
            ),
          })}
          <h2>{t({ pt: "O nosso percurso", en: "Our story", es: "Nuestra historia", fr: "Notre parcours" })}</h2>
          {t({
            pt: (
              <ul className="gn-stack gn-stack--s">
                <li><strong>2013:</strong> um grupo de cidadãos começa a cuidar dos gatos de rua de Viana do Castelo.</li>
                <li><strong>Novembro de 2014:</strong> nasce oficialmente a Associação Gatos de Ninguém.</li>
                <li><strong>Julho de 2022:</strong> abre o gatil em Santa Marta de Portuzelo.</li>
              </ul>
            ),
            en: (
              <ul className="gn-stack gn-stack--s">
                <li><strong>2013:</strong> a group of local people starts caring for the street cats of Viana do Castelo.</li>
                <li><strong>November 2014:</strong> the Gatos de Ninguém association is officially founded.</li>
                <li><strong>July 2022:</strong> the shelter opens in Santa Marta de Portuzelo.</li>
              </ul>
            ),
            es: (
              <ul className="gn-stack gn-stack--s">
                <li><strong>2013:</strong> un grupo de vecinos empieza a cuidar de los gatos callejeros de Viana do Castelo.</li>
                <li><strong>Noviembre de 2014:</strong> nace oficialmente la Asociación Gatos de Ninguém.</li>
                <li><strong>Julio de 2022:</strong> abre el refugio en Santa Marta de Portuzelo.</li>
              </ul>
            ),
            fr: (
              <ul className="gn-stack gn-stack--s">
                <li><strong>2013 :</strong> un groupe d’habitants commence à s’occuper des chats errants de Viana do Castelo.</li>
                <li><strong>Novembre 2014 :</strong> naissance officielle de l’association Gatos de Ninguém.</li>
                <li><strong>Juillet 2022 :</strong> ouverture du refuge à Santa Marta de Portuzelo.</li>
              </ul>
            ),
          })}
          <div className="action-row">
            <Button href={l("/ajudar")}>{t({ pt: "Como posso ajudar", en: "How can I help", es: "Cómo puedo ayudar", fr: "Comment aider" })}</Button>
            <Button href={l("/finais-felizes")} variant="secondary">{t({ pt: "Ver finais felizes", en: "See happy endings", es: "Ver finales felices", fr: "Voir les belles histoires" })}</Button>
          </div>
        </div>
        </Container>
      </div>
      <Section
        tone="ink"
        heading={t({ pt: "O nosso trabalho em números", en: "Our work in numbers", es: "Nuestro trabajo en cifras", fr: "Notre travail en chiffres" })}
        intro={<>{t({ pt: "Atualizado a", en: "Updated on", es: "Actualizado el", fr: "Mis à jour le" })} <When iso={impact.updatedAt} />.</>}
      >
        <div className="stats">
          <StatTile value={impact.catsInShelter} label={t({ pt: "gatos no gatil hoje", en: "cats at the shelter today", es: "gatos en el refugio hoy", fr: "chats au refuge aujourd’hui" })} />
          <StatTile value={impact.adoptionsThisYear} label={t({ pt: "adoções este ano", en: "adoptions this year", es: "adopciones este año", fr: "adoptions cette année" })} />
          <StatTile value={impact.sterilizationsThisYear} label={t({ pt: "esterilizações este ano", en: "neuterings this year", es: "esterilizaciones este año", fr: "stérilisations cette année" })} />
          <StatTile value={impact.volunteers} label={t({ pt: "voluntários ativos", en: "active volunteers", es: "voluntarios activos", fr: "bénévoles actifs" })} />
        </div>
        {impact.campaign ? (
          <div className="gn-stack gn-stack--s">
            <CampaignMeter campaign={impact.campaign} />
            <div><Button href={l(impact.campaign.href)}>{t({ pt: "Ajudar esta campanha", en: "Help this campaign", es: "Ayudar a esta campaña", fr: "Soutenir cette campagne" })}</Button></div>
          </div>
        ) : null}
      </Section>
    </>
  );
}
