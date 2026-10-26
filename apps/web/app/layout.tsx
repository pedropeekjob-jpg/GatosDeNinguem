import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import { organizationJsonLd } from "@gn/seo";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { Splash } from "@/components/Splash";
import { ScrollReveal } from "@/components/client/ScrollReveal";
import { ClientNavigation } from "@/components/client/ClientNavigation";
import { NewCatPrompt, type NewCat } from "@/components/client/CatAlerts";
import { StrollingCat } from "@/components/client/StrollingCat";
import { strollingCatOn } from "@/lib/passeio";
import { getPage, getSeoSettings, listCats } from "@/lib/content";
import "./globals.css";

// Inter: a clean, modern sans-serif made for screens, very legible at reading sizes. Inter Tight for headings.
const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap" });
const interTight = Inter_Tight({ subsets: ["latin", "latin-ext"], variable: "--font-inter-tight", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSeoSettings();
  return {
    metadataBase: new URL(settings.siteUrl),
    applicationName: settings.siteName,
    icons: {
      icon: [{ url: "/favicon.ico", sizes: "48x48" }, { url: "/icon.svg", type: "image/svg+xml" }],
      apple: "/apple-touch-icon.png",
    },
    verification: settings.googleSiteVerification ? { google: settings.googleSiteVerification } : undefined,
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };

/** The cats up for adoption, newest first, for the "new cat" pop-up and the strolling cat. */
async function adoptableCats(): Promise<NewCat[]> {
  const cats = await listCats("para-adocao").catch(() => []);
  return cats
    .filter((c) => c.photos[0])
    .sort((a, b) => (b.listedAt ?? "").localeCompare(a.listedAt ?? ""))
    .map((c) => ({ slug: c.slug, name: c.name, sex: c.sex, ageYears: c.ageYears, summary: c.summary, status: "para-adocao", listedAt: c.listedAt, photo: c.photos[0]! }));
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, cats, stroll] = await Promise.all([
    getSeoSettings(),
    adoptableCats(),
    getPage("/").then((p) => p.strollingCat).catch(() => undefined),
  ]);
  return (
    <html lang="pt-PT" className={`${inter.variable} ${interTight.variable}`}>
      <body>
        <Splash />
        <Header />
        {process.env.NEXT_PUBLIC_STATIC_DEMO === "1" ? (
          <p className="demo-banner" role="note">
            <strong>Versão de demonstração.</strong> Os gatos e as notícias são exemplos e os formulários não enviam dados. <a href="/adotar?avisos=agora" rel="external">Ver o aviso de gato novo</a>
          </p>
        ) : null}
        <main id="conteudo" tabIndex={-1}>{children}</main>
        <Footer />
        <ScrollReveal />
        <ClientNavigation />
        <NewCatPrompt cats={cats.slice(0, 6)} />
        {strollingCatOn && stroll?.on !== false ? <StrollingCat cats={cats} everySeconds={stroll?.everySeconds} /> : null}
        <JsonLd data={organizationJsonLd(settings)} />
      </body>
    </html>
  );
}
