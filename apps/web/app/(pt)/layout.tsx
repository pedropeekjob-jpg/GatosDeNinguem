import type { Metadata, Viewport } from "next";
import { SiteLayout } from "@/components/SiteLayout";
import { getSeoSettings } from "@/lib/content";
import { langFrom } from "@/lib/i18n/server";

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

/** The Portuguese site, at the plain addresses ("/adotar"). The other languages live in app/[lang]. */
export default async function PortugueseLayout({ children }: { children: React.ReactNode }) {
  await langFrom(undefined);
  return <SiteLayout lang="pt">{children}</SiteLayout>;
}
