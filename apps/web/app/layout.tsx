import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next } from "next/font/google";
import { organizationJsonLd } from "@gn/seo";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { getSeoSettings } from "@/lib/content";
import "./globals.css";

// Atkinson Hyperlegible Next: designed by the Braille Institute for readers with low vision, in a clean modern cut.
const atkinson = Atkinson_Hyperlegible_Next({ subsets: ["latin", "latin-ext"], variable: "--font-atkinson", display: "swap" });

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
    <html lang="pt-PT" className={atkinson.variable}>
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
