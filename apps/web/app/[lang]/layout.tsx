import { otherLangs } from "@/lib/i18n/config";
import { SiteLayout } from "@/components/SiteLayout";
import { langFrom } from "@/lib/i18n/server";

export { generateMetadata, viewport } from "../(pt)/layout";

/** Only these languages exist; any other first segment ("/xyz") is a page that is not there. */
export const dynamicParams = false;
export const generateStaticParams = () => otherLangs.map((lang) => ({ lang }));

/**
 * English, Spanish and French: the same pages as the Portuguese site, under /en, /es and /fr. Each page file
 * in here only re-exports its Portuguese twin, which reads the language from the address.
 */
export default async function OtherLanguageLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await langFrom(params);
  return <SiteLayout lang={lang}>{children}</SiteLayout>;
}
