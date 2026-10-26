import { notFound } from "next/navigation";
import { breadcrumbJsonLd } from "@gn/seo";
import { Badge, Button, Container, ShareBar } from "@gn/ui";
import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { getPost, getSeoSettings, listPosts } from "@/lib/content";
import { When } from "@/components/When";
import { PtOnlyNote } from "@/components/PtOnlyNote";
import { localize } from "@/lib/i18n/config";
import { localizePost } from "@/lib/i18n/content";
import { crumbs, eventWhen, postCategoryLabel } from "@/lib/i18n/labels";
import { langFrom, type LangProps } from "@/lib/i18n/server";
import { buildMetadata } from "@/lib/seo";

type Props = LangProps<{ slug: string }>;

export async function generateStaticParams() {
  // Pre-rendering is only a speed-up: if the API is down, the pages are built on request instead.
  return (await listPosts().catch(() => [])).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { lang } = await langFrom(params);
  const found = await getPost((await params).slug);
  if (!found) return {};
  const post = localizePost(found, lang);
  return buildMetadata({ path: `/noticias/${post.slug}`, title: post.title, description: post.summary, image: post.photo?.url, type: "article", overrides: post.seo });
}

export default async function PostPage({ params }: Props) {
  const { lang, t, l } = await langFrom(params);
  const found = await getPost((await params).slug);
  if (!found) notFound();
  const post = localizePost(found, lang);
  const settings = await getSeoSettings();
  const url = `${settings.siteUrl}${localize(`/noticias/${post.slug}`, lang)}`;
  const c = crumbs[lang];
  const textLang = post.ptOnly ? "pt-PT" : undefined;
  const article = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.summary,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: url,
    ...(post.photo ? { image: [post.photo.url.startsWith("http") ? post.photo.url : `${settings.siteUrl}${post.photo.url}`] } : {}),
    publisher: { "@id": `${settings.siteUrl}/#organizacao` },
  };
  // Lets search engines show the event with its date and place.
  const event = post.event ? {
    "@context": "https://schema.org",
    "@type": "Event",
    name: post.title,
    description: post.summary,
    startDate: post.event.startsAt,
    ...(post.event.endsAt ? { endDate: post.event.endsAt } : {}),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: post.event.location, address: { "@type": "PostalAddress", addressLocality: "Viana do Castelo", addressCountry: "PT" } },
    organizer: { "@id": `${settings.siteUrl}/#organizacao` },
    url,
  } : undefined;
  return (
    <>
      <PageHero heading={post.title} crumbs={[{ href: "/", label: c.home }, { href: "/noticias", label: c.news }, { label: post.title }]}>
        <div className="action-row">
          <Badge tone={post.category === "urgente" ? "error" : "info"}>{postCategoryLabel[lang][post.category]}</Badge>
          <span className="muted">{t({ pt: "Publicado a", en: "Published on", es: "Publicado el", fr: "Publié le" })} <When iso={post.publishedAt} /></span>
        </div>
      </PageHero>
      <Container>
        <div className="article">
          {post.photo ? <img src={post.photo.url} alt={post.photo.alt} /> : null}
          {post.event ? (
            <dl className="event-facts">
              <div><dt>{t({ pt: "Quando", en: "When", es: "Cuándo", fr: "Quand" })}</dt><dd><time dateTime={post.event.startsAt}>{eventWhen(lang, post.event)}</time></dd></div>
              <div><dt>{t({ pt: "Onde", en: "Where", es: "Dónde", fr: "Où" })}</dt><dd>{post.event.location}</dd></div>
            </dl>
          ) : null}
          {post.ptOnly ? <PtOnlyNote /> : null}
          <p className="gn-lead" lang={textLang}>{post.summary}</p>
          {post.body.split(/\n{2,}/).map((para, i) => <p key={i} lang={textLang}>{para}</p>)}
          {post.cta ? <div><Button href={l(post.cta.href)}>{post.cta.label}</Button></div> : null}
          <ShareBar url={url} text={post.title} label={t({ pt: "Partilhar esta notícia", en: "Share this news", es: "Compartir esta noticia", fr: "Partager cette actualité" })} />
        </div>
      </Container>
      <JsonLd data={[article, ...(event ? [event] : []), breadcrumbJsonLd(settings, [{ name: c.home, path: l("/") }, { name: c.news, path: l("/noticias") }, { name: post.title, path: l(`/noticias/${post.slug}`) }]), ...(post.seo.jsonLd ?? [])]} />
    </>
  );
}
