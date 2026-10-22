import { postCategoryLabel } from "@gn/domain";
import { Badge, Card, Grid, Section } from "@gn/ui";
import { PageHero } from "@/components/PageHero";
import { getPage, listPosts } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const page = await getPage("/noticias");
  return buildMetadata({ path: "/noticias", title: page.heading, description: page.intro, overrides: page.seo });
}

export default async function NewsPage() {
  const [page, posts] = await Promise.all([getPage("/noticias"), listPosts()]);
  return (
    <>
      <PageHero heading={page.heading} intro={page.intro} crumbs={[{ href: "/", label: "Início" }, { label: "Notícias" }]} />
      <Section>
        <Grid min="20rem">
          {posts.map((post) => (
            <Card key={post.id} titleAs="h2" title={post.title} href={`/noticias/${post.slug}`} eyebrow={formatDate(post.publishedAt)} media={post.photo ? { src: post.photo.url, alt: post.photo.alt } : undefined} badges={<Badge tone={post.category === "urgente" ? "error" : "info"}>{postCategoryLabel[post.category]}</Badge>}>
              <p>{post.summary}</p>
            </Card>
          ))}
        </Grid>
      </Section>
    </>
  );
}
