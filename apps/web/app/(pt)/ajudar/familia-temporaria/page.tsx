import { Container, Section } from "@gn/ui";
import { CatCard } from "@/components/CatCard";
import { FormModal } from "@/components/client/FormModal";
import { FosterForm } from "@/components/forms/FosterForm";
import { PageHero } from "@/components/PageHero";
import { listCats, listCatsNeedingFoster } from "@/lib/content";
import { crumbs } from "@/lib/i18n/labels";
import { i18n, langFrom, type LangProps } from "@/lib/i18n/server";
import { buildMetadata } from "@/lib/seo";

const heading = { pt: "Ser família temporária", en: "Become a foster home", es: "Ser casa de acogida", fr: "Devenir famille d’accueil" };
const intro = {
  pt: "Acolha em casa um gato a recuperar ou gatinhos sem mãe, até encontrarem família. A associação paga a comida, a areia e o veterinário.",
  en: "Take in a recovering cat or motherless kittens until they find a family. The association pays for the food, litter and vet.",
  es: "Acoja en casa a un gato que se recupera o a gatitos sin madre hasta que encuentren familia. La asociación paga la comida, la arena y el veterinario.",
  fr: "Accueillez chez vous un chat en convalescence ou des chatons sans mère, jusqu’à ce qu’ils trouvent une famille. L’association paie la nourriture, la litière et le vétérinaire.",
};
const want = { pt: "Quero ser família temporária", en: "I want to foster", es: "Quiero ser casa de acogida", fr: "Je veux être famille d’accueil" };

export async function generateMetadata({ params }: LangProps) {
  const { t } = await langFrom(params);
  return buildMetadata({ path: "/ajudar/familia-temporaria", title: t(heading), description: t(intro) });
}

function FosterButton() {
  const { t } = i18n();
  return (
    <FormModal label={t(want)} title={t(want)} intro={t({ pt: "Leva dois minutos. Ligamos-lhe nos próximos dias.", en: "It takes two minutes. We’ll call you in the next few days.", es: "Son dos minutos. Le llamamos en los próximos días.", fr: "Cela prend deux minutes. Nous vous appelons dans les prochains jours." })}>
      <FosterForm />
    </FormModal>
  );
}

export default async function FosterPage({ params }: LangProps) {
  const { lang, t } = await langFrom(params);
  const [needs, cats] = await Promise.all([listCatsNeedingFoster().catch(() => []), listCats()]);
  const waiting = needs.flatMap((n) => {
    const cat = cats.find((c) => c.slug === n.catSlug);
    return cat ? [{ cat, notes: n.notes }] : [];
  });
  const c = crumbs[lang];
  return (
    <>
      <PageHero heading={t(heading)} intro={t(intro)} crumbs={[{ href: "/", label: c.home }, { href: "/ajudar", label: c.help }, { label: t({ pt: "Família temporária", en: "Foster home", es: "Casa de acogida", fr: "Famille d’accueil" }) }]}>
        <div className="action-row"><FosterButton /></div>
      </PageHero>

      <Section heading={t({ pt: "Como funciona", en: "How it works", es: "Cómo funciona", fr: "Comment ça marche" })}>
        <ol className="steps">
          {t({
            pt: <>
              <li><span><strong>Deixe os seus dados</strong> no botão “Quero ser família temporária”. Não fica com nenhum compromisso.</span></li>
              <li><span><strong>Ligamos-lhe</strong> para conversar e escolher juntos um gato que encaixe na sua casa.</span></li>
              <li><span><strong>O gato fica consigo</strong> umas semanas. Levamos tudo o que precisa e estamos sempre contactáveis.</span></li>
              <li><span><strong>Quando for adotado,</strong> despede-se dele sabendo que lhe salvou a vida.</span></li>
            </>,
            en: <>
              <li><span><strong>Leave your details</strong> with the “I want to foster” button. It doesn’t commit you to anything.</span></li>
              <li><span><strong>We call you</strong> for a chat and to choose together a cat that fits your home.</span></li>
              <li><span><strong>The cat stays with you</strong> for a few weeks. We bring everything they need and you can always reach us.</span></li>
              <li><span><strong>When they are adopted,</strong> you say goodbye knowing you saved their life.</span></li>
            </>,
            es: <>
              <li><span><strong>Deje sus datos</strong> en el botón «Quiero ser casa de acogida». No adquiere ningún compromiso.</span></li>
              <li><span><strong>Le llamamos</strong> para hablar y elegir juntos un gato que encaje en su casa.</span></li>
              <li><span><strong>El gato se queda con usted</strong> unas semanas. Llevamos todo lo que necesita y siempre puede contactarnos.</span></li>
              <li><span><strong>Cuando lo adopten,</strong> se despide sabiendo que le ha salvado la vida.</span></li>
            </>,
            fr: <>
              <li><span><strong>Laissez vos coordonnées</strong> avec le bouton « Je veux être famille d’accueil ». Cela ne vous engage à rien.</span></li>
              <li><span><strong>Nous vous appelons</strong> pour discuter et choisir ensemble un chat adapté à votre maison.</span></li>
              <li><span><strong>Le chat reste chez vous</strong> quelques semaines. Nous apportons tout ce qu’il lui faut et sommes toujours joignables.</span></li>
              <li><span><strong>Quand il est adopté,</strong> vous lui dites au revoir en sachant que vous lui avez sauvé la vie.</span></li>
            </>,
          })}
        </ol>
        <div className="foster-split">
          <div className="foster-split__box">
            <h3>{t({ pt: "Nós tratamos de", en: "We take care of", es: "Nosotros nos ocupamos de", fr: "Nous nous occupons de" })}</h3>
            <ul>{t({
              pt: ["Comida e areia", "Veterinário e medicação", "Transportadora e caminha", "Ajuda sempre que precisar"],
              en: ["Food and litter", "Vet and medication", "Carrier and bed", "Help whenever you need it"],
              es: ["Comida y arena", "Veterinario y medicación", "Transportín y camita", "Ayuda siempre que la necesite"],
              fr: ["Nourriture et litière", "Vétérinaire et médicaments", "Caisse de transport et panier", "De l’aide dès que vous en avez besoin"],
            }).map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
          <div className="foster-split__box">
            <h3>{t({ pt: "Você dá", en: "You give", es: "Usted da", fr: "Vous offrez" })}</h3>
            <ul>{t({
              pt: ["Um canto sossegado em casa", "Carinho e companhia", "Notícias e fotos de vez em quando"],
              en: ["A quiet corner of your home", "Affection and company", "News and photos now and then"],
              es: ["Un rincón tranquilo en casa", "Cariño y compañía", "Noticias y fotos de vez en cuando"],
              fr: ["Un coin tranquille chez vous", "De l’affection et de la compagnie", "Des nouvelles et des photos de temps en temps"],
            }).map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
        </div>
      </Section>

      {waiting.length > 0 ? (
        <Section tone="soft" heading={waiting.length === 1
          ? t({ pt: "Este gato precisa de família temporária agora", en: "This cat needs a foster home now", es: "Este gato necesita casa de acogida ahora", fr: "Ce chat a besoin d’une famille d’accueil maintenant" })
          : t({ pt: "Estes gatos precisam de família temporária agora", en: "These cats need a foster home now", es: "Estos gatos necesitan casa de acogida ahora", fr: "Ces chats ont besoin d’une famille d’accueil maintenant" })}>
          <ul className="cat-rail__track" role="list">
            {waiting.map(({ cat, notes }) => (
              <li key={cat.id} className="foster-need">
                <CatCard cat={cat} />
                {/* Written by the team in the back office, in Portuguese. */}
                {notes ? <p className="foster-need__note" lang={lang === "pt" ? undefined : "pt-PT"}>{notes}</p> : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <section id="quero-ser" className="gn-section" aria-labelledby="quero-ser-titulo">
        <Container narrow>
          <div className="gn-stack gn-stack--m">
            <h2 id="quero-ser-titulo">{t(want)}</h2>
            <p>{t({ pt: "Deixe os seus dados, leva dois minutos. Ligamos-lhe nos próximos dias.", en: "Leave your details; it takes two minutes. We’ll call you in the next few days.", es: "Deje sus datos, son dos minutos. Le llamamos en los próximos días.", fr: "Laissez vos coordonnées, cela prend deux minutes. Nous vous appelons dans les prochains jours." })}</p>
            <div className="action-row"><FosterButton /></div>
          </div>
        </Container>
      </section>
    </>
  );
}
