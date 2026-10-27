import { translationJobs, withTranslations, type SourceText, type TranslationJob, type TranslationLang, type TranslationSpec } from "@gn/domain";
import type { ApiOptions } from "../common/options";

/** Words never translated, whatever the text: the association and its points. */
const ALWAYS_KEEP = ["Gatos de Ninguém", "Patinhas", "Viana do Castelo", "Santa Marta de Portuzelo", "Paquito", "Caramelo", "Carlota"];

type WithTranslations = { translations?: Partial<Record<TranslationLang, Record<string, unknown> & { auto?: boolean }>> };

/**
 * Fills in machine translations when the team saves a text (see translationJobs in the domain). Saving never fails
 * because of it: without a translator, or if the service is down, the text is saved in Portuguese only and the
 * missing languages are filled the next time it is saved, or from the back office ("Traduzir o que falta").
 */
export class TranslationService {
  constructor(private readonly options: ApiOptions) {}

  get enabled() { return !!this.options.translator; }
  get provider() { return this.options.translator?.name; }

  async fill<T extends WithTranslations>(spec: TranslationSpec<T>, next: T, previous?: T, keep: (string | undefined)[] = []): Promise<T> {
    const translator = this.options.translator;
    if (!translator) return next;
    const jobs = translationJobs(spec, next, previous);
    if (jobs.length === 0) return withTranslations(spec, next, []);
    const words = [...ALWAYS_KEEP, ...keep.filter((w): w is string => !!w)];
    const done: TranslationJob[] = [];
    for (const job of jobs) {
      try {
        done.push({ lang: job.lang, fields: await this.translateFields(job, words) });
      } catch (err) {
        console.error(`Could not translate into ${job.lang}`, err);
      }
    }
    return withTranslations(spec, next, done);
  }

  /** All the fields of one language in a single request; lists (traits) go item by item and come back as lists. */
  private async translateFields(job: TranslationJob, keep: string[]): Promise<Record<string, SourceText>> {
    const flat: string[] = [];
    const layout: [string, number, boolean][] = [];
    for (const [field, value] of Object.entries(job.fields)) {
      const items = Array.isArray(value) ? value : [value];
      layout.push([field, items.length, Array.isArray(value)]);
      flat.push(...items);
    }
    const out = await this.options.translator!.translate(flat, job.lang, keep);
    const fields: Record<string, SourceText> = {};
    let i = 0;
    for (const [field, count, isList] of layout) {
      const items = out.slice(i, i + count);
      i += count;
      fields[field] = isList ? items : items[0]!;
    }
    return fields;
  }
}
