import { notFound } from "next/navigation";
import { postCategoryLabel } from "@gn/domain";
import { breadcrumbJsonLd } from "@gn/seo";
import { Badge, Button, Container, ShareBar } from "@gn/ui";
import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { getPost, getSeoSettings, listPosts } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await listPosts()).map((p) => ({ slug: p.slug }));
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
  return (
    <>
      <PageHero heading={post.title} crumbs={[{ href: "/", label: "Início" }, { href: "/noticias", label: "Notícias" }, { label: post.title }]}>
        <div className="action-row">
          <Badge tone={post.category === "urgente" ? "error" : "info"}>{postCategoryLabel[post.category]}</Badge>
          <span className="muted">Publicado a <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time></span>
        </div>
      </PageHero>
      <Container>
        <div className="article">
          {post.photo ? <img src={post.photo.url} alt={post.photo.alt} /> : null}
          <p className="gn-lead">{post.summary}</p>
          {post.body.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}
          {post.cta ? <div><Button href={post.cta.href}>{post.cta.label}</Button></div> : null}
          <ShareBar url={url} text={post.title} label="Partilhar esta notícia" />
        </div>
      </Container>
      <JsonLd data={[article, breadcrumbJsonLd(settings, [{ name: "Início", path: "/" }, { name: "Notícias", path: "/noticias" }, { name: post.title, path: `/noticias/${post.slug}` }]), ...(post.seo.jsonLd ?? [])]} />
    </>
  );
}
