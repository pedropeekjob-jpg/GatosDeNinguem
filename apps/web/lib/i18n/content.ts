import type { Page, Partner, Post, Product } from "@gn/domain";
import type { HappyEndingItem, PublicCat } from "@/lib/content";
import type { Lang } from "./config";

/**
 * Texts the team writes in the back office (cats, pages, news, shop articles) in the visitor's language.
 * Each record carries its own translations; whatever has none is shown in Portuguese, and `ptOnly` says so, so the
 * page can mark it (lang="pt-PT" for screen readers, and a short note for people).
 */

type Localized<T> = T & { ptOnly?: boolean };

export function localizeCat<T extends Pick<PublicCat, "summary" | "story" | "traits" | "specialNeeds" | "translations"> & { happyEnding?: PublicCat["happyEnding"] }>(cat: T, lang: Lang): Localized<T> {
  if (lang === "pt") return cat;
  const t = cat.translations?.[lang];
  if (!t) return { ...cat, ptOnly: true };
  return {
    ...cat,
    summary: t.summary ?? cat.summary,
    story: t.story ?? cat.story,
    traits: t.traits ?? cat.traits,
    specialNeeds: cat.specialNeeds ? t.specialNeeds ?? cat.specialNeeds : undefined,
    happyEnding: cat.happyEnding ? { ...cat.happyEnding, text: t.happyEndingText ?? cat.happyEnding.text } : cat.happyEnding,
    ptOnly: !t.story,
  };
}

export const localizeHappyEnding = (item: HappyEndingItem, lang: Lang): HappyEndingItem => {
  const cat = localizeCat(item.cat, lang);
  const text = lang !== "pt" ? item.cat.translations?.[lang]?.happyEndingText : undefined;
  return { cat, happyEnding: item.happyEnding && text ? { ...item.happyEnding, text } : item.happyEnding };
};

export function localizePage(page: Page, lang: Lang): Localized<Page> {
  if (lang === "pt") return page;
  const t = page.translations?.[lang];
  return { ...page, heading: t?.heading ?? page.heading, intro: t?.intro ?? page.intro, ptOnly: !t?.intro };
}

export function localizePost(post: Post, lang: Lang): Localized<Post> {
  if (lang === "pt") return post;
  const t = post.translations?.[lang];
  if (!t) return { ...post, ptOnly: true };
  return {
    ...post,
    title: t.title ?? post.title,
    summary: t.summary ?? post.summary,
    body: t.body ?? post.body,
    cta: post.cta ? { ...post.cta, label: t.ctaLabel ?? post.cta.label } : undefined,
    ptOnly: !t.body,
  };
}

export function localizeProduct(product: Product, lang: Lang): Localized<Product> {
  if (lang === "pt") return product;
  const t = product.translations?.[lang];
  return { ...product, name: t?.name ?? product.name, description: t?.description ?? product.description, ptOnly: !t?.description && !!product.description };
}

export function localizePartner(partner: Partner, lang: Lang): Localized<Partner> {
  if (lang === "pt") return partner;
  const t = partner.translations?.[lang];
  return { ...partner, why: t?.why ?? partner.why, ptOnly: !t?.why && !!partner.why };
}
