import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { animatedLogoSvg } from "./components/logoRig";
import { axeViolations } from "../test/axe";
import {
  AnimatedLogo,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  Carousel,
  ChoiceList,
  Notice,
  ProgressMeter,
  SearchPreview,
  SiteHeader,
  StepWizard,
  TextField,
} from "./index";

describe("Button", () => {
  it("renders a real button by default and a link when given href", () => {
    render(
      <>
        <Button onClick={() => {}}>Doar</Button>
        <Button href="/adotar">Adotar</Button>
      </>,
    );
    expect(screen.getByRole("button", { name: "Doar" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Adotar" })).toHaveAttribute("href", "/adotar");
  });

  it("hides decorative icons from screen readers", () => {
    render(<Button icon={<svg data-testid="i" />}>Doar</Button>);
    expect(screen.getByTestId("i").parentElement).toHaveAttribute("aria-hidden", "true");
  });
});

describe("Card", () => {
  it("shows any content without knowing what it is", async () => {
    const { container } = render(
      <Card
        media={{ src: "/x.svg", alt: "Foto de exemplo" }}
        eyebrow="Exemplo"
        title="Título qualquer"
        href="/algum-sitio"
        meta={[{ label: "Idade", value: "3 anos" }]}
        badges={<Badge tone="info">Novo</Badge>}
      >
        Texto livre
      </Card>,
    );
    expect(screen.getByRole("link", { name: "Título qualquer" })).toHaveAttribute("href", "/algum-sitio");
    expect(screen.getByRole("img", { name: "Foto de exemplo" })).toBeInTheDocument();
    expect(screen.getByText("Idade")).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("ChoiceList", () => {
  it("is a labelled radio group operable by click and keyboard", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <ChoiceList
        name="tempo"
        legend="Quanto tempo tem por mês?"
        options={[
          { value: "pouco", label: "Quase nenhum", hint: "Pode partilhar ou doar" },
          { value: "algum", label: "Umas horas" },
        ]}
        value="pouco"
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("group", { name: "Quanto tempo tem por mês?" })).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText(/Umas horas/));
    expect(onChange).toHaveBeenCalledWith("algum");
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("StepWizard", () => {
  it("tells the user where they are and offers big back/next buttons", async () => {
    const onBack = vi.fn();
    const onNext = vi.fn();
    render(
      <StepWizard step={2} total={4} title="Pergunta" onBack={onBack} onNext={onNext} nextLabel="Continuar">
        conteúdo
      </StepWizard>,
    );
    expect(screen.getByText("Passo 2 de 4")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Voltar" }));
    await userEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(onBack).toHaveBeenCalled();
    expect(onNext).toHaveBeenCalled();
  });

  it("hides Voltar on the first step and can disable Continuar", () => {
    render(<StepWizard step={1} total={3} title="t" onNext={() => {}} nextDisabled>c</StepWizard>);
    expect(screen.queryByRole("button", { name: "Voltar" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
  });
});

describe("TextField", () => {
  it("links label, hint and error, and counts characters against a recommendation", async () => {
    const { container } = render(
      <TextField id="t" label="Título" hint="Aparece no Google" error="Demasiado longo" value="abc" onChange={() => {}} recommended={{ min: 2, max: 60 }} />,
    );
    const input = screen.getByLabelText("Título");
    expect(input).toHaveAccessibleDescription(/Aparece no Google/);
    expect(input).toHaveAccessibleDescription(/Demasiado longo/);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("3 de 60 caracteres")).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("SiteHeader", () => {
  it("marks the current page and always shows the urgent action", () => {
    render(
      <SiteHeader
        brand={<span>Marca</span>}
        homeHref="/"
        items={[
          { href: "/adotar", label: "Adotar" },
          { href: "/ajudar", label: "Ajudar" },
        ]}
        currentPath="/adotar/mia"
        urgent={{ href: "/sos", label: "Encontrei um gato" }}
      />,
    );
    expect(screen.getByRole("link", { name: "Adotar" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Ajudar" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Encontrei um gato" })).toBeInTheDocument();
  });

  const sections = [
    { href: "/adotar", label: "Adotar", children: [
      { href: "/adotar", label: "Gatos para adoção", description: "Os gatos que procuram casa" },
      { href: "/finais-felizes", label: "Finais felizes" },
    ] },
    { href: "/sobre", label: "Sobre nós", children: [{ href: "/sobre", label: "Quem somos" }, { href: "/noticias", label: "Notícias" }] },
  ];

  it("opens a section's pages on click, closes them with Esc and gives focus back", async () => {
    const user = userEvent.setup();
    const { container } = render(<SiteHeader brand={<span>Marca</span>} homeHref="/" currentPath="/noticias" items={sections} />);
    const button = screen.getByRole("button", { name: /^Sobre nós/ });
    expect(button).toHaveAttribute("aria-expanded", "false");
    // The links are in the page even while closed (search engines), only hidden.
    expect(container.querySelector('a[href="/finais-felizes"]')).not.toBeNull();
    expect(screen.queryByRole("link", { name: /Quem somos/ })).toBeNull();
    // The section with the current page says so, and its link is marked as the current page.
    expect(button).toHaveClass("gn-nav__link--here");
    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /Notícias/ })).toHaveAttribute("aria-current", "page");
    await user.click(screen.getByRole("button", { name: /^Adotar/ }));
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("link", { name: /Gatos para adoção/ })).toHaveTextContent("Os gatos que procuram casa");
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: /^Adotar/ })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: /^Adotar/ })).toHaveFocus();
    expect(await axeViolations(container)).toEqual([]);
  });

  it("works from the keyboard and closes on a click elsewhere", async () => {
    const user = userEvent.setup();
    render(<><SiteHeader brand={<span>Marca</span>} homeHref="/" currentPath="/" items={sections} /><p>Fora</p></>);
    screen.getByRole("button", { name: /^Adotar/ }).focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: /^Adotar/ })).toHaveAttribute("aria-expanded", "true");
    await user.tab();
    expect(screen.getByRole("link", { name: /Gatos para adoção/ })).toHaveFocus();
    await user.click(screen.getByText("Fora"));
    expect(screen.getByRole("button", { name: /^Adotar/ })).toHaveAttribute("aria-expanded", "false");
  });

  it("on phones, keeps a few tabs and puts every page under Mais", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SiteHeader brand={<span>Marca</span>} homeHref="/" currentPath="/noticias" items={sections}
        tabs={[{ href: "/", label: "Início", icon: <svg /> }, { href: "/adotar", label: "Adotar", icon: <svg /> }]} />,
    );
    expect(container.querySelector("header")).toHaveClass("gn-header--tabbar");
    const tabBar = container.querySelector(".gn-tabbar") as HTMLElement;
    expect(tabBar.querySelectorAll("li")).toHaveLength(3);
    const more = screen.getByRole("button", { name: "Mais" });
    // On a page that has no tab of its own, "Mais" is the one lit.
    expect(more).toHaveClass("gn-nav__link--here");
    await user.click(more);
    const menu = screen.getByRole("dialog", { name: "Menu" });
    expect(menu).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sobre nós" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Notícias/ }).some((a) => a.getAttribute("aria-current") === "page")).toBe(true);
    await user.click(screen.getByRole("button", { name: /Fechar/ }));
    expect(screen.getByRole("button", { name: "Mais" })).toHaveAttribute("aria-expanded", "false");
  });
});

describe("AnimatedLogo", () => {
  it("is announced as the logo and waits on its first frame until it is on screen", () => {
    let onSeen: (entries: { isIntersecting: boolean }[]) => void = () => {};
    vi.stubGlobal("IntersectionObserver", class {
      constructor(cb: typeof onSeen) { onSeen = cb; }
      observe() {}
      disconnect() {}
    });
    render(<AnimatedLogo />);
    const logo = screen.getByRole("img", { name: "Gatos de Ninguém" });
    expect(logo).toHaveAttribute("data-armed");
    expect(logo).not.toHaveAttribute("data-play");
    onSeen([{ isIntersecting: true }]);
    expect(logo).toHaveAttribute("data-play");
    vi.unstubAllGlobals();
  });

  it("as a loader, tells screen readers that something is loading", () => {
    render(<AnimatedLogo variant="loader" />);
    expect(screen.getByRole("status")).toHaveTextContent("A carregar…");
  });

  it("keeps clip-path ids unique when the logo appears twice", () => {
    const { container } = render(<><AnimatedLogo /><AnimatedLogo variant="loader" /></>);
    const ids = [...container.querySelectorAll("clipPath")].map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("stands still for people who ask for less motion", () => {
    expect(animatedLogoSvg({ variant: "intro" })).toContain("@media (prefers-reduced-motion:reduce)");
  });

  it("matches the published standalone files (run pnpm --filter @gn/ui logo:svg after changing it)", () => {
    const file = (name: string) => readFileSync(resolve(process.cwd(), "../../apps/web/public", name), "utf8");
    expect(file("logo-animado.svg")).toBe(animatedLogoSvg({ variant: "intro", label: "Gatos de Ninguém" }) + "\n");
    expect(file("logo-a-carregar.svg")).toBe(animatedLogoSvg({ variant: "loader", label: "A carregar…" }) + "\n");
  });
});

describe("Breadcrumbs", () => {
  it("renders a labelled trail with the last item as current", () => {
    render(<Breadcrumbs items={[{ href: "/", label: "Início" }, { href: "/adotar", label: "Adotar" }, { label: "Mia" }]} />);
    expect(screen.getByRole("navigation", { name: "Está aqui" })).toBeInTheDocument();
    expect(screen.getByText("Mia")).toHaveAttribute("aria-current", "page");
  });
});

describe("misc", () => {
  it("ProgressMeter exposes value to assistive tech", () => {
    render(<ProgressMeter label="Esterilizações" value={18} max={30} />);
    expect(screen.getByRole("progressbar", { name: "Esterilizações" })).toHaveAttribute("aria-valuenow", "18");
  });

  it("Notice uses status role for info and alert for errors", () => {
    render(
      <>
        <Notice tone="info" title="Nota">a</Notice>
        <Notice tone="error" title="Erro">b</Notice>
      </>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Nota");
    expect(screen.getByRole("alert")).toHaveTextContent("Erro");
  });

  it("SearchPreview truncates like a search result", () => {
    render(<SearchPreview title={"T".repeat(80)} url="https://gatosdeninguem.pt/adotar" description={"D".repeat(200)} />);
    expect(screen.getByText(/^T+…$/).textContent!.length).toBeLessThanOrEqual(61);
    expect(screen.getByText(/^D+…$/).textContent!.length).toBeLessThanOrEqual(161);
  });
});

describe("Carousel", () => {
  const slides = [
    { src: "/a.jpg", alt: "Sala do gatil", caption: "A sala" },
    { src: "/b.jpg", alt: "Hora da refeição" },
    { src: "/c.jpg", alt: "Janela ao sol" },
  ];

  it("moves between photos with the buttons and wraps around", async () => {
    const user = userEvent.setup();
    const { container } = render(<Carousel slides={slides} label="Fotografias do gatil" />);
    expect(screen.getByRole("region", { name: "Fotografias do gatil" })).toBeInTheDocument();
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Fotografia anterior" }));
    expect(screen.getByText("3 / 3")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Fotografia seguinte" }));
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /automátic/ })).not.toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  });

  it("offers a pause button when it plays by itself", async () => {
    const user = userEvent.setup();
    render(<Carousel slides={slides} label="Fotografias do gatil" autoplay intervalSeconds={4} />);
    await user.click(await screen.findByRole("button", { name: "Parar a passagem automática" }));
    expect(screen.getByRole("button", { name: "Passar automaticamente" })).toBeInTheDocument();
  });

  it("never plays by itself when the device asks for reduced motion", () => {
    const original = window.matchMedia;
    window.matchMedia = ((q: string) => ({ matches: q.includes("reduce"), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
    render(<Carousel slides={slides} label="Fotografias do gatil" autoplay />);
    expect(screen.getByRole("button", { name: "Passar automaticamente" })).toBeInTheDocument();
    window.matchMedia = original;
  });

  it("renders nothing without photos", () => {
    const { container } = render(<Carousel slides={[]} label="Fotografias do gatil" />);
    expect(container).toBeEmptyDOMElement();
  });
});
