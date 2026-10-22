import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const pages = ["/", "/adotar", "/adotar/tobias", "/adotar/descobrir", "/ajudar", "/sos", "/noticias", "/finais-felizes", "/parceiros", "/sobre", "/ajudar/turnos", "/apadrinhar", "/apadrinhar/tobias"];

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
      // Body text is at least 16px (the browser default).
      const size = await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize));
      expect(size).toBeGreaterThanOrEqual(16);
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
  const small = await page.$$eval(".gn-btn, .gn-nav__link", (els) =>
    els.filter((el) => (el as HTMLElement).offsetParent !== null && el.getBoundingClientRect().height < 44).map((el) => el.textContent),
  );
  expect(small).toEqual([]);
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

test("sponsor: Apadrinhar leads to sponsoring that cat, not to adopting it", async ({ page }) => {
  await page.goto("/");
  await page.locator(".featured").getByRole("link", { name: /^Apadrinhar/ }).click();
  await expect(page).toHaveURL(/\/apadrinhar\/[a-z0-9-]+$/);
  await expect(page.getByRole("heading", { level: 1, name: /^Apadrinhar/ })).toBeVisible();

  // From Ajudar, the sponsoring section lists cats to sponsor and each one opens its own form.
  await page.goto("/ajudar");
  await page.getByRole("link", { name: "Escolher um gato para apadrinhar" }).click();
  await expect(page).toHaveURL(/\/apadrinhar$/);
  await page.getByRole("link", { name: "Tobias" }).click();
  await expect(page).toHaveURL(/\/apadrinhar\/tobias$/);

  await page.getByText("Outro valor").click();
  await page.getByLabel("Valor por mês, em euros").fill("2");
  await page.getByRole("button", { name: "Quero apadrinhar o Tobias" }).click();
  await expect(page.getByText("O valor mínimo é 5 euros por mês")).toBeVisible();
  await expect(page.getByText("Indique o seu nome").first()).toBeVisible();
  await page.getByLabel("Valor por mês, em euros").fill("15");
  await page.getByLabel("O seu nome").fill("Ana Lima");
  await page.getByLabel("Email", { exact: true }).fill("ana@example.pt");
  await page.getByText("Aceito que a associação me contacte").click();
  await page.getByRole("button", { name: "Quero apadrinhar o Tobias" }).click();
  await expect(page.getByText("Obrigado! Tobias agradece.")).toBeVisible();
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

test("home: shelter photos in a full-width carousel, moved with the buttons", async ({ page }) => {
  await page.goto("/");
  const carousel = page.getByRole("region", { name: "Fotografias do gatil" });
  await expect(carousel).toBeVisible();
  const box = await carousel.boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual((page.viewportSize()!.width) - 1);
  await expect(carousel.getByText("1 / 4")).toBeVisible();
  await carousel.getByRole("button", { name: "Fotografia seguinte" }).click();
  await expect(carousel.getByText("2 / 4")).toBeVisible();
  // People who ask for reduced motion never get autoplay, but can still start it.
  await expect(carousel.getByRole("button", { name: "Passar automaticamente" })).toBeVisible();
});

test.describe("contas e Patinhas", () => {
  for (const path of ["/patinhas", "/conta"]) {
    test(`${path} is accessible and has SEO basics`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(results.violations.map((v) => v.id)).toEqual([]);
    });
  }

  test("create an account with just a name and a code, and earn welcome Patinhas", async ({ page }) => {
    await page.goto("/conta");
    await page.getByLabel("Email ou telemóvel").fill("maria@exemplo.pt");
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByRole("heading", { name: /Vamos criar a sua conta/ })).toBeVisible();
    await page.getByLabel("O seu nome").fill("Maria Silva");
    await page.getByRole("button", { name: "Enviar o código" }).click();
    await expect(page.getByText("Precisa de aceitar para criar a conta")).toBeVisible();
    await page.getByText("Aceito que a associação guarde").click();
    await page.getByRole("button", { name: "Enviar o código" }).click();
    const code = (await page.getByText(/Demonstração: o código é/).textContent())!.match(/\d{6}/)![0];
    await page.getByLabel("Código").fill(code);
    await page.getByRole("button", { name: "Criar a minha conta" }).click();
    await expect(page.getByText("Bem-vindo, Maria! Já tem 10 Patinhas.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Olá, Maria!" })).toBeVisible();
    await expect(page.getByRole("link", { name: /A minha conta \(Maria\)/ })).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });

  test("a helper swaps Patinhas for a partner perk and gets a code", async ({ page }) => {
    await page.goto("/conta");
    await page.getByLabel("Email ou telemóvel").fill("912 000 001");
    await page.getByRole("button", { name: "Continuar" }).click();
    const code = (await page.getByText(/Demonstração: o código é/).textContent())!.match(/\d{6}/)![0];
    await page.getByLabel("Código").fill(code);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("Amigo de Bigodes").first()).toBeVisible();
    await expect(page.getByRole("progressbar", { name: /Até ao nível 3/ })).toBeVisible();
    await page.getByRole("button", { name: "Trocar por 100 Patinhas" }).click();
    await page.getByRole("button", { name: "Sim, trocar" }).click();
    await expect(page.getByText(/^GN-[A-Z2-9]{5}$/).first()).toBeVisible();
    await expect(page.locator(".painel__saldo-valor")).toHaveText("185");
  });

  test("finishing the help quiz while signed in counts once", async ({ page }) => {
    await page.goto("/conta");
    await page.getByLabel("Email ou telemóvel").fill("913000002");
    await page.getByRole("button", { name: "Continuar" }).click();
    const code = (await page.getByText(/Demonstração: o código é/).textContent())!.match(/\d{6}/)![0];
    await page.getByLabel("Código").fill(code);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("heading", { name: "Olá, João!" })).toBeVisible();
    await page.goto("/ajudar");
    const quiz = page.locator("section", { hasText: "Não sabe por onde começar?" });
    await quiz.getByText("Quase nenhum").click();
    await quiz.getByRole("button", { name: "Continuar" }).click();
    await quiz.getByText("Agora não").click();
    await quiz.getByRole("button", { name: "Continuar" }).click();
    await quiz.getByText("Não", { exact: true }).click();
    await quiz.getByRole("button", { name: "Ver sugestão" }).click();
    await expect(page.getByText("Ganhou 10 Patinhas por fazer o questionário.")).toBeVisible();
  });
});

test.describe("no gatil: the volunteer's shift", () => {
  async function signIn(page: Page, phone: string) {
    await page.goto("/conta");
    await page.getByLabel("Email ou telemóvel").fill(phone);
    await page.getByRole("button", { name: "Continuar" }).click();
    const code = (await page.getByText(/Demonstração: o código é/).textContent())!.match(/\d{6}/)![0];
    await page.getByLabel("Código").fill(code);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("button", { name: "Sair" })).toBeVisible();
  }

  test("a volunteer on today's shift sees what to give, asks for help, and another volunteer takes it", async ({ page }) => {
    await signIn(page, "912 000 001");
    await page.getByRole("link", { name: "Ver o meu turno e os gatos" }).click();
    await expect(page.getByRole("heading", { name: "Medicação durante o seu turno" })).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);

    // Tobias's 09:00 dose cannot be given: a reason is required, then everyone is asked.
    const tobias = page.locator(".gatil__dose", { hasText: "Tobias" }).first();
    await tobias.getByRole("button", { name: "Não consigo dar" }).click();
    await tobias.getByRole("button", { name: "Pedir ajuda a todos" }).click();
    await expect(tobias.getByText("Diga porque não conseguiu")).toBeVisible();
    await tobias.getByLabel("Porque não consegue dar?").fill("Não se deixou pegar");
    await tobias.getByRole("button", { name: "Pedir ajuda a todos" }).click();
    await expect(page.getByText(/Pedimos ajuda a todos para Tobias/)).toBeVisible();
    await expect(tobias.getByText(/À espera de quem possa dar/)).toBeVisible();

    // Estrela's 08:00 insulin: given once, then it cannot be given again.
    const estrela = page.locator(".gatil__dose", { hasText: "08:00" });
    await estrela.getByRole("button", { name: "Já dei" }).click();
    await expect(estrela.getByText(/Dada por Ana Ribeiro/)).toBeVisible();
    await expect(estrela.getByRole("button", { name: "Já dei" })).toHaveCount(0);

    // João takes the request; the line about it now says it is solved.
    await page.goto("/conta");
    await page.getByRole("button", { name: "Sair" }).click();
    await signIn(page, "913000002");
    await page.goto("/conta/gatil");
    const request = page.locator(".gatil__pedido", { hasText: "Tobias" });
    await request.getByRole("button", { name: "Fico eu com isto" }).click();
    await expect(page.getByText(/Ficou consigo: Dar Semintra/)).toBeVisible();
    await expect(page.locator(".gatil__grupo", { hasText: "Tobias" }).getByText(/Resolvido: João Costa vai dar Semintra/)).toBeVisible();
  });

  test("notifications can be silenced, for oneself only", async ({ page }) => {
    await signIn(page, "912 000 001");
    await page.goto("/conta/gatil");
    await page.getByRole("button", { name: "Silenciar Tobias" }).click();
    await expect(page.getByText("Deixa de receber notificações sobre Tobias.")).toBeVisible();
    await expect(page.locator(".gatil__grupo", { hasText: "Tobias" })).toHaveCount(0);
    await page.getByText("Silenciar notificações").click();
    await page.getByText("Silenciar tudo").click();
    await page.getByRole("button", { name: "Guardar", exact: true }).click();
    await expect(page.getByText("Preferências guardadas. Só mudam para si.")).toBeVisible();
    await expect(page.getByRole("link", { name: /notificaç/ })).toHaveCount(0);
  });
});

test("home: Patinhas are explained above the fold, with a link to how they work", async ({ page }) => {
  await page.goto("/");
  const teaser = page.getByRole("complementary", { name: "Cada ajuda vale Patinhas" });
  await expect(teaser).toBeInViewport();
  await teaser.getByRole("link", { name: "Como funcionam as Patinhas" }).click();
  await expect(page).toHaveURL(/\/patinhas\/?$/);
});

test("menu links change page inside the app, without a reload or a loader flash", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.evaluate(() => { (window as unknown as { __same: boolean }).__same = true; });
  for (const name of ["Adotar", "Sobre nós", "Início"]) {
    await page.locator("header nav").getByRole("link", { name, exact: true }).click();
    await expect(page.locator("header nav").getByRole("link", { name, exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.locator(".route-loading")).toHaveCount(0);
  }
  expect(await page.evaluate(() => (window as unknown as { __same?: boolean }).__same)).toBe(true);
  expect(errors).toEqual([]);
});
