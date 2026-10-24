import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import axe from "axe-core";
import { Shell } from "../src/App";
import { fakeApi } from "./fakeApi";

const today = new Date("2026-11-02T09:00:00.000Z"); // a Monday, so the week view is 2–8 Nov

function renderAt(path: string, api = fakeApi(today)) {
  const utils = render(
    <MemoryRouter initialEntries={[path]}>
      <Shell api={api} today={today} />
    </MemoryRouter>,
  );
  return { ...utils, api };
}

async function axeViolations(container: Element) {
  const r = await axe.run(container, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
  return r.violations.map((v) => v.id);
}

describe("Hoje", () => {
  it("summarises what needs attention", async () => {
    const { container } = renderAt("/");
    expect(await screen.findByText("Maria Silva")).toBeInTheDocument();
    expect(await screen.findByText(/Levar a Pimenta à revisão/)).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("SEO", () => {
  it("lists pages with problems and opens the editor with a live Google preview", async () => {
    const user = userEvent.setup();
    const { api } = renderAt("/seo");
    expect(await screen.findByText(/erros e .* avisos/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Editar Adotar um gato" }));

    const title = screen.getByLabelText("Título no Google");
    await user.clear(title);
    await user.type(title, "Adotar gatos em Viana do Castelo");
    const preview = screen.getByRole("figure", { name: "Pré-visualização no Google" });
    expect(within(preview).getByText("Adotar gatos em Viana do Castelo")).toBeInTheDocument();
    expect(screen.getByText("32 de 60 caracteres")).toBeInTheDocument();

    await user.click(screen.getByLabelText(/Esconder esta página do Google/));
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    await screen.findByText("Guardado");
    expect(api.saveSeo).toHaveBeenCalledWith({ kind: "pagina", id: "page-adotar" }, expect.objectContaining({ title: "Adotar gatos em Viana do Castelo", noindex: true }));
  });

  it("refuses invalid JSON-LD with a clear message", async () => {
    const user = userEvent.setup();
    const { api } = renderAt("/seo");
    await user.click(await screen.findByRole("button", { name: "Editar Adotar um gato" }));
    await user.type(screen.getByLabelText(/JSON-LD/), "{{ não é json");
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    expect(screen.getByText(/não é JSON válido/)).toBeInTheDocument();
    expect(api.saveSeo).not.toHaveBeenCalled();
  });

  it("adds a redirect from an old address", async () => {
    const user = userEvent.setup();
    renderAt("/seo");
    await user.click(await screen.findByRole("tab", { name: "Redirecionamentos" }));
    await user.type(screen.getByLabelText("Endereço antigo"), "/gatos/resgates");
    await user.type(screen.getByLabelText("Novo endereço"), "/finais-felizes");
    await user.click(screen.getByRole("button", { name: "Adicionar redirecionamento" }));
    expect(await screen.findByRole("cell", { name: "/gatos/resgates" })).toBeInTheDocument();
  });
});

describe("Escalas", () => {
  it("shows the week with free places, signs up a volunteer and marks presence", async () => {
    const user = userEvent.setup();
    const { container } = renderAt("/escalas");
    const shift = await screen.findByRole("article", { name: /Levar a Pimenta à revisão/ });
    expect(within(shift).getByText("1 vaga")).toBeInTheDocument();
    await user.click(within(shift).getByRole("button", { name: "Inscrever voluntário" }));
    await user.type(within(shift).getByLabelText("Nome"), "Luís Costa");
    await user.type(within(shift).getByLabelText("Telefone"), "933333333");
    await user.click(within(shift).getByRole("button", { name: "Inscrever" }));
    const updated = await screen.findByRole("article", { name: /Levar a Pimenta à revisão/ });
    await waitFor(() => expect(within(updated).getByText("Completo")).toBeInTheDocument());
    await user.click(within(updated).getByRole("button", { name: "Marcar presença de Luís Costa" }));
    expect(await within(await screen.findByRole("article", { name: /Levar a Pimenta/ })).findByText("Esteve presente")).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  });

  it("creates a weekly cleaning series", async () => {
    const user = userEvent.setup();
    renderAt("/escalas");
    await user.click(await screen.findByRole("tab", { name: "Criar turnos" }));
    await user.click(screen.getByText("Turnos que se repetem todas as semanas"));
    await user.type(screen.getByLabelText("Nome da tarefa"), "Limpeza de quarta");
    await user.click(screen.getByLabelText("Quarta"));
    await user.click(screen.getByLabelText("Sábado"));
    await user.type(screen.getByLabelText("A partir de"), "2026-11-02");
    await user.type(screen.getByLabelText(/^Até/), "2026-11-30");
    await user.click(screen.getByRole("button", { name: "Criar série de turnos" }));
    expect(await screen.findAllByText("Limpeza de quarta")).not.toHaveLength(0);
  });

  it("flags godparents waiting for news", async () => {
    const user = userEvent.setup();
    renderAt("/escalas");
    await user.click(await screen.findByRole("tab", { name: "Padrinhos" }));
    expect(await screen.findByText(/1 padrinho espera notícias/)).toBeInTheDocument();
  });

  it("lists people who asked to be a foster family, and the team marks the call", async () => {
    const user = userEvent.setup();
    const { api } = renderAt("/escalas");
    await user.click(await screen.findByRole("tab", { name: "Famílias temporárias" }));
    expect(await screen.findByText("1 pessoa quer ser família temporária")).toBeInTheDocument();
    expect(screen.getByText(/gatinhos bebés, durante um ou dois meses/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Já liguei a Sofia Martins" }));
    await waitFor(async () => expect((await api.fosterApplications())[0]!.status).toBe("contactada"));
    expect(await screen.findByText("Contactada")).toBeInTheDocument();
  });
});

describe("Gatos", () => {
  it("adds a cat and derives its web address from the name", async () => {
    const user = userEvent.setup();
    renderAt("/gatos");
    await user.click(await screen.findByRole("button", { name: "Adicionar gato" }));
    await user.type(screen.getByLabelText("Nome"), "Estrela da Meadela");
    expect(screen.getByText("Endereço: /adotar/estrela-da-meadela")).toBeInTheDocument();
  });

  it("uploads a new photo, makes it the main one and removes the old one", async () => {
    const user = userEvent.setup();
    const { api, container } = renderAt("/gatos");
    await user.click(await screen.findByRole("button", { name: "Editar Carvão" }));
    const photo = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], "carvao.jpg", { type: "image/jpeg" });
    await user.upload(screen.getByLabelText("Escolher fotografias para adicionar"), photo);

    const second = await screen.findByRole("listitem", { name: "Fotografia 2" });
    expect(within(second).getByLabelText("Descrição da fotografia 2")).toHaveValue("Carvão, foto 2");
    expect(api.uploadPhoto).toHaveBeenCalledWith({ type: "image/jpeg", data: "/9j/4A==" });

    await user.click(within(second).getByRole("button", { name: /Tornar principal/ }));
    const first = screen.getByRole("listitem", { name: "Fotografia 1" });
    expect(within(first).getByText("Foto principal")).toBeInTheDocument();
    await user.click(within(screen.getByRole("listitem", { name: "Fotografia 2" })).getByRole("button", { name: /Apagar/ }));
    expect(screen.queryByRole("listitem", { name: "Fotografia 2" })).not.toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);

    await user.click(screen.getByRole("button", { name: "Guardar gato" }));
    await screen.findByRole("button", { name: "Adicionar gato" });
    const carvao = (await api.cats()).find((c) => c.name === "Carvão")!;
    expect(carvao.photos).toEqual([{ url: "/demo/novo-1.jpg", alt: "Carvão, foto 2" }]);
  });

  it("does not save a cat without photos", async () => {
    const user = userEvent.setup();
    renderAt("/gatos");
    await user.click(await screen.findByRole("button", { name: "Editar Carvão" }));
    for (const b of screen.getAllByRole("button", { name: /Apagar/ })) await user.click(b);
    await user.click(screen.getByRole("button", { name: "Guardar gato" }));
    expect(await screen.findByText("Adicione pelo menos uma fotografia.")).toBeInTheDocument();
  });
});

describe("Fotos do gatil", () => {
  it("hides a photo, changes the speed and saves the carousel", async () => {
    const user = userEvent.setup();
    const { api, container } = renderAt("/fotos");
    expect(await screen.findByText(/6 de 6 visíveis/)).toBeInTheDocument();
    await user.click(screen.getByLabelText("Mostrar no site (fotografia 3)"));
    expect(screen.getByText(/5 de 6 visíveis/)).toBeInTheDocument();
    const seconds = screen.getByLabelText("Segundos em cada fotografia");
    await user.clear(seconds);
    await user.type(seconds, "8");
    expect(await axeViolations(container)).toEqual([]);
    await user.click(screen.getByRole("button", { name: "Guardar fotos" }));
    expect(await screen.findByText("Guardado")).toBeInTheDocument();
    const home = (await api.pages()).find((p) => p.path === "/")!;
    expect(home.carousel).toEqual({ autoplay: true, intervalSeconds: 8 });
    expect(home.gallery.map((p) => !!p.hidden)).toEqual([false, false, true, false, false, false]);
  });
});

describe("Promoção de eventos", () => {
  it("asks for a JPG photo for Instagram, then approves the Open Day promotion", async () => {
    const user = userEvent.setup();
    const { api, container } = renderAt("/promocao");
    expect(await screen.findByText("Por ligar: Facebook")).toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: /Rever e aprovar Open Day/ }));
    expect((screen.getByLabelText(/Texto das publicações/) as HTMLTextAreaElement).value).toContain("📍 Gatil, Santa Marta de Portuzelo");
    expect(screen.getByText("Antes de aprovar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Aprovar/ })).toBeDisabled();

    await user.upload(container.querySelector<HTMLInputElement>('input[type="file"]')!, new File(["x"], "open-day.jpg", { type: "image/jpeg" }));
    await waitFor(() => expect(screen.queryByText("Antes de aprovar")).not.toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Aprovar: sai domingo, 8 de novembro" }));
    await waitFor(() => expect(api.promotionAction).toHaveBeenCalledWith("promo-post-2", "aprovar"));
    expect(api.editPromotion).toHaveBeenCalledWith("promo-post-2", expect.objectContaining({ imageUrl: expect.stringMatching(/\.jpg$/), scheduledFor: "2026-11-08T10:00:00.000Z" }));
    expect(await screen.findByText("Agendada")).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  });

  it("asks for the day and place when a news post is an event", async () => {
    const user = userEvent.setup();
    const { api } = renderAt("/noticias");
    await user.click(await screen.findByRole("button", { name: "Escrever notícia" }));
    await user.type(screen.getByLabelText("Título"), "Magusto solidário no gatil");
    await user.click(screen.getByLabelText("Evento"));
    await user.type(screen.getByLabelText("Resumo"), "Castanhas e a Loja Solidária aberta.");
    await user.type(screen.getByLabelText(/^Texto/), "Venha passar a tarde connosco.");
    expect(screen.getByRole("button", { name: "Publicar" })).toBeDisabled();
    await user.type(screen.getByLabelText("Dia"), "2026-11-11");
    await user.type(screen.getByLabelText("Começa às"), "15:00");
    const create = vi.spyOn(api, "createPost");
    await user.click(screen.getByRole("button", { name: "Publicar" }));
    await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({ category: "evento", event: { startsAt: "2026-11-11T15:00:00.000Z", endsAt: undefined, location: "Gatil, Santa Marta de Portuzelo" } })));
  });
});
