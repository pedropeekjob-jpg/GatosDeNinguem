import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, Fredoka } from "next/font/google";
import { organizationJsonLd } from "@gn/seo";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { getSeoSettings } from "@/lib/content";
import "./globals.css";

// A typeface designed by the Braille Institute for readers with low vision.
const atkinson = Atkinson_Hyperlegible({ subsets: ["latin", "latin-ext"], weight: ["400", "700"], variable: "--font-atkinson", display: "swap" });
// Rounded, friendly headings that echo the hand-drawn logo while staying easy to read.
const fredoka = Fredoka({ subsets: ["latin", "latin-ext"], weight: ["500", "600"], variable: "--font-fredoka", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSeoSettings();
  return {
    metadataBase: new URL(settings.siteUrl),
    applicationName: settings.siteName,
    icons: { icon: "/logo.svg" },
    verification: settings.googleSiteVerification ? { google: settings.googleSiteVerification } : undefined,
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#221e20" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSeoSettings();
  return (
    <html lang="pt-PT" className={`${atkinson.variable} ${fredoka.variable}`}>
      <body>
        <Header />
        {process.env.NEXT_PUBLIC_STATIC_DEMO === "1" ? (
          <p className="demo-banner" role="note">
            <strong>Versão de demonstração.</strong> Os gatos e as notícias são exemplos e os formulários não enviam dados.
          </p>
        ) : null}
        <main id="conteudo" tabIndex={-1}>{children}</main>
        <Footer />
        <JsonLd data={organizationJsonLd(settings)} />
      </body>
    </html>
  );
}
