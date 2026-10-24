import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const pages = ["/", "/adotar", "/adotar/tobias", "/adotar/descobrir", "/ajudar", "/sos", "/noticias", "/finais-felizes", "/parceiros", "/sobre", "/ajudar/turnos", "/apadrinhar", "/apadrinhar/tobias", "/ajudar/familia-temporaria", "/loja", "/loja/t-shirt-gatos-de-ninguem", "/loja/cesto"];

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

  // From Ajudar, the sponsoring section lists cats to sponsor and each one opens its own form.
  await page.goto("/ajudar");
  await page.getByRole("link", { name: "Escolher um gato para apadrinhar" }).click();
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

test("home: opens on the shelter's real photos, with the welcome and main buttons in the first screen", async ({ page }) => {
  await page.goto("/");
  const carousel = page.getByRole("region", { name: "Fotografias do gatil" });
  await expect(carousel).toBeVisible();
  const box = await carousel.boundingBox();
  // Full width on wide screens; on phones a rounded picture inset a little from the edges.
  expect(box!.width).toBeGreaterThanOrEqual(page.viewportSize()!.width - (page.viewportSize()!.width < 960 ? 32 : 1));
  expect(box!.y).toBeLessThan(120); // right under the header: the photos are the top of the page
  await expect(carousel.locator("img").first()).toHaveAttribute("src", /\/fotos\/.+\.webp$/);
  // Nothing to scroll for: the title and the two main buttons are on screen, clear of the phone tab bar.
  await expect(page.getByRole("heading", { level: 1 })).toBeInViewport({ ratio: 1 });
  const tabBarTop = await page.locator(".gn-nav").evaluate((n) => (getComputedStyle(n).position === "fixed" ? n.getBoundingClientRect().top : Infinity));
  for (const name of ["Quero adotar", "Quero ajudar"]) {
    const button = page.locator(".home-actions").getByRole("link", { name });
    await expect(button).toBeInViewport({ ratio: 1 });
    expect((await button.boundingBox())!.y + (await button.boundingBox())!.height).toBeLessThanOrEqual(tabBarTop);
  }
  await expect(carousel.locator(".gn-carousel__count")).toHaveText("1 / 6");
  await carousel.getByRole("button", { name: "Fotografia seguinte" }).click();
  await expect(carousel.locator(".gn-carousel__count")).toHaveText("2 / 6");
  // Phones show only the photo and two arrows; wide screens add the caption and the play button.
  // People who ask for reduced motion never get autoplay, but can still start it.
  const phone = page.viewportSize()!.width < 960;
  await expect(carousel.getByRole("button", { name: "Passar automaticamente" })).toBeVisible({ visible: !phone });
  await expect(carousel.locator(".gn-carousel__slide.is-active .gn-carousel__caption")).toBeVisible({ visible: !phone });
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

test("home: Patinhas are explained above the fold, with a link to how they work", async ({ page }) => {
  await page.goto("/");
  const teaser = page.getByRole("complementary", { name: "Cada ajuda vale Patinhas" });
  // Whole card in the first screen, clear of the phone tab bar.
  await expect(teaser).toBeInViewport({ ratio: 1 });
  const tabBarTop = await page.locator(".gn-nav").evaluate((n) => (getComputedStyle(n).position === "fixed" ? n.getBoundingClientRect().top : Infinity));
  const box = (await teaser.boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(tabBarTop);
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
  await page.locator("#familia-temporaria").getByRole("link", { name: "Quero ser família temporária" }).click();
  await expect(page).toHaveURL(/\/ajudar\/familia-temporaria\/?$/);
  await expect(page.getByRole("heading", { name: /precisa(m)? de família temporária agora/ })).toBeVisible();
  await page.getByRole("button", { name: "Quero ser família temporária" }).first().click();
  await page.getByRole("button", { name: "Enviar pedido" }).click();
  await expect(page.getByText("Indique o seu nome")).toBeVisible();
  await page.getByLabel("O seu nome").fill("Joana Reis");
  await page.getByLabel("Telefone").fill("913 333 333");
  await page.getByLabel("Onde vive?").fill("Darque");
  await page.getByText("Gatinhos bebés").click();
  await page.getByLabel(/Aceito que a associação me contacte/).check();
  await page.getByRole("button", { name: "Enviar pedido" }).click();
  await expect(page.getByText("Obrigado! Vamos ligar-lhe.")).toBeVisible();
});

test("finais felizes: on the home page, on Adotar and, on wide screens, in the menu", async ({ page }, info) => {
  await page.goto("/");
  const happy = page.getByRole("region", { name: "Finais felizes" });
  await expect(happy.getByText(/gatos? já encontr/)).toBeVisible();
  await expect(happy.getByRole("heading", { level: 3 }).first()).toBeVisible();
  const menuLink = page.getByRole("navigation", { name: /principal|menu/i }).getByRole("link", { name: "Finais felizes" });
  if (info.project.name.startsWith("telemovel")) await expect(menuLink).toBeHidden();
  else await expect(menuLink).toBeVisible();
  await page.goto("/adotar");
  await page.getByRole("link", { name: /já encontr.* família\. Ver os finais felizes/ }).click();
  await expect(page).toHaveURL(/\/finais-felizes\/?$/);
});

test("footer: social networks are logos with their names for screen readers", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await expect(footer.getByRole("link", { name: "Facebook" })).toBeVisible();
  await expect(footer.getByRole("link", { name: "Instagram" })).toBeVisible();
  await expect(footer.getByText("Facebook", { exact: true })).toHaveCount(0);
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
  await dialog.getByRole("button", { name: "Enviar pedido" }).click();
  await expect(dialog.getByText("Indique a morada completa, com código postal")).toBeVisible();
  await dialog.getByLabel("Morada completa, com código postal").fill("Rua das Flores 12, 4900-000 Viana do Castelo");
  await dialog.getByText("Transferência bancária").click();
  await dialog.getByLabel("O seu nome").fill("Maria Silva");
  await dialog.getByLabel("Telemóvel").fill("912345678");
  await dialog.getByText("Aceito que a associação me contacte").click();
  await dialog.getByRole("button", { name: "Enviar pedido" }).click();

  await expect(page.getByText("Obrigado! O seu pedido foi enviado.")).toBeVisible();
  await expect(page.getByText(/^L-[2-9A-Z]{4}$/).first()).toBeVisible();
  await expect(page.getByText("PT50 0045 1436 4033 0203 2321 6")).toBeVisible();
  // The basket is empty again.
  await page.goto("/loja/cesto");
  await expect(page.getByText("O cesto está vazio.")).toBeVisible();
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
