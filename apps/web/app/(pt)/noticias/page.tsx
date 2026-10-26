import { Badge, Card, Grid, Section } from "@gn/ui";
import { PageHero } from "@/components/PageHero";
import { getPage, listPosts } from "@/lib/content";
import { When } from "@/components/When";
import { localizePage, localizePost } from "@/lib/i18n/content";
import { crumbs, eventWhen, postCategoryLabel } from "@/lib/i18n/labels";
import { langFrom, type LangProps } from "@/lib/i18n/server";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: LangProps) {
  const { lang } = await langFrom(params);
  const page = localizePage(await getPage("/noticias"), lang);
  return buildMetadata({ path: "/noticias", title: page.heading, description: page.intro, overrides: page.seo });
}

export default async function NewsPage({ params }: LangProps) {
  const { lang, t, l } = await langFrom(params);
  const [ptPage, posts] = await Promise.all([getPage("/noticias"), listPosts()]);
  const page = localizePage(ptPage, lang);
  return (
    <>
      <PageHero heading={page.heading} intro={page.intro} introLang={page.ptOnly ? "pt-PT" : undefined} crumbs={[{ href: "/", label: crumbs[lang].home }, { label: crumbs[lang].news }]} />
      <Section>
        <Grid min="20rem">
          {posts.map((original) => {
            const post = localizePost(original, lang);
            const ptOnly = post.ptOnly ? "pt-PT" : undefined;
            return (
              <Card key={post.id} titleAs="h2" title={<span lang={ptOnly}>{post.title}</span>} href={l(`/noticias/${post.slug}`)} eyebrow={<When iso={post.publishedAt} />} media={post.photo ? { src: post.photo.url, alt: post.photo.alt } : undefined} badges={<Badge tone={post.category === "urgente" ? "error" : "info"}>{postCategoryLabel[lang][post.category]}</Badge>}>
                {post.event ? <p className="news-when"><strong>{t({ pt: "Quando:", en: "When:", es: "Cuándo:", fr: "Quand :" })}</strong> <time dateTime={post.event.startsAt}>{eventWhen(lang, post.event)}</time></p> : null}
                <p lang={ptOnly}>{post.summary}</p>
              </Card>
            );
          })}
        </Grid>
      </Section>
    </>
  );
}
