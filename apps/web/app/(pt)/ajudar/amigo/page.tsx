import { redirect } from "next/navigation";
import { Button, Section } from "@gn/ui";
import { PageHero } from "@/components/PageHero";
import { switchedOffRedirect } from "@/lib/features";
import { crumbs } from "@/lib/i18n/labels";
import { langFrom, type LangProps } from "@/lib/i18n/server";
import { buildMetadata } from "@/lib/seo";

const heading = { pt: "Ser Amigo da associação", en: "Become a Friend of the association", es: "Hacerse Amigo de la asociación", fr: "Devenir Ami de l’association" };
const intro = {
  pt: "Com uma quota mínima de 24 euros por ano ajuda a manter o gatil e tem 10% a 15% de desconto nos nossos parceiros.",
  en: "With a membership from 24 euros a year you help keep the shelter going and get 10% to 15% off at our partners.",
  es: "Con una cuota mínima de 24 euros al año ayuda a mantener el refugio y tiene un 10 % a 15 % de descuento en nuestros colaboradores.",
  fr: "Avec une cotisation à partir de 24 euros par an, vous aidez à faire vivre le refuge et bénéficiez de 10 % à 15 % de réduction chez nos partenaires.",
};

export async function generateMetadata({ params }: LangProps) {
  const { t } = await langFrom(params);
  return buildMetadata({ path: "/ajudar/amigo", title: t(heading), description: t(intro) });
}

export default async function FriendPage({ params }: LangProps) {
  const { lang, t, l } = await langFrom(params);
  // Switched off (FEATURES without "amigo"): the middleware already redirects; this covers the static demo.
  const off = switchedOffRedirect("/ajudar/amigo");
  if (off) redirect(l(off));
  const c = crumbs[lang];
  return (
    <>
      <PageHero heading={t(heading)} intro={t(intro)} crumbs={[{ href: "/", label: c.home }, { href: "/ajudar", label: c.help }, { label: t({ pt: "Ser Amigo", en: "Become a Friend", es: "Hacerse Amigo", fr: "Devenir Ami" }) }]}>
        <div className="action-row"><Button href={l("/parceiros")} variant="secondary">{t({ pt: "Ver parceiros e vantagens", en: "See partners and perks", es: "Ver colaboradores y ventajas", fr: "Voir les partenaires et avantages" })}</Button></div>
      </PageHero>
      <Section heading={t({ pt: "O que ganha", en: "What you get", es: "Qué gana", fr: "Ce que vous y gagnez" })}>
        <ul className="gn-stack gn-stack--s">
          {t({
            pt: <><li><strong>Ajuda a manter o gatil</strong> durante todo o ano: comida, areia e veterinário.</li><li><strong>Tem 10% a 15% de desconto</strong> nos nossos parceiros.</li></>,
            en: <><li><strong>You help keep the shelter going</strong> all year round: food, litter and the vet.</li><li><strong>You get 10% to 15% off</strong> at our partners.</li></>,
            es: <><li><strong>Ayuda a mantener el refugio</strong> todo el año: comida, arena y veterinario.</li><li><strong>Tiene un 10 % a 15 % de descuento</strong> en nuestros colaboradores.</li></>,
            fr: <><li><strong>Vous aidez à faire vivre le refuge</strong> toute l’année : nourriture, litière et vétérinaire.</li><li><strong>Vous avez 10 % à 15 % de réduction</strong> chez nos partenaires.</li></>,
          })}
        </ul>
      </Section>
    </>
  );
}
