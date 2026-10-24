import { notFound } from "next/navigation";
import { eventWhen, postCategoryLabel } from "@gn/domain";
import { breadcrumbJsonLd } from "@gn/seo";
import { Badge, Button, Container, ShareBar } from "@gn/ui";
import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { getPost, getSeoSettings, listPosts } from "@/lib/content";
import { When } from "@/components/When";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  // Pre-rendering is only a speed-up: if the API is down, the pages are built on request instead.
  return (await listPosts().catch(() => [])).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props) {
  const post = await getPost((await params).slug);
  if (!post) return {};
  return buildMetadata({ path: `/noticias/${post.slug}`, title: post.title, description: post.summary, image: post.photo?.url, type: "article", overrides: post.seo });
}

export default async function PostPage({ params }: Props) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  const settings = await getSeoSettings();
  const url = `${settings.siteUrl}/noticias/${post.slug}`;
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
      <PageHero heading={post.title} crumbs={[{ href: "/", label: "Início" }, { href: "/noticias", label: "Notícias" }, { label: post.title }]}>
        <div className="action-row">
          <Badge tone={post.category === "urgente" ? "error" : "info"}>{postCategoryLabel[post.category]}</Badge>
          <span className="muted">Publicado a <When iso={post.publishedAt} /></span>
        </div>
      </PageHero>
      <Container>
        <div className="article">
          {post.photo ? <img src={post.photo.url} alt={post.photo.alt} /> : null}
          {post.event ? (
            <dl className="event-facts">
              <div><dt>Quando</dt><dd><time dateTime={post.event.startsAt}>{eventWhen(post.event)}</time></dd></div>
              <div><dt>Onde</dt><dd>{post.event.location}</dd></div>
            </dl>
          ) : null}
          <p className="gn-lead">{post.summary}</p>
          {post.body.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}
          {post.cta ? <div><Button href={post.cta.href}>{post.cta.label}</Button></div> : null}
          <ShareBar url={url} text={post.title} label="Partilhar esta notícia" />
        </div>
      </Container>
      <JsonLd data={[article, ...(event ? [event] : []), breadcrumbJsonLd(settings, [{ name: "Início", path: "/" }, { name: "Notícias", path: "/noticias" }, { name: post.title, path: `/noticias/${post.slug}` }]), ...(post.seo.jsonLd ?? [])]} />
    </>
  );
}
