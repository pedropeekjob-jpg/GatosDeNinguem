import type { Cat, Impact, Page, Partner, Perk, Post, TranslationLang } from "./content";
import type { Product } from "./loja";

/**
 * Automatic translation of what the team writes in the back office (cats, news, pages, partners, shop articles,
 * the campaign). When a text is saved, every language whose translation was made by the machine (or is missing)
 * gets the fields that are new or changed in Portuguese. A translation the team wrote or corrected (auto: false)
 * is never overwritten.
 */

export const translationLangs = ["en", "es", "fr"] as const satisfies readonly TranslationLang[];

/** A text to translate: one string, or a list (a cat's traits). */
export type SourceText = string | string[];
/** Where each translated field's Portuguese comes from. */
export type TranslationSpec<T> = Record<string, (record: T) => SourceText | undefined>;

type Entry = Record<string, unknown> & { auto?: boolean };
type WithTranslations = { translations?: Partial<Record<TranslationLang, Entry>> };

export const catTranslationSpec: TranslationSpec<Cat> = {
  summary: (c) => c.summary,
  story: (c) => c.story,
  traits: (c) => c.traits,
  specialNeeds: (c) => c.specialNeeds,
  happyEndingText: (c) => c.happyEnding?.text,
};
export const postTranslationSpec: TranslationSpec<Post> = { title: (p) => p.title, summary: (p) => p.summary, body: (p) => p.body, ctaLabel: (p) => p.cta?.label };
export const pageTranslationSpec: TranslationSpec<Page> = { heading: (p) => p.heading, intro: (p) => p.intro };
export const partnerTranslationSpec: TranslationSpec<Partner> = { why: (p) => p.why };
export const perkTranslationSpec: TranslationSpec<Perk> = { description: (p) => p.description };
export const productTranslationSpec: TranslationSpec<Product> = { name: (p) => p.name, description: (p) => p.description };
export const campaignTranslationSpec: TranslationSpec<NonNullable<Impact["campaign"]>> = { title: (c) => c.title, unit: (c) => c.unit };

const isEmpty = (v: SourceText | undefined) => v === undefined || (Array.isArray(v) ? v.length === 0 : v.trim() === "");
const same = (a: SourceText | undefined, b: SourceText | undefined) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** One language's fields to (re)translate, with their Portuguese. */
export type TranslationJob = { lang: TranslationLang; fields: Record<string, SourceText> };

/**
 * What needs translating after a save. `previous` is the record before the change (undefined when new): a machine
 * translation of a field whose Portuguese did not change is kept as it is.
 */
export function translationJobs<T extends WithTranslations>(spec: TranslationSpec<T>, next: T, previous?: T): TranslationJob[] {
  const jobs: TranslationJob[] = [];
  for (const lang of translationLangs) {
    const entry = next.translations?.[lang];
    // Written or checked by the team: theirs.
    if (entry && entry.auto !== true) continue;
    const fields: Record<string, SourceText> = {};
    for (const [field, source] of Object.entries(spec)) {
      const pt = source(next);
      if (isEmpty(pt)) continue;
      const changed = !previous || !same(pt, source(previous));
      if (entry?.[field] === undefined || changed) fields[field] = pt!;
    }
    if (Object.keys(fields).length > 0) jobs.push({ lang, fields });
  }
  return jobs;
}

/**
 * The record with the machine's translations in. Fields whose Portuguese is now empty are dropped from machine
 * translations, so a removed text never lingers in another language.
 */
export function withTranslations<T extends WithTranslations>(spec: TranslationSpec<T>, record: T, done: { lang: TranslationLang; fields: Record<string, SourceText> }[]): T {
  const translations: Partial<Record<TranslationLang, Entry>> = { ...record.translations };
  for (const { lang, fields } of done) translations[lang] = { ...translations[lang], ...fields, auto: true };
  for (const lang of translationLangs) {
    const entry = translations[lang];
    if (!entry?.auto) continue;
    for (const [field, source] of Object.entries(spec)) if (isEmpty(source(record))) delete entry[field];
  }
  return { ...record, translations };
}

/** The language entries the team still has to look at: machine translations not yet checked. */
export function uncheckedTranslations(record: WithTranslations): TranslationLang[] {
  return translationLangs.filter((lang) => record.translations?.[lang]?.auto === true);
}
