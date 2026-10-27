import { notFound } from "next/navigation";
import { similarCats } from "@gn/domain";
import { breadcrumbJsonLd } from "@gn/seo";
import { Badge, Button, Carousel, Container, Grid, Notice, Section, ShareBar } from "@gn/ui";
import { AdoptionSteps } from "@/components/AdoptionSteps";
import { CatCard } from "@/components/CatCard";
import { FavoriteButton } from "@/components/client/FavoriteButton";
import { FormModal } from "@/components/client/FormModal";
import { AdoptionInterestForm } from "@/components/forms/AdoptionInterestForm";
import { SponsorForm } from "@/components/forms/SponsorForm";
import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { PtOnlyNote } from "@/components/PtOnlyNote";
import { TimeAgo } from "@/components/client/TimeAgo";
import { When } from "@/components/When";
import { getCat, getSeoSettings, listCats } from "@/lib/content";
import { localize } from "@/lib/i18n/config";
import { localizeCat } from "@/lib/i18n/content";
import { adoptionSteps, ageLabel, catWords, crumbs, goesHomeWith, sexLabel, statusLabel } from "@/lib/i18n/labels";
import { langFrom, type LangProps } from "@/lib/i18n/server";
import { buildMetadata } from "@/lib/seo";

type Props = LangProps<{ slug: string }>;

export async function generateStaticParams() {
  // Pre-rendering is only a speed-up: if the API is down, the pages are built on request instead.
  return (await listCats().catch(() => [])).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { lang, t } = await langFrom(params);
  const found = await getCat((await params).slug);
  if (!found) return {};
  const cat = localizeCat(found, lang);
  const f = cat.sex === "femea";
  const title = cat.status === "adotado"
    ? t({ pt: `${cat.name}, ${f ? "gata adotada" : "gato adotado"}`, en: `${cat.name}, adopted cat`, es: `${cat.name}, ${f ? "gata adoptada" : "gato adoptado"}`, fr: `${cat.name}, ${f ? "chatte adoptée" : "chat adopté"}` })
    : t({ pt: `${cat.name}, ${f ? "gata" : "gato"} para adoção em Viana do Castelo`, en: `${cat.name}, cat for adoption in Viana do Castelo`, es: `${cat.name}, ${f ? "gata" : "gato"} en adopción en Viana do Castelo`, fr: `${cat.name}, ${f ? "chatte" : "chat"} à adopter à Viana do Castelo` });
  return buildMetadata({ path: `/adotar/${cat.slug}`, title, description: cat.summary, image: cat.photos[0]?.url, overrides: cat.seo });
}

export default async function CatPage({ params }: Props) {
  const { lang, t, l } = await langFrom(params);
  const found = await getCat((await params).slug);
  if (!found) notFound();
  const cat = localizeCat(found, lang);
  const [settings, available] = await Promise.all([getSeoSettings(), listCats("para-adocao").catch(() => [])]);
  const others = similarCats(cat, available);
  const url = `${settings.siteUrl}${localize(`/adotar/${cat.slug}`, lang)}`;
  const photo = cat.photos[0]!;
  // Portuguese says "o Tobias", "a Mia".
  const pronoun = cat.sex === "femea" ? "a" : "o";
  const words = catWords(lang, cat.sex);
  const renderedAt = new Date().toISOString();
  const yes = t({ pt: "Sim", en: "Yes", es: "Sí", fr: "Oui" });
  const no = t({ pt: "Não", en: "No", es: "No", fr: "Non" });
  const yesNo = (v: boolean | undefined) => (v === undefined ? t({ pt: "Ainda não sabemos", en: "We don’t know yet", es: "Aún no lo sabemos", fr: "Nous ne savons pas encore" }) : v ? yes : no);
  const ptOnly = cat.ptOnly ? "pt-PT" : undefined;
  const c = crumbs[lang];
  const name = cat.name;
  const meet = t({ pt: `Quero conhecer ${pronoun} ${name}`, en: `I’d like to meet ${name}`, es: `Quiero conocer a ${name}`, fr: `Je veux rencontrer ${name}` });
  const sponsor = t({ pt: `Apadrinhar ${pronoun} ${name}`, en: `Sponsor ${name}`, es: `Apadrinar a ${name}`, fr: `Parrainer ${name}` });

  return (
    <>
      <PageHero heading={name} crumbs={[{ href: "/", label: c.home }, { href: "/adotar", label: c.adopt }, { label: name }]}>
        <div className="action-row">
          <Badge tone={cat.status === "para-adocao" ? "success" : "neutral"}>{statusLabel[lang][cat.status]}</Badge>
          {cat.specialNeeds ? <Badge tone="warning">{words.specialCare}</Badge> : null}
        </div>
      </PageHero>
      <Container>
        <div className="cat-profile">
          {cat.photos.length > 1 ? (
            <div className="cat-profile__gallery">
              <Carousel slides={cat.photos.map((p) => ({ src: p.url, alt: p.alt }))} label={t({ pt: `Fotografias d${pronoun} ${name}`, en: `Photos of ${name}`, es: `Fotos de ${name}`, fr: `Photos de ${name}` })} />
            </div>
          ) : (
            <img className="cat-profile__photo" src={photo.url} alt={photo.alt} width={800} height={600} />
          )}
          <div className="gn-stack gn-stack--m">
            <p className="gn-lead" lang={ptOnly}>{cat.summary}</p>
            {cat.status === "para-adocao" ? (
              <div className="action-row cat-profile__cta">
                <FormModal
                  label={meet}
                  href={l(`/adotar/${cat.slug}/conhecer`)}
                  title={meet}
                  intro={t({ pt: "Deixe o seu contacto. Ligamos-lhe para conversar e marcar uma visita. Não precisa de decidir nada agora.", en: "Leave your details. We’ll call you for a chat and to arrange a visit. You don’t have to decide anything now.", es: "Deje su contacto. Le llamamos para hablar y concertar una visita. No tiene que decidir nada ahora.", fr: "Laissez vos coordonnées. Nous vous appelons pour discuter et fixer une visite. Vous n’avez rien à décider maintenant." })}
                >
                  <AdoptionInterestForm catSlug={cat.slug} catName={name} />
                </FormModal>
                <FavoriteButton slug={cat.slug} name={name} compact />
              </div>
            ) : null}
            {cat.status === "adotado" && cat.happyEnding ? (
              <Notice tone="success" title={t({ pt: `${name} já tem família!`, en: `${name} has a family now!`, es: `¡${name} ya tiene familia!`, fr: `${name} a trouvé une famille !` })}>
                <p lang={lang !== "pt" && !found.translations?.[lang]?.happyEndingText ? "pt-PT" : undefined}>“{cat.happyEnding.text}”</p>
                {cat.happyEnding.adopterName ? <p className="small">{cat.happyEnding.adopterName}{cat.happyEnding.adopterTown ? `, ${cat.happyEnding.adopterTown}` : ""}</p> : null}
              </Notice>
            ) : null}
            <dl className="facts">
              <div><dt>{t({ pt: "Idade", en: "Age", es: "Edad", fr: "Âge" })}</dt><dd>{ageLabel(lang, cat.ageYears)}</dd></div>
              <div><dt>{t({ pt: "Sexo", en: "Sex", es: "Sexo", fr: "Sexe" })}</dt><dd>{sexLabel[lang][cat.sex]}</dd></div>
              {cat.arrivedAt ? <div><dt>{t({ pt: "No gatil desde", en: "At the shelter since", es: "En el refugio desde", fr: "Au refuge depuis" })}</dt><dd><When iso={cat.arrivedAt} format="month" />{cat.status !== "adotado" ? <> (<TimeAgo iso={cat.arrivedAt} renderedAt={renderedAt} />)</> : null}</dd></div> : null}
              {cat.listedAt && cat.status !== "adotado" ? <div><dt>{t({ pt: "Para adoção desde", en: "Up for adoption since", es: "En adopción desde", fr: "À l’adoption depuis le" })}</dt><dd><When iso={cat.listedAt} /></dd></div> : null}
              {cat.status === "adotado" && cat.adoptedAt ? <div><dt>{t({ pt: `${words.adopted} a`, en: `${words.adopted} on`, es: `${words.adopted} el`, fr: `${words.adopted} le` })}</dt><dd><When iso={cat.adoptedAt} /></dd></div> : null}
              <div><dt>{t({ pt: "Feitio", en: "Personality", es: "Carácter", fr: "Caractère" })}</dt><dd lang={ptOnly}>{cat.traits.join(", ") || t({ pt: "A conhecer", en: "Still getting to know them", es: "Por conocer", fr: "À découvrir" })}</dd></div>
              <div><dt>{t({ pt: "Dá-se bem com crianças", en: "Good with children", es: "Se lleva bien con niños", fr: "S’entend avec les enfants" })}</dt><dd>{yesNo(cat.goodWithKids)}</dd></div>
              <div><dt>{t({ pt: "Dá-se bem com gatos", en: "Good with cats", es: "Se lleva bien con gatos", fr: "S’entend avec les chats" })}</dt><dd>{yesNo(cat.goodWithCats)}</dd></div>
              <div><dt>{t({ pt: "Dá-se bem com cães", en: "Good with dogs", es: "Se lleva bien con perros", fr: "S’entend avec les chiens" })}</dt><dd>{yesNo(cat.goodWithDogs)}</dd></div>
              <div><dt>{words.sterilized}</dt><dd>{cat.sterilized ? yes : no}</dd></div>
              <div><dt>{words.vaccinated}</dt><dd>{cat.vaccinated ? yes : no}</dd></div>
              <div><dt>{t({ pt: "Com chip", en: "Microchipped", es: "Con microchip", fr: "Pucé" })}</dt><dd>{cat.microchipped ? yes : no}</dd></div>
            </dl>
            {cat.specialNeeds ? (
              <Notice tone="warning" title={words.specialCare}>
                <span lang={ptOnly}>{cat.specialNeeds}</span>. {t({ pt: "A associação explica tudo e ajuda nos primeiros tempos.", en: "The association explains everything and helps in the first weeks.", es: "La asociación lo explica todo y ayuda al principio.", fr: "L’association explique tout et aide les premiers temps." })}
              </Notice>
            ) : null}
            <h2>{t({ pt: `A história d${pronoun} ${name}`, en: `${name}’s story`, es: `La historia de ${name}`, fr: `L’histoire de ${name}` })}</h2>
            {cat.ptOnly ? <PtOnlyNote /> : null}
            <p lang={ptOnly}>{cat.story}</p>
            {cat.status !== "adotado" ? (
              <>
                <div className="goes-home">
                  <h2>{t({ pt: "Vai para casa com", en: "Goes home with", es: "Se va a casa con", fr: "Part à la maison avec" })}</h2>
                  <ul className="goes-home__list">
                    {goesHomeWith(lang, cat).map((item) => (
                      <li key={item.label} className={item.done ? "is-done" : "is-missing"}>
                        <span className="goes-home__mark" aria-hidden="true">{item.done ? "✓" : "·"}</span>
                        <span>{item.label}{item.done ? "" : <span className="goes-home__note">{t({ pt: ": ainda não, falamos consigo sobre isto", en: ": not yet, we’ll talk to you about it", es: ": todavía no, lo hablamos con usted", fr: " : pas encore, nous en parlerons avec vous" })}</span>}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <h2>{t({ pt: "Como funciona a adoção", en: "How adoption works", es: "Cómo funciona la adopción", fr: "Comment se passe l’adoption" })}</h2>
                <AdoptionSteps steps={adoptionSteps[lang]} />
                <p>{t({
                  pt: <><a href={l("/adotar/perguntas")}>Perguntas sobre adotar</a>: apartamento, crianças, outros animais, custos.</>,
                  en: <><a href={l("/adotar/perguntas")}>Questions about adopting</a>: flats, children, other animals, costs.</>,
                  es: <><a href={l("/adotar/perguntas")}>Preguntas sobre adoptar</a>: piso, niños, otros animales, gastos.</>,
                  fr: <><a href={l("/adotar/perguntas")}>Questions sur l’adoption</a> : appartement, enfants, autres animaux, coûts.</>,
                })}</p>
              </>
            ) : null}
            {cat.status !== "adotado" ? (
              <Notice tone="info" title={t({ pt: `Não pode adotar? Pode apadrinhar ${pronoun} ${name}`, en: `Can’t adopt? You can sponsor ${name}`, es: `¿No puede adoptar? Puede apadrinar a ${name}`, fr: `Vous ne pouvez pas adopter ? Parrainez ${name}` })}>
                <p>{t({ pt: "A partir de 5 euros por mês ajuda a pagar a comida e o veterinário, e recebe notícias.", en: "From 5 euros a month you help pay for food and the vet, and you get news.", es: "Desde 5 euros al mes ayuda a pagar la comida y el veterinario, y recibe noticias.", fr: "À partir de 5 euros par mois, vous aidez à payer la nourriture et le vétérinaire, et vous recevez des nouvelles." })}</p>
                <div className="action-row">
                  <FormModal
                    label={sponsor}
                    href={l(`/apadrinhar/${cat.slug}`)}
                    variant="secondary"
                    title={sponsor}
                    intro={t({ pt: "Deixe os seus dados e entramos em contacto para combinar.", en: "Leave your details and we’ll get in touch to arrange it.", es: "Deje sus datos y nos pondremos en contacto para organizarlo.", fr: "Laissez vos coordonnées et nous vous contacterons pour organiser cela." })}
                  >
                    <SponsorForm catSlug={cat.slug} catName={name} pronoun={pronoun} />
                  </FormModal>
                </div>
              </Notice>
            ) : null}
            <p className="small muted">{t({ pt: "Ficha atualizada a ", en: "Page updated on ", es: "Ficha actualizada el ", fr: "Fiche mise à jour le " })}<When iso={cat.updatedAt} />.</p>
            <ShareBar
              url={url}
              text={cat.status === "adotado"
                ? t({ pt: `${name} encontrou família!`, en: `${name} found a family!`, es: `¡${name} encontró familia!`, fr: `${name} a trouvé une famille !` })
                : t({ pt: `Conheça ${pronoun} ${name}, procura família em Viana do Castelo`, en: `Meet ${name}, looking for a family in Viana do Castelo`, es: `Conozca a ${name}, busca familia en Viana do Castelo`, fr: `Voici ${name}, qui cherche une famille à Viana do Castelo` })}
              label={t({ pt: `Partilhar ${pronoun} ${name}`, en: `Share ${name}`, es: `Compartir a ${name}`, fr: `Partager ${name}` })}
            />
          </div>
        </div>
      </Container>
      {others.length > 0 ? (
        <Section
          heading={t({ pt: "Também procuram família", en: "Also looking for a family", es: "También buscan familia", fr: "Eux aussi cherchent une famille" })}
          intro={cat.status === "adotado" ? t({ pt: `${name} já tem casa. Estes gatos ainda esperam.`, en: `${name} has a home. These cats are still waiting.`, es: `${name} ya tiene casa. Estos gatos aún esperan.`, fr: `${name} a une maison. Ces chats attendent encore.` }) : undefined}
        >
          <Grid>{others.map((o) => <CatCard key={o.id} cat={o} />)}</Grid>
          <div className="action-row"><Button href={l("/adotar")} variant="secondary">{t({ pt: "Ver todos os gatos", en: "See all the cats", es: "Ver todos los gatos", fr: "Voir tous les chats" })}</Button></div>
        </Section>
      ) : null}
      <JsonLd data={[breadcrumbJsonLd(settings, [{ name: c.home, path: localize("/", lang) }, { name: c.adopt, path: localize("/adotar", lang) }, { name, path: localize(`/adotar/${cat.slug}`, lang) }]), ...(cat.seo.jsonLd ?? [])]} />
    </>
  );
}
