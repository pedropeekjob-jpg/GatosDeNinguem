import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../test/axe";
import {
  AnimatedLogo,
  Badge,
  Breadcrumbs,
  Button,
  Card,
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

  it("can show the menu as a phone tab bar with icons, keeping the words as link names", () => {
    const { container } = render(
      <SiteHeader brand={<span>Marca</span>} homeHref="/" currentPath="/" tabBar
        items={[{ href: "/", label: "Início", icon: <svg /> }, { href: "/sobre", label: "Sobre nós", icon: <svg /> }]} />,
    );
    expect(container.querySelector("header")).toHaveClass("gn-header--tabbar");
    expect(screen.getByRole("navigation", { name: "Menu principal" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sobre nós" })).toBeInTheDocument();
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

  it("stays still for people who ask for less motion", () => {
    const original = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
    render(<AnimatedLogo />);
    expect(screen.getByRole("img", { name: "Gatos de Ninguém" })).not.toHaveAttribute("data-armed");
    window.matchMedia = original;
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
