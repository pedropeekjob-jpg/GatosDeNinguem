import { describe, expect, it } from "vitest";
import { seedSeoSettings as settings } from "@gn/domain";
import {
  auditSeo,
  breadcrumbJsonLd,
  buildRobotsTxt,
  buildSitemapXml,
  findRedirect,
  organizationJsonLd,
  resolveSeo,
} from "./index";

describe("resolveSeo", () => {
  it("applies the title template and defaults when nothing is overridden", () => {
    const seo = resolveSeo(settings, { path: "/adotar", title: "Adotar um gato" });
    expect(seo.title).toBe("Adotar um gato | Gatos de Ninguém");
    expect(seo.description).toBe(settings.defaultDescription);
    expect(seo.canonical).toBe("https://gatosdeninguem.pt/adotar");
    expect(seo.robots).toEqual({ index: true, follow: true });
  });

  it("uses an SEO override title verbatim, without the template", () => {
    const seo = resolveSeo(settings, { path: "/", title: "Início", overrides: { title: "Adoção de gatos em Viana do Castelo" } });
    expect(seo.title).toBe("Adoção de gatos em Viana do Castelo");
  });

  it("honours canonical, noindex and image overrides", () => {
    const seo = resolveSeo(settings, {
      path: "/gatos/mia",
      title: "Mia",
      image: "/demo/mia.svg",
      overrides: { canonicalUrl: "https://gatosdeninguem.pt/adotar/mia", noindex: true },
    });
    expect(seo.canonical).toBe("https://gatosdeninguem.pt/adotar/mia");
    expect(seo.robots.index).toBe(false);
    expect(seo.openGraph.image).toBe("https://gatosdeninguem.pt/demo/mia.svg");
  });

  it("normalises trailing slashes in canonicals", () => {
    expect(resolveSeo(settings, { path: "/sobre/", title: "x" }).canonical).toBe("https://gatosdeninguem.pt/sobre");
    expect(resolveSeo(settings, { path: "/", title: "x" }).canonical).toBe("https://gatosdeninguem.pt/");
  });
});

describe("JSON-LD", () => {
  it("describes the association as an animal shelter and NGO", () => {
    const org = organizationJsonLd(settings);
    expect(org["@type"]).toEqual(["AnimalShelter", "NGO"]);
    expect(org.sameAs).toContain("https://www.instagram.com/gatosdeninguem/");
  });

  it("builds breadcrumbs with absolute URLs and positions", () => {
    const crumbs = breadcrumbJsonLd(settings, [
      { name: "Início", path: "/" },
      { name: "Adotar", path: "/adotar" },
    ]);
    expect(crumbs.itemListElement[1]).toMatchObject({ position: 2, item: "https://gatosdeninguem.pt/adotar" });
  });
});

describe("sitemap and robots", () => {
  it("lists indexable entries only, with escaped URLs", () => {
    const xml = buildSitemapXml(settings, [
      { path: "/", lastModified: "2026-10-22T09:00:00.000Z" },
      { path: "/rascunho", noindex: true },
      { path: "/adotar/a&b" },
    ]);
    expect(xml).toContain("<loc>https://gatosdeninguem.pt/</loc>");
    expect(xml).toContain("<lastmod>2026-10-22</lastmod>");
    expect(xml).not.toContain("rascunho");
    expect(xml).toContain("a&amp;b");
  });

  it("points robots.txt at the sitemap and appends editor lines", () => {
    const txt = buildRobotsTxt({ ...settings, robotsExtra: "Disallow: /rascunhos" }, { allowIndexing: true });
    expect(txt).toContain("Sitemap: https://gatosdeninguem.pt/sitemap.xml");
    expect(txt).toContain("Disallow: /rascunhos");
  });

  it("blocks everything on preview environments", () => {
    expect(buildRobotsTxt(settings, { allowIndexing: false })).toContain("Disallow: /\n");
  });
});

describe("findRedirect", () => {
  const redirects = [
    { id: "1", from: "/gatos/como-ajudar", to: "/ajudar", permanent: true },
    { id: "2", from: "/antigo", to: "https://example.org/x", permanent: false },
  ];
  it("matches ignoring case and trailing slash", () => {
    expect(findRedirect(redirects, "/Gatos/Como-Ajudar/")?.to).toBe("/ajudar");
  });
  it("returns undefined when nothing matches", () => {
    expect(findRedirect(redirects, "/ajudar")).toBeUndefined();
  });
});

describe("auditSeo", () => {
  it("flags short, long, missing and duplicate fields in plain language", () => {
    const issues = auditSeo([
      { id: "a", label: "Início", title: "Curto", description: "" },
      { id: "b", label: "Adotar", title: "Adotar gatos em Viana do Castelo, gatos esterilizados", description: "x".repeat(200) },
      { id: "c", label: "Outra", title: "Adotar gatos em Viana do Castelo, gatos esterilizados", description: "Descrição com tamanho suficiente para ser útil a quem pesquisa no Google sobre adoção." },
    ]);
    const codes = issues.map((i) => `${i.id}:${i.code}`);
    expect(codes).toContain("a:title-short");
    expect(codes).toContain("a:description-missing");
    expect(codes).toContain("b:description-long");
    expect(codes).toContain("c:title-duplicate");
    expect(issues.every((i) => i.message.length > 10)).toBe(true);
  });
});
