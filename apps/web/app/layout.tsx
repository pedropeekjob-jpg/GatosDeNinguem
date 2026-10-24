import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import { organizationJsonLd } from "@gn/seo";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { Splash } from "@/components/Splash";
import { ScrollReveal } from "@/components/client/ScrollReveal";
import { ClientNavigation } from "@/components/client/ClientNavigation";
import { CatAlertPrompt } from "@/components/client/CatAlerts";
import { getSeoSettings } from "@/lib/content";
import "./globals.css";

// Inter: a clean, modern sans-serif made for screens, very legible at reading sizes. Inter Tight for headings.
const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap" });
const interTight = Inter_Tight({ subsets: ["latin", "latin-ext"], variable: "--font-inter-tight", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSeoSettings();
  return {
    metadataBase: new URL(settings.siteUrl),
    applicationName: settings.siteName,
    icons: { icon: "/logo.svg" },
    verification: settings.googleSiteVerification ? { google: settings.googleSiteVerification } : undefined,
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSeoSettings();
  return (
    <html lang="pt-PT" className={`${inter.variable} ${interTight.variable}`}>
      <body>
        <Splash />
        <Header />
        {process.env.NEXT_PUBLIC_STATIC_DEMO === "1" ? (
          <p className="demo-banner" role="note">
            <strong>Versão de demonstração.</strong> Os gatos e as notícias são exemplos e os formulários não enviam dados.
          </p>
        ) : null}
        <main id="conteudo" tabIndex={-1}>{children}</main>
        <Footer />
        <ScrollReveal />
        <ClientNavigation />
        <CatAlertPrompt />
        <JsonLd data={organizationJsonLd(settings)} />
      </body>
    </html>
  );
}
