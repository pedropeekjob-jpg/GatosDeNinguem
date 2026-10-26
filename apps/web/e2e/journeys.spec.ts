import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { parseFeatures } from "@gn/domain";

// The same FEATURES setting the site was built with. CI runs the journeys twice: all off, and all on.
const features = parseFeatures(process.env.FEATURES);

const pages = ["/", "/adotar", "/adotar/tobias", "/adotar/perguntas", "/adotar/descobrir", "/ajudar", "/doar", "/sos", "/noticias", "/finais-felizes", "/parceiros", "/sobre", "/ajudar/turnos", "/apadrinhar", "/apadrinhar/tobias", "/ajudar/familia-temporaria", "/ajudar/voluntariado", ...(features.amigo ? ["/ajudar/amigo"] : []), "/loja", "/loja/t-shirt-gatos-de-ninguem", "/loja/cesto", "/loja/condicoes", "/privacidade", "/cookies", "/contactos"];

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

const phone = (info: { project: { name: string } }) => info.project.name.startsWith("telemovel");

/** Opens a page from the main menu: a tab or "Mais" on phones, a section of the top menu on wide screens. */
async function openFromMenu(page: Page, phoneOnly: boolean, section: string, link: RegExp) {
  if (phoneOnly) {
    const menu = page.getByRole("dialog", { name: "Menu" });
    // A tap before the page has finished loading its scripts does nothing yet: tap again, as a person would.
    await expect(async () => {
      if (!(await menu.isVisible())) await page.getByRole("navigation", { name: "Menu principal" }).getByRole("button", { name: "Mais" }).click({ timeout: 2000 });
      await expect(menu).toBeVisible({ timeout: 2000 });
    }).toPass();
    await menu.getByRole("link", { name: link }).click();
  } else {
    const nav = page.getByRole("navigation", { name: "Menu principal" });
    await nav.getByRole("button", { name: new RegExp(`^${section}`) }).click();
    await nav.getByRole("link", { name: link }).click();
  }
}

test("main navigation: four sections at most, always visible (no hidden menu)", async ({ page }, info) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Menu principal" });
  if (phone(info)) {
    // Phones: three tabs and "Mais", which opens every other page.
    for (const name of ["Início", "Adotar", "Doar"]) await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
    await expect(nav.getByRole("button", { name: "Mais" })).toBeVisible();
    await expect(nav.getByRole("listitem")).toHaveCount(4);
  } else {
    // Wide screens: four sections; the logo leads home.
    for (const name of ["Adotar", "Doar", "Ajudar", "Sobre nós"]) await expect(nav.getByRole("button", { name: new RegExp(`^${name}`) })).toBeVisible();
    await expect(nav.locator(":scope > ul > li")).toHaveCount(4);
  }
  // "Sobre nós" is always in the footer too.
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "Sobre nós" })).toBeVisible();
  // The site does not invite found-cat requests: no "Encontrei um gato" link anywhere on the page.
  await expect(page.getByRole("link", { name: "Encontrei um gato" })).toHaveCount(0);
  // The association's own logo leads home.
  await expect(page.getByRole("link", { name: "Gatos de Ninguém, página inicial" })).toBeVisible();
});

test("main navigation: every section's pages open from the menu, by mouse, touch or keyboard", async ({ page }, info) => {
  await page.goto("/");
  await openFromMenu(page, phone(info), "Sobre nós", /^Notícias/);
  await expect(page).toHaveURL(/\/noticias\/?$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  if (phone(info)) {
    // A page without a tab of its own lights "Mais"; Back closes the menu instead of leaving the page.
    const more = page.getByRole("navigation", { name: "Menu principal" }).getByRole("button", { name: "Mais" });
    await expect(more).toHaveClass(/gn-nav__link--here/);
    await more.click();
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();
    await expect(page).toHaveURL(/\/noticias\/?$/);
    // Back from a page opened from "Mais" returns to where the visitor was.
    await openFromMenu(page, true, "Ajudar", /^Família temporária/);
    await expect(page).toHaveURL(/\/ajudar\/familia-temporaria\/?$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/noticias\/?$/);
  } else {
    const nav = page.getByRole("navigation", { name: "Menu principal" });
    await expect(nav.getByRole("button", { name: /^Sobre nós/ })).toHaveClass(/gn-nav__link--here/);
    // Keyboard: Enter opens, Tab walks the pages, Esc closes and returns to the section.
    const help = nav.getByRole("button", { name: /^Ajudar/ });
    await help.focus();
    await page.keyboard.press("Enter");
    await expect(help).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Tab");
    await expect(nav.getByRole("link", { name: /^Todas as formas de ajudar/ })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(help).toHaveAttribute("aria-expanded", "false");
    await expect(help).toBeFocused();
    // A click elsewhere closes it too.
    await help.click();
    await page.mouse.click(10, 600);
    await expect(help).toHaveAttribute("aria-expanded", "false");
  }
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
  await page.getByRole("button", { name: /Quero conhecer/ }).click();
  const dialog = page.getByRole("dialog", { name: "Quero conhecer o Tobias" });
  await expect(dialog).toBeVisible();
  await page.getByRole("button", { name: "Enviar pedido" }).click();
  await expect(page.getByText("Indique o seu nome").first()).toBeVisible();
  await page.getByLabel("O seu nome").fill("Maria Silva");
  await page.getByLabel("Telefone").fill("912345678");
  await page.getByLabel("Onde vive?").fill("Viana do Castelo");
  await page.getByText("À tarde").click();
  await page.getByText("Aceito que a associação me contacte").click();
  await page.getByRole("button", { name: "Enviar pedido" }).click();
  await expect(page.getByText("Obrigado! Recebemos o seu pedido.")).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Ver outros gatos" })).toBeVisible();
});

test("forms open in a window that closes with Fechar, Esc or the Back button", async ({ page }) => {
  await page.goto("/ajudar/familia-temporaria");
  await expect(page.getByLabel("O seu nome")).toHaveCount(0);
  const open = page.getByRole("button", { name: "Quero ser família temporária" }).first();
  const dialog = page.getByRole("dialog", { name: "Quero ser família temporária" });
  await open.click();
  await expect(dialog.getByLabel("O seu nome")).toBeVisible();
  await dialog.getByRole("button", { name: "Fechar" }).click();
  await expect(dialog).toBeHidden();
  await open.click();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await open.click();
  await expect(dialog).toBeVisible();
  await page.goBack();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/ajudar\/familia-temporaria$/);
});

test("sponsor: Apadrinhar leads to sponsoring that cat, not to adopting it", async ({ page }) => {
  await page.goto("/");
  await page.locator(".featured").getByRole("link", { name: /^Apadrinhar/ }).click();
  await expect(page).toHaveURL(/\/apadrinhar\/[a-z0-9-]+$/);
  await expect(page.getByRole("heading", { level: 1, name: /^Apadrinhar/ })).toBeVisible();

  // From Ajudar, the Apadrinhar button opens the list of cats to sponsor and each one opens its own form.
  await page.goto("/ajudar");
  await page.getByRole("link", { name: "Apadrinhar", exact: true }).click();
  await expect(page).toHaveURL(/\/apadrinhar$/);
  await page.getByRole("link", { name: "Tobias" }).click();
  await expect(page).toHaveURL(/\/apadrinhar\/tobias$/);

  await page.getByRole("button", { name: "Quero apadrinhar o Tobias" }).click();
  await page.getByText("Outro valor").click();
  await page.getByLabel("Valor por mês, em euros").fill("2");
  await page.getByRole("button", { name: "Continuar para o débito" }).click();
  await expect(page.getByText("O valor mínimo é 5 euros por mês")).toBeVisible();
  await expect(page.getByText("Indique o seu nome").first()).toBeVisible();
  await page.getByLabel("Valor por mês, em euros").fill("15");
  await page.getByLabel("O seu nome").fill("Ana Lima");
  await page.getByLabel("Email", { exact: true }).fill("ana@example.pt");
  await page.getByText("Tenho 18 anos ou mais e aceito").click();
  await page.getByRole("button", { name: "Continuar para o débito" }).click();
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

test("Ajudar: each button opens its own page, and old #links still land there", async ({ page }) => {
  const buttons = [
    ["Apadrinhar", /\/apadrinhar$/, /^Apadrinhar um gato$/],
    ["Fazer um donativo", /\/doar$/, /^Fazer um donativo$/],
    ["Ser voluntário", /\/ajudar\/voluntariado$/, /^Ser voluntário$/],
    ...(features.amigo ? [["Ser Amigo", /\/ajudar\/amigo$/, /^Ser Amigo da associação$/] as const] : []),
  ] as const;
  for (const [name, url, heading] of buttons) {
    await page.goto("/ajudar");
    await page.getByRole("main").getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(url);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
  }
  await page.goto("/ajudar#doar");
  await expect(page).toHaveURL(/\/doar$/);
  await expect(page.getByText("PT50 0045 1436 4033 0203 2321 6")).toBeVisible();
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
  // General guidance only: no way to reach the association from here.
  await expect(page.getByRole("main").getByText(/Contactar a associação/)).toHaveCount(0);
  await expect(page.getByRole("main").locator('a[href*="facebook"], a[href*="instagram"], a[href^="mailto:"], a[href^="tel:"], a[href*="wa.me"]')).toHaveCount(0);
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
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/fotos\/gato-tigrado-dani\.webp$/);
  await expect(page).toHaveTitle("Mia, gata para adoção em Viana do Castelo | Gatos de Ninguém");
});

test("partner application form validates and thanks", async ({ page }) => {
  await page.goto("/parceiros");
  await page.getByRole("button", { name: "Quero ser parceiro" }).click();
  await page.getByLabel("Nome do negócio").fill("Padaria Central");
  await page.getByLabel("O seu nome").fill("Ana Costa");
  await page.getByLabel("Email", { exact: true }).fill("ana@example.pt");
  await page.getByLabel("Localidade").fill("Viana do Castelo");
  await page.getByText("Aceito que a associação me contacte sobre esta parceria").click();
  await page.getByRole("button", { name: "Enviar pedido" }).click();
  await expect(page.getByText("Obrigado! Entraremos em contacto em breve.")).toBeVisible();
});

test("volunteer finds a free shift from Ajudar and signs up", async ({ page }) => {
  await page.goto("/ajudar");
  await page.getByRole("link", { name: "Ser voluntário", exact: true }).click();
  await expect(page).toHaveURL(/\/ajudar\/voluntariado$/);
  await page.getByRole("link", { name: "Ver turnos livres e inscrever-me" }).first().click();
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

test("home: opens on the shelter's real photos, with the welcome and main buttons in the first screen", async ({ page }) => {
  await page.goto("/");
  const carousel = page.getByRole("region", { name: "Fotografias do gatil" });
  await expect(carousel).toBeVisible();
  const box = await carousel.boundingBox();
  // Full width, from edge to edge.
  expect(box!.width).toBeGreaterThanOrEqual(page.viewportSize()!.width - 1);
  expect(box!.y).toBeLessThan(120); // right under the header: the photos are the top of the page
  await expect(carousel.locator("img").first()).toHaveAttribute("src", /\/fotos\/.+\.webp$/);
  // Nothing to scroll for: the title and the two main buttons are on screen, clear of the phone tab bar.
  await expect(page.getByRole("heading", { level: 1 })).toBeInViewport({ ratio: 1 });
  const tabBarTop = await page.locator(".gn-tabbar").evaluate((n) => (getComputedStyle(n).position === "fixed" ? n.getBoundingClientRect().top : Infinity));
  for (const name of ["Quero adotar", "Quero doar"]) {
    const button = page.locator(".home-actions").getByRole("link", { name });
    await expect(button).toBeInViewport({ ratio: 1 });
    expect((await button.boundingBox())!.y + (await button.boundingBox())!.height).toBeLessThanOrEqual(tabBarTop);
  }
  // Phones show a big photo with a row of dots to tap (no arrows over the cats); wide screens show the arrows,
  // the caption and the play button. People who ask for reduced motion never get autoplay, but can still start it.
  const phone = page.viewportSize()!.width < 960;
  await expect(carousel.locator(".gn-carousel__count")).toHaveText("1 / 6");
  if (phone) {
    await expect(carousel.getByRole("button", { name: "Fotografia seguinte" })).toBeHidden();
    await carousel.getByRole("button", { name: "Fotografia 2 de 6" }).click();
    await expect(carousel.getByRole("button", { name: "Fotografia 2 de 6" })).toHaveAttribute("aria-current", "true");
    // Most of the screen width and a good part of its height: a photo, not a strip.
    expect(box!.height).toBeGreaterThan(page.viewportSize()!.height * 0.3);
  } else {
    await expect(carousel.getByRole("button", { name: "Fotografia 2 de 6" })).toBeHidden();
    await carousel.getByRole("button", { name: "Fotografia seguinte" }).click();
  }
  await expect(carousel.locator(".gn-carousel__count")).toHaveText("2 / 6");
  await expect(carousel.getByRole("button", { name: "Passar automaticamente" })).toBeVisible({ visible: !phone });
  await expect(carousel.locator(".gn-carousel__slide.is-active .gn-carousel__caption")).toBeVisible({ visible: !phone });
});

test.describe("contas e Patinhas", () => {
  for (const path of features.patinhas ? ["/patinhas", "/conta"] : ["/conta"]) {
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
    test.skip(!features.patinhas, "Patinhas desligadas");
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
    test.skip(!features.trocas, "Trocas desligadas");
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
    test.skip(!features.patinhas, "Patinhas desligadas");
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

  async function createAccount(page: Page, contact: string, name: string) {
    await page.goto("/conta");
    await page.getByLabel("Email ou telemóvel").fill(contact);
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByLabel("O seu nome").fill(name);
    await page.getByText("Aceito que a associação guarde").click();
    await page.getByRole("button", { name: "Enviar o código" }).click();
    const code = (await page.getByText(/Demonstração: o código é/).textContent())!.match(/\d{6}/)![0];
    await page.getByLabel("Código").fill(code);
    await page.getByRole("button", { name: "Criar a minha conta" }).click();
  }

  test("someone new finds the gatil card first, joins a shift and gets the cats and doses", async ({ page }) => {
    await createAccount(page, "915 000 003", "Rita Sousa");
    const card = page.getByRole("region", { name: "No gatil", exact: true });
    await expect(card).toBeInViewport();
    await card.getByRole("link", { name: "Abrir o meu turno no gatil" }).click();
    await expect(page).toHaveURL(/\/conta\/gatil/);
    await page.getByRole("button", { name: /Inscrever-me neste turno/ }).first().click();
    await expect(page.getByText("Está inscrito. Já pode ver os gatos e as doses desse turno.")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Medicação (durante o seu turno|no dia do seu turno)/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Como tratar de cada gato" })).toBeVisible();
  });

  test("in the demo, an email account can try the volunteer page as Ana", async ({ page }) => {
    await createAccount(page, "rita@exemplo.pt", "Rita Sousa");
    await page.getByRole("link", { name: "Abrir o meu turno no gatil" }).click();
    await expect(page.getByText(/entre com o seu telemóvel em vez do email/)).toBeVisible();
    await page.getByRole("button", { name: "Experimentar como a Ana (com turno hoje)" }).click();
    await expect(page.getByRole("heading", { name: "Medicação durante o seu turno" })).toBeVisible();
    await expect(page.locator(".gatil__dose", { hasText: "08:00" }).getByRole("button", { name: "Já dei" })).toBeVisible();
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

test("home: adopting and donating come first, and Patinhas (when on) are still explained further down", async ({ page }) => {
  await page.goto("/");
  // Order on the page: the cats waiting for a home, then how to donate, then the Patinhas.
  const selectors = [".cat-rail", ".donate-band", ...(features.patinhas ? [".patinhas-teaser"] : [])];
  const tops = await page.evaluate((list) => list.map((sel) => document.querySelector(sel)!.getBoundingClientRect().top), selectors);
  expect(tops).toEqual([...tops].sort((a, b) => a - b));
  const donate = page.getByRole("region", { name: "Não pode adotar? Pode doar." });
  await expect(donate.getByRole("link", { name: "Apadrinhar um gato" })).toHaveAttribute("href", "/apadrinhar");
  await page.getByRole("link", { name: "Outras formas de ajudar" }).click();
  await expect(page).toHaveURL(/\/ajudar\/?$/);
  if (!features.patinhas) return;
  await page.goto("/");
  const teaser = page.getByRole("complementary", { name: "Cada ajuda vale Patinhas" });
  await teaser.scrollIntoViewIfNeeded();
  await teaser.getByRole("link", { name: "Como funcionam as Patinhas" }).click();
  await expect(page).toHaveURL(/\/patinhas\/?$/);
});

test("donate: from the home page to the bank details, ready to copy", async ({ page }, info) => {
  await page.goto("/");
  await page.locator(".home-actions").getByRole("link", { name: "Quero doar" }).click();
  await expect(page).toHaveURL(/\/doar\/?$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Fazer um donativo");
  await expect(page.getByText("PT50 0045 1436 4033 0203 2321 6")).toBeVisible();
  await expect(page.getByRole("link", { name: "Apadrinhar um gato" })).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Menu principal" });
  if (phone(info)) await expect(nav.getByRole("link", { name: "Doar", exact: true })).toHaveAttribute("aria-current", "page");
  else await expect(nav.getByRole("button", { name: /^Doar/ })).toHaveClass(/gn-nav__link--here/);
});

test("menu links change page inside the app, without a reload or a loader flash", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.evaluate(() => { (window as unknown as { __same: boolean }).__same = true; });
  const steps: [string, RegExp, RegExp][] = [["Adotar", /^Gatos para adoção/, /\/adotar\/?$/], ["Doar", /^Fazer um donativo/, /\/doar\/?$/], ["Sobre nós", /^Quem somos/, /\/sobre\/?$/]];
  for (const [section, link, url] of steps) {
    await openFromMenu(page, phone(info), section, link);
    await expect(page).toHaveURL(url);
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.locator(".route-loading")).toHaveCount(0);
  }
  expect(await page.evaluate(() => (window as unknown as { __same?: boolean }).__same)).toBe(true);
  expect(errors).toEqual([]);
});

test("adotar: filter chips narrow the list, and the heart on a photo saves the cat", async ({ page }) => {
  await page.goto("/adotar");
  const list = page.locator(".cat-filter__list");
  await page.getByRole("button", { name: /^Séniores/ }).click();
  await expect(page.getByRole("button", { name: /^Séniores/ })).toHaveAttribute("aria-pressed", "true");
  await expect(list.getByRole("link", { name: "Tobias" })).toBeVisible();
  await expect(list.getByRole("link", { name: "Carvão" })).toBeHidden();
  await page.getByRole("button", { name: /^Todos/ }).click();
  await expect(list.getByRole("link", { name: "Carvão" })).toBeVisible();
  await list.getByRole("button", { name: "Guardar Tobias" }).click();
  await expect(list.getByRole("button", { name: "Tobias está nos favoritos" })).toHaveAttribute("aria-pressed", "true");
});

test("adotar: a cat's page shows all its photos, what it goes home with, and other cats, never a dead end", async ({ page }) => {
  await page.goto("/adotar/tobias");
  const gallery = page.getByRole("region", { name: "Fotografias do Tobias" });
  await expect(gallery.getByText("1 / 2")).toBeVisible();
  await gallery.getByRole("button", { name: "Fotografia seguinte" }).click();
  await expect(gallery.getByText("2 / 2")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Vai para casa com" })).toBeVisible();
  const others = page.getByRole("region", { name: "Também procuram família" }).or(page.locator("section", { has: page.getByRole("heading", { name: "Também procuram família" }) }));
  await expect(others.getByRole("heading", { level: 3 })).toHaveCount(3);
  await page.getByRole("link", { name: "Perguntas sobre adotar" }).click();
  await expect(page).toHaveURL(/\/adotar\/perguntas\/?$/);
  await page.getByText("Moro num apartamento. Posso adotar?").click();
  await expect(page.getByText(/redes nas janelas/)).toBeVisible();
  const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(jsonLd.join()).toContain('"FAQPage"');
});

test("adotar: 'Com crianças' shows only cats known to be good with children", async ({ page }) => {
  await page.goto("/adotar");
  const list = page.locator(".cat-filter__list");
  await page.getByRole("button", { name: /^Com crianças/ }).click();
  await expect(list.getByRole("link", { name: "Tobias" })).toBeVisible();
  await expect(list.getByRole("link", { name: "Carvão" })).toBeHidden();
});

test("home: the cats looking for a home are one swipe away, with a link to all of them", async ({ page }) => {
  await page.goto("/");
  const rail = page.getByRole("region", { name: "Procuram família" });
  await expect(rail.getByRole("heading", { level: 3 }).first()).toBeVisible();
  await rail.getByRole("link", { name: /^Ver os \d+$/ }).click();
  await expect(page).toHaveURL(/\/adotar\/?$/);
});

test("a cat's page: on phones 'Quero conhecer' stays on screen while reading", async ({ page }, info) => {
  test.skip(!info.project.name.startsWith("telemovel"), "phones only");
  await page.goto("/adotar/tobias");
  await page.getByRole("heading", { name: "Partilhar o Tobias" }).or(page.getByText("Partilhar o Tobias")).first().scrollIntoViewIfNeeded();
  await expect(page.getByRole("button", { name: "Quero conhecer o Tobias" })).toBeInViewport();
});

test("família temporária: from Ajudar to a sent request, with the cats that need one now", async ({ page }) => {
  await page.goto("/ajudar");
  await page.getByRole("link", { name: "Família temporária", exact: true }).click();
  await expect(page).toHaveURL(/\/ajudar\/familia-temporaria\/?$/);
  await expect(page.getByRole("heading", { name: /precisa(m)? de família temporária agora/ })).toBeVisible();
  await page.getByRole("button", { name: "Quero ser família temporária" }).first().click();
  await page.getByRole("button", { name: "Enviar pedido" }).click();
  await expect(page.getByText("Indique o seu nome")).toBeVisible();
  await page.getByLabel("O seu nome").fill("Joana Reis");
  await page.getByLabel("Telefone").fill("913 333 333");
  await page.getByLabel("Onde vive?").fill("Darque");
  await page.getByText("Gatinhos bebés").click();
  await page.getByLabel(/aceito que a associação me contacte/i).check();
  await page.getByRole("button", { name: "Enviar pedido" }).click();
  await expect(page.getByText("Obrigado! Vamos ligar-lhe.")).toBeVisible();
});

test("finais felizes: on the home page, on Adotar and in the menu", async ({ page }, info) => {
  await page.goto("/");
  const happy = page.getByRole("region", { name: "Finais felizes" });
  await expect(happy.getByText(/gatos? já encontr/)).toBeVisible();
  await expect(happy.getByRole("heading", { level: 3 }).first()).toBeVisible();
  await openFromMenu(page, phone(info), "Adotar", /^Finais felizes/);
  await expect(page).toHaveURL(/\/finais-felizes\/?$/);
  await page.goto("/adotar");
  await page.getByRole("link", { name: /já encontr.* família\. Ver os finais felizes/ }).click();
  await expect(page).toHaveURL(/\/finais-felizes\/?$/);
});

test("footer: social networks are logos with their names for screen readers", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await expect(footer.getByRole("link", { name: "Facebook" })).toBeVisible();
  await expect(footer.getByRole("link", { name: "Instagram" })).toBeVisible();
  await expect(footer.getByRole("link", { name: "TikTok" })).toBeVisible();
  await expect(footer.getByText("Facebook", { exact: true })).toHaveCount(0);
});

test("footer: shows where the gatil is and links to the privacy and cookie policies", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await expect(footer.getByText("Santa Marta de Portuzelo")).toBeVisible();
  await expect(footer.getByRole("link", { name: /Ver no mapa/ })).toHaveAttribute("href", /google\.com\/maps/);
  await footer.getByRole("link", { name: "Política de privacidade" }).click();
  await expect(page).toHaveURL(/\/privacidade\/?$/);
  await expect(page.getByRole("heading", { level: 1, name: "Política de privacidade" })).toBeVisible();
  await expect(page.getByText("Texto em revisão")).toBeVisible();
  await page.getByRole("contentinfo").getByRole("link", { name: "Política de cookies" }).click();
  await expect(page).toHaveURL(/\/cookies\/?$/);
  await expect(page.getByRole("cell", { name: "gn-sessao" })).toBeVisible();
});

test("contact: no email address anywhere, the footer leads to a form that sends the message", async ({ page }) => {
  // Pedro (2026-10-26): every contact goes through the form; only the shop conditions show an email, as the law asks.
  for (const path of ["/", "/sobre", "/privacidade", "/cookies", "/contactos"]) {
    await page.goto(path);
    await expect(page.locator('a[href^="mailto:"]:not([href^="mailto:?"])'), path).toHaveCount(0);
    expect(await page.locator("body").innerText(), path).not.toMatch(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
  }
  await page.goto("/");
  await page.getByRole("contentinfo").getByRole("link", { name: "Fale connosco" }).click();
  await expect(page).toHaveURL(/\/contactos\/?$/);
  await page.getByRole("button", { name: "Enviar mensagem" }).click();
  await expect(page.getByText("Falta corrigir alguns campos")).toBeVisible();
  await page.getByLabel("Assunto").selectOption("adocao");
  await page.getByLabel("O seu nome").fill("Ana Costa");
  await page.getByLabel("Email", { exact: true }).fill("ana@example.pt");
  await page.getByLabel("Mensagem").fill("Olá! Posso visitar o gatil no sábado?");
  await page.getByText("Aceito que a associação use estes dados para me responder").click();
  await page.getByRole("button", { name: "Enviar mensagem" }).click();
  await expect(page.getByText("Mensagem enviada. Obrigado!")).toBeVisible();
});

test("contact: the privacy page opens the form with the data topic chosen", async ({ page }) => {
  await page.goto("/privacidade");
  await page.getByRole("main").getByRole("link", { name: "formulário de contacto" }).first().click();
  await expect(page).toHaveURL(/\/contactos\/?\?assunto=dados$/);
  await expect(page.getByLabel("Assunto")).toHaveValue("dados");
});

test("shop: choose a size, put it in the basket, order and see how to pay", async ({ page }) => {
  await page.goto("/loja");
  await page.getByRole("link", { name: "T-shirt Gatos de Ninguém" }).click();
  await expect(page).toHaveURL(/\/loja\/t-shirt-gatos-de-ninguem$/);
  // Every article says how much of its price goes to the cats.
  await expect(page.getByText("9 € vão para os gatos", { exact: false })).toBeVisible();
  await page.getByText("M", { exact: true }).click();
  await page.getByRole("button", { name: "Mais um" }).click();
  await page.getByRole("button", { name: "Pôr no cesto" }).click();
  await page.getByRole("link", { name: "Ver o cesto e fazer o pedido" }).click();
  await expect(page).toHaveURL(/\/loja\/cesto$/);
  await expect(page.getByText(/Total\s*30\s€/)).toBeVisible();

  await page.getByRole("button", { name: "Fazer o pedido" }).click();
  const dialog = page.getByRole("dialog", { name: "Fazer o pedido" });
  await dialog.getByText("Receber pelo correio").click();
  // By post there is no "pay when you pick up".
  await expect(dialog.getByText("Pagar quando levantar")).toHaveCount(0);
  await dialog.getByRole("button", { name: "Encomendar com obrigação de pagar" }).click();
  await expect(dialog.getByText("Indique a morada completa, com código postal")).toBeVisible();
  await dialog.getByLabel("Morada completa, com código postal").fill("Rua das Flores 12, 4900-000 Viana do Castelo");
  await dialog.getByText("Transferência bancária").click();
  await dialog.getByLabel("O seu nome").fill("Maria Silva");
  await dialog.getByLabel("Telemóvel").fill("912345678");
  await dialog.getByText("Aceito que a associação me contacte").click();
  // The law asks for a button that says ordering means paying, and the 14 days to change one's mind.
  await expect(dialog.getByText("Pode desistir até 14 dias depois de receber os artigos.", { exact: false })).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Condições da loja" })).toHaveAttribute("href", "/loja/condicoes");
  await dialog.getByRole("button", { name: "Encomendar com obrigação de pagar" }).click();

  await expect(page.getByText("Obrigado! O seu pedido foi enviado.")).toBeVisible();
  await expect(page.getByText(/^L-[2-9A-Z]{4}$/).first()).toBeVisible();
  await expect(page.getByText("PT50 0045 1436 4033 0203 2321 6")).toBeVisible();
  // The basket is empty again.
  await page.goto("/loja/cesto");
  await expect(page.getByText("O cesto está vazio.")).toBeVisible();
});

test("shop: the conditions say who sells, how to give up in 14 days and where to complain", async ({ page }) => {
  await page.goto("/loja");
  await page.getByRole("main").getByRole("link", { name: "condições da loja" }).click();
  await expect(page).toHaveURL(/\/loja\/condicoes\/?$/);
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { name: "Pode desistir em 14 dias" })).toBeVisible();
  await expect(main.getByText(/NIF \d{9}/)).toBeVisible();
  await expect(main.getByRole("link", { name: "Livro de Reclamações Eletrónico" })).toHaveAttribute("href", "https://www.livroreclamacoes.pt");
  await expect(main.getByRole("link", { name: /CIAB/ })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Informação legal" }).getByRole("link", { name: "Condições da loja" })).toBeVisible();
});

test("shop: sold-out articles cannot be added, and the page shows where the money goes", async ({ page }) => {
  await page.goto("/loja/porta-chaves-gato");
  await expect(page.getByText("Este artigo esgotou.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pôr no cesto" })).toHaveCount(0);
  await page.goto("/loja");
  await expect(page.getByRole("heading", { name: "Para onde vai o dinheiro" })).toBeVisible();
  await expect(page.getByText("Vacinas da Estrela e do Tobias")).toBeVisible();
});

test("shop: offer articles to sell", async ({ page }) => {
  await page.goto("/loja");
  await page.getByRole("button", { name: "Doar artigos para a loja" }).click();
  const dialog = page.getByRole("dialog", { name: "Doar artigos para a loja" });
  await dialog.getByLabel("O que quer doar?").fill("Uma caixa de livros infantis");
  await dialog.getByText("Preciso que alguém vá buscar").click();
  await dialog.getByLabel("O seu nome").fill("Rosa Lima");
  await dialog.getByLabel("Telemóvel").fill("915000000");
  await dialog.getByLabel("Onde vive?").fill("Areosa");
  await dialog.getByText("Aceito que a associação me contacte").click();
  await dialog.getByRole("button", { name: "Enviar oferta" }).click();
  await expect(dialog.getByText("Obrigado pela sua oferta!")).toBeVisible();
  await expect(dialog.getByText(/quando podemos ir buscar/)).toBeVisible();
});

test.describe("gato novo para adoção", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  const newest = "Nova para adoção: Mia";

  test("a cat put up for adoption recently pops up once, with its photo and a link to its page", async ({ page }) => {
    await page.clock.install({ time: new Date("2026-10-10T12:00:00Z") });
    await page.goto("/");
    const dialog = page.getByRole("dialog", { name: newest });
    // The 5-second timer only starts once the page has hydrated, which on a slow CI runner can be after a single
    // runFor(5_000) has already gone by; keep the fake clock moving until the pop-up opens.
    await expect(async () => {
      await page.clock.runFor(1_000);
      await expect(dialog).toBeVisible({ timeout: 200 });
    }).toPass({ timeout: 20_000 });
    await expect(dialog.getByRole("img")).toBeVisible();
    await dialog.getByRole("link", { name: "Conhecer a Mia" }).click();
    await expect(page).toHaveURL(/\/adotar\/mia$/);
    await expect(dialog).toBeHidden();

    // Seen: not again on this visit or the next.
    await page.goto("/finais-felizes");
    await page.clock.runFor(10_000);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("never interrupts an emergency", async ({ page }) => {
    await page.clock.install({ time: new Date("2026-10-10T12:00:00Z") });
    await page.goto("/sos");
    await page.clock.runFor(10_000);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("?avisos=agora shows the newest cat at once, even when already seen, and can switch to email alerts", async ({ page }) => {
    await page.goto("/sobre");
    await page.evaluate(() => localStorage.setItem("gn-gatos-vistos", JSON.stringify(["*"])));
    await page.goto("/sobre?avisos=agora");
    const dialog = page.getByRole("dialog", { name: newest });
    await expect(dialog).toBeVisible();
    const card = await new AxeBuilder({ page }).include("dialog").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(card.violations.map((v) => v.id)).toEqual([]);
    await dialog.getByRole("button", { name: "Avisem-me por email quando chegarem outros" }).click();
    const email = page.getByRole("dialog", { name: "Quer saber quando chegam gatos novos?" });
    await expect(email.getByLabel("O seu email", { exact: true })).toBeVisible();
    const results = await new AxeBuilder({ page }).include("dialog").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });

  test("from Adotar: ask for alerts about kittens, with explicit consent", async ({ page }) => {
    await page.goto("/adotar");
    await page.getByRole("button", { name: "Avisem-me de gatos novos" }).click();
    const dialog = page.getByRole("dialog", { name: "Quer saber quando chegam gatos novos?" });
    await dialog.getByLabel("O seu email", { exact: true }).fill("ana@exemplo.pt");
    await dialog.getByText("Só alguns gatos?").click();
    await dialog.getByRole("button", { name: "Bebés" }).click();
    await expect(dialog.getByRole("button", { name: "Bebés" })).toHaveAttribute("aria-pressed", "true");
    await dialog.getByRole("button", { name: "Avisem-me" }).click();
    await expect(dialog.getByText("Precisa de aceitar para receber os avisos")).toBeVisible();
    await dialog.getByLabel("Aceito receber estes avisos por email").check();
    await dialog.getByRole("button", { name: "Avisem-me" }).click();
    await expect(dialog.getByText("Falta só confirmar")).toBeVisible();
  });
});

test.describe("switched off: Patinhas, swaps and Ser Amigo", () => {
  test.skip(features.patinhas || features.amigo, "Só quando estão desligadas");

  test("no Patinhas or Ser Amigo anywhere on the public pages", async ({ page, request }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByText("Cada ajuda vale Patinhas")).toHaveCount(0);
    expect(await (await request.get("/sitemap.xml")).text()).not.toContain("/patinhas");
    // Old links to the Patinhas page land on the ways to help.
    expect((await request.get("/patinhas", { maxRedirects: 0 })).status()).toBe(307);
    await page.goto("/patinhas");
    await expect(page).toHaveURL(/\/ajudar\/?$/);
    await expect(page.getByRole("link", { name: /Ser Amigo/ })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Ganhar Patinhas/ })).toHaveCount(0);
    expect((await request.get("/ajudar/amigo", { maxRedirects: 0 })).status()).toBe(307);
    await page.goto("/parceiros");
    await expect(page.getByText(/Patinhas|cartão de Amigo/)).toHaveCount(0);
    await page.goto("/doar");
    await expect(page.getByRole("link", { name: /Ser Amigo/ })).toHaveCount(0);
  });

  test("the help quiz never suggests Ser Amigo", async ({ page }) => {
    await page.goto("/ajudar");
    const quiz = page.locator("section", { hasText: "Não sabe por onde começar?" });
    await quiz.getByText("Algumas horas").click();
    await quiz.getByRole("button", { name: "Continuar" }).click();
    await quiz.getByText("Um pouco").click();
    await quiz.getByRole("button", { name: "Continuar" }).click();
    await quiz.getByText("Não", { exact: true }).click();
    await quiz.getByRole("button", { name: "Ver sugestão" }).click();
    await expect(quiz.getByText("A nossa sugestão: Fazer um turno no gatil")).toBeVisible();
    await expect(quiz.getByText(/Ser Amigo|Patinhas/)).toHaveCount(0);
  });

  test("an account still works, without points, levels or swaps", async ({ page }) => {
    await page.goto("/conta");
    await page.getByLabel("Email ou telemóvel").fill("rita@exemplo.pt");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByLabel("O seu nome").fill("Rita Sousa");
    await page.getByText("Aceito que a associação guarde o meu nome e contacto para a minha conta").click();
    await page.getByRole("button", { name: "Enviar o código" }).click();
    const code = (await page.getByText(/Demonstração: o código é/).textContent())!.match(/\d{6}/)![0];
    await page.getByLabel("Código").fill(code);
    await page.getByRole("button", { name: "Criar a minha conta" }).click();
    await expect(page.getByText("Bem-vindo, Rita!")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Olá, Rita!" })).toBeVisible();
    await expect(page.getByText(/Patinhas|Nível|Medalhas|Trocar/)).toHaveCount(0);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });
});

test("dates: cats show how long they have waited, news and happy endings show when", async ({ page }) => {
  await page.goto("/adotar");
  await expect(page.locator(".cat-card", { hasText: "Tobias" }).getByText(/^No gatil há \d+ anos?$/)).toBeVisible();
  await page.goto("/adotar/tobias");
  await expect(page.locator("dl.facts")).toContainText("No gatil desde");
  await expect(page.locator("dl.facts div", { hasText: "No gatil desde" }).locator("dd")).toHaveText(/^abril de 2023 \(há \d+ anos?\)$/);
  await expect(page.locator("dl.facts div", { hasText: "Para adoção desde" }).locator("dd")).toHaveText("2 de junho de 2023");
  await page.goto("/noticias");
  await expect(page.locator("time[datetime]").first()).toHaveText(/^\d{1,2} de [a-zç]+ de \d{4}$/);
  await expect(page.getByText(/^Quando: .*novembro/)).toBeVisible();
  await page.goto("/finais-felizes");
  await expect(page.getByText(/Adotada a 14 de setembro de 2026, depois de \d+ anos? no gatil/)).toBeVisible();
});

test.describe("Quem somos", () => {
  test("shows the team together in one group picture, as a family", async ({ page }) => {
    await page.goto("/sobre");
    const team = page.getByRole("region", { name: "Somos uma família" });
    await expect(team.getByRole("img", { name: /voluntários da associação/ })).toBeVisible();
    await expect(team.getByRole("link", { name: "Venha conhecer-nos" })).toHaveAttribute("href", /\/ajudar\/voluntariado/);
  });
});
