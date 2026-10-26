import type { ReactNode } from "react";
import { Inter, Inter_Tight } from "next/font/google";
import { organizationJsonLd } from "@gn/seo";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { Splash } from "@/components/Splash";
import { ScrollReveal } from "@/components/client/ScrollReveal";
import { ClientNavigation } from "@/components/client/ClientNavigation";
import { NewCatPrompt, type NewCat } from "@/components/client/CatAlerts";
import { LangSuggestion } from "@/components/client/LangSwitcher";
import { StrollingCat } from "@/components/client/StrollingCat";
import { strollingCatOn } from "@/lib/passeio";
import { getPage, getSeoSettings, listCats } from "@/lib/content";
import { localizeCat } from "@/lib/i18n/content";
import { locale, type Lang } from "@/lib/i18n/config";
import { LangProvider } from "@/lib/i18n/client";
import { i18nFor } from "@/lib/i18n/t";
import "@/app/globals.css";

// Inter: a clean, modern sans-serif made for screens, very legible at reading sizes. Inter Tight for headings.
const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap" });
const interTight = Inter_Tight({ subsets: ["latin", "latin-ext"], variable: "--font-inter-tight", display: "swap" });

/** The cats up for adoption, newest first, for the "new cat" pop-up and the strolling cat. */
async function adoptableCats(lang: Lang): Promise<NewCat[]> {
  const cats = await listCats("para-adocao").catch(() => []);
  return cats
    .filter((c) => c.photos[0])
    .sort((a, b) => (b.listedAt ?? "").localeCompare(a.listedAt ?? ""))
    .map((c) => localizeCat(c, lang))
    .map((c) => ({ slug: c.slug, name: c.name, sex: c.sex, ageYears: c.ageYears, summary: c.summary, status: "para-adocao", listedAt: c.listedAt, photo: c.photos[0]! }));
}

/**
 * Everything around a page: header, footer, pop-ups. The site has one of these per language (Portuguese at the
 * plain addresses, the others under /en, /es, /fr), so <html lang> is right from the first byte.
 */
export async function SiteLayout({ lang, children }: { lang: Lang; children: ReactNode }) {
  const { t, l } = i18nFor(lang);
  const [settings, cats, stroll] = await Promise.all([
    getSeoSettings(),
    adoptableCats(lang),
    getPage("/").then((p) => p.strollingCat).catch(() => undefined),
  ]);
  return (
    <html lang={locale[lang]} className={`${inter.variable} ${interTight.variable}`}>
      <body>
        <LangProvider lang={lang}>
          <Splash />
          <LangSuggestion />
          <Header />
          {process.env.NEXT_PUBLIC_STATIC_DEMO === "1" ? (
            <p className="demo-banner" role="note">
              {t({
                pt: <><strong>Versão de demonstração.</strong> Os gatos e as notícias são exemplos e os formulários não enviam dados.</>,
                en: <><strong>Demo version.</strong> The cats and news are examples and the forms send nothing.</>,
                es: <><strong>Versión de demostración.</strong> Los gatos y las noticias son ejemplos y los formularios no envían datos.</>,
                fr: <><strong>Version de démonstration.</strong> Les chats et les actualités sont des exemples et les formulaires n’envoient rien.</>,
              })}{" "}
              <a href={l("/adotar?avisos=agora")} rel="external">{t({ pt: "Ver o aviso de gato novo", en: "See the new cat alert", es: "Ver el aviso de gato nuevo", fr: "Voir l’alerte nouveau chat" })}</a>
            </p>
          ) : null}
          <main id="conteudo" tabIndex={-1}>{children}</main>
          <Footer />
          <ScrollReveal />
          <ClientNavigation />
          <NewCatPrompt cats={cats.slice(0, 6)} />
          {strollingCatOn && stroll?.on !== false ? <StrollingCat cats={cats} everySeconds={stroll?.everySeconds} /> : null}
          <JsonLd data={organizationJsonLd(settings)} />
        </LangProvider>
      </body>
    </html>
  );
}
