import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
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
});

describe("Gatos", () => {
  it("adds a cat and derives its web address from the name", async () => {
    const user = userEvent.setup();
    renderAt("/gatos");
    await user.click(await screen.findByRole("button", { name: "Adicionar gato" }));
    await user.type(screen.getByLabelText("Nome"), "Estrela da Meadela");
    expect(screen.getByText("Endereço: /adotar/estrela-da-meadela")).toBeInTheDocument();
  });
});
