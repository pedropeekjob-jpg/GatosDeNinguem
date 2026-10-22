import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const pages = ["/", "/adotar", "/adotar/tobias", "/adotar/descobrir", "/ajudar", "/sos", "/noticias", "/finais-felizes", "/parceiros", "/sobre", "/ajudar/turnos"];

test.describe("every page", () => {
  for (const path of pages) {
    test(`${path} is accessible, readable and has SEO basics`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("h1")).toHaveCount(1);
      expect(await page.title()).not.toBe("");
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
      await expect(page.locator('meta[name="description"]')).toHaveCount(1);
      // No horizontal scrolling on any screen size.
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
      // Body text is at least 18px for older readers.
      const size = await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize));
      expect(size).toBeGreaterThanOrEqual(18);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

test("main navigation is always visible (no hidden menu)", async ({ page }) => {
  await page.goto("/");
  for (const name of ["Início", "Adotar", "Ajudar", "Notícias", "Sobre nós"]) {
    await expect(page.getByRole("navigation", { name: "Menu principal" }).getByRole("link", { name })).toBeVisible();
  }
  await expect(page.getByRole("link", { name: "Encontrei um gato" }).first()).toBeVisible();
  // The association's own logo leads home.
  await expect(page.getByRole("link", { name: "Gatos de Ninguém, página inicial" })).toBeVisible();
});

test("touch targets are at least 44px tall", async ({ page }) => {
  await page.goto("/");
  const small = await page.$$eval(".gn-btn, .gn-nav__link, .gn-textsize__btn", (els) =>
    els.filter((el) => (el as HTMLElement).offsetParent !== null && el.getBoundingClientRect().height < 44).map((el) => el.textContent),
  );
  expect(small).toEqual([]);
});

test("text size control enlarges the page text", async ({ page }) => {
  await page.goto("/");
  const before = await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize));
  await page.getByRole("button", { name: "Letra muito grande" }).click();
  const after = await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize));
  expect(after).toBeGreaterThan(before * 1.2);
});

test("adopt: from the list to sending a request to meet a cat", async ({ page }) => {
  await page.goto("/adotar");
  await page.getByRole("link", { name: "Tobias" }).click();
  await expect(page).toHaveURL(/\/adotar\/tobias$/);
  await page.getByRole("link", { name: /Quero conhecer/ }).click();
  await page.getByRole("button", { name: "Enviar pedido" }).click();
  await expect(page.getByText("Indique o seu nome").first()).toBeVisible();
  await page.getByLabel("O seu nome").fill("Maria Silva");
  await page.getByLabel("Telefone").fill("912345678");
  await page.getByLabel("Onde vive?").fill("Viana do Castelo");
  await page.getByText("À tarde").click();
  await page.getByText("Aceito que a associação me contacte").click();
  await page.getByRole("button", { name: "Enviar pedido" }).click();
  await expect(page.getByText("Obrigado! Recebemos o seu pedido.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver outros gatos" })).toBeVisible();
});

test("descobrir: answer questions, see a match with reasons, save a cat", async ({ page }) => {
  await page.goto("/adotar/descobrir");
  const answers = ["Não", "Não tenho", "Muito, estou quase sempre em casa", "Um gato calmo, de colo", "Prefiro que não"];
  for (const [i, answer] of answers.entries()) {
    await page.getByText(answer, { exact: true }).click();
    await page.getByRole("button", { name: i === answers.length - 1 ? "Ver gatos" : "Continuar" }).click();
  }
  await expect(page.getByText(/Super match|Combina consigo/)).toBeVisible();
  await expect(page.getByText("Porque combina consigo:")).toBeVisible();
  const name = await page.locator("#descobrir-nome").textContent();
  await page.getByRole("button", { name: "Gostava de conhecer" }).click();
  await page.goto("/adotar");
  await expect(page.getByText(/Tem 1 gato guardado/)).toBeVisible();
  await expect(page.getByRole("status").getByRole("link", { name: name! })).toBeVisible();
});

test("help quiz always ends with a concrete action", async ({ page }) => {
  await page.goto("/ajudar");
  const quiz = page.locator("section", { hasText: "Não sabe por onde começar?" });
  await quiz.getByText("Quase nenhum").click();
  await quiz.getByRole("button", { name: "Continuar" }).click();
  await quiz.getByText("Sim, todos os meses").click();
  await quiz.getByRole("button", { name: "Continuar" }).click();
  await quiz.getByText("Não", { exact: true }).click();
  await quiz.getByRole("button", { name: "Ver sugestão" }).click();
  await expect(quiz.getByText("A nossa sugestão: Apadrinhar um gato")).toBeVisible();
});

test("SOS guide: injured cat goes straight to urgent vet advice", async ({ page }) => {
  await page.goto("/sos");
  await page.getByText("Um gato ferido ou atropelado").click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("heading", { name: "Leve-o já ao veterinário mais próximo" })).toBeVisible();
  await expect(page.getByText("Urgente")).toBeVisible();
});

test("SEO: old Wix URLs redirect, sitemap and robots are served", async ({ page, request }) => {
  await page.goto("/gatos/como-ajudar");
  await expect(page).toHaveURL(/\/ajudar$/);
  const sitemap = await request.get("/sitemap.xml");
  expect(await sitemap.text()).toContain("/adotar/tobias</loc>");
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain("Disallow: /");
});

test("SEO: cat pages carry structured data and Open Graph", async ({ page }) => {
  await page.goto("/adotar/mia");
  const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(jsonLd.join()).toContain('"BreadcrumbList"');
  expect(jsonLd.join()).toContain('"AnimalShelter"');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /gato-tigrado\.svg/);
  await expect(page).toHaveTitle("Mia, gata para adoção em Viana do Castelo | Gatos de Ninguém");
});

test("partner application form validates and thanks", async ({ page }) => {
  await page.goto("/parceiros");
  await page.getByLabel("Nome do negócio").fill("Padaria Central");
  await page.getByLabel("O seu nome").fill("Ana Costa");
  await page.getByLabel("Email", { exact: true }).fill("ana@example.pt");
  await page.getByLabel("Localidade").fill("Viana do Castelo");
  await page.getByText("Aceito que a associação me contacte sobre esta parceria").click();
  await page.getByRole("button", { name: "Quero ser parceiro" }).click();
  await expect(page.getByText("Obrigado! Entraremos em contacto em breve.")).toBeVisible();
});

test("volunteer finds a free shift from Ajudar and signs up", async ({ page }) => {
  await page.goto("/ajudar");
  await page.getByRole("link", { name: "Ver turnos livres e inscrever-me" }).click();
  await expect(page).toHaveURL(/\/ajudar\/turnos$/);
  // Days are headings, so screen readers can jump from day to day.
  await expect(page.getByRole("heading", { level: 2, name: "Quinta-feira, 5 de novembro" })).toBeVisible();
  const shift = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Levar a Pimenta à revisão" }) });
  await expect(shift.getByText("Falta 1 pessoa")).toBeVisible();
  await shift.getByRole("button", { name: "Quero ajudar neste turno" }).click();
  await shift.getByRole("button", { name: "Confirmar inscrição" }).click();
  await expect(shift.getByText("Indique o seu nome")).toBeVisible();
  await shift.getByLabel("O seu nome").fill("Maria Fernandes");
  await shift.getByLabel("Telemóvel").fill("912 345 678");
  await shift.getByText("Aceito que a associação me contacte sobre este turno").click();
  await shift.getByRole("button", { name: "Confirmar inscrição" }).click();
  await expect(shift.getByText("Está inscrito. Obrigado!")).toBeVisible();
  await expect(shift.getByRole("link", { name: "Pôr no meu calendário" })).toHaveAttribute("href", /^data:text\/calendar/);
});
