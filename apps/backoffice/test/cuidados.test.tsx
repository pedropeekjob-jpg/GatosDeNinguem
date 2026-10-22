import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import axe from "axe-core";
import { Shell } from "../src/App";
import { fakeApi } from "./fakeApi";

// Monday 2 November 2026, 09:30 in Lisbon.
const today = new Date("2026-11-02T09:30:00.000Z");

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

beforeEach(() => localStorage.clear());

describe("Cuidados: medicação de hoje", () => {
  it("lists doses by time with where each cat is, and records who gave them", async () => {
    const user = userEvent.setup();
    const { container, api } = renderAt("/cuidados");
    const insulin = await screen.findByRole("article", { name: "Estrela, Insulina às 08:00" });
    expect(within(insulin).getByText("Contentor Carlota, jaula 1")).toBeInTheDocument();
    expect(within(insulin).getByText("Por dar")).toBeInTheDocument();
    expect(screen.getByText("2 doses ainda não foram dadas")).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Pimenta, Meloxicam às 20:00" })).toBeInTheDocument();

    // A name is needed before anything is recorded.
    expect(within(insulin).getByRole("button", { name: "Já dei Insulina a Estrela" })).toBeDisabled();
    await user.type(screen.getByLabelText("O seu nome"), "Ana Ribeiro");
    await user.click(within(insulin).getByRole("button", { name: "Já dei Insulina a Estrela" }));
    expect(api.giveDose).toHaveBeenCalledWith("med-1", { date: "2026-11-02", time: "08:00" }, { name: "Ana Ribeiro" });
    const done = await screen.findByRole("article", { name: "Estrela, Insulina às 08:00" });
    await waitFor(() => expect(within(done).getByText("Dada")).toBeInTheDocument());
    expect(within(done).getByText("Ana Ribeiro")).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("Cuidados: onde estão", () => {
  it("shows each space with loose and caged cats", async () => {
    const user = userEvent.setup();
    const { container } = renderAt("/cuidados?ver=gatil");
    const carlota = await screen.findByRole("region", { name: "Contentor Carlota" });
    expect(within(carlota).getByText("Em jaula (1)")).toBeInTheDocument();
    expect(within(carlota).getByText(/Jaula 1 · Controlo da diabetes/)).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Colónia" })).getByText("Mia")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Fora do gatil" })).getByText("Pimenta")).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
    await user.click(within(screen.getByRole("region", { name: "Contentor Caramelo" })).getByRole("link", { name: "Abrir ficha de Carvão" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Carvão" })).toBeInTheDocument();
  });
});

describe("Ficha de cuidados", () => {
  it("moves a cat into a cage and everyone sees the alert", async () => {
    const user = userEvent.setup();
    const { container, api } = renderAt("/cuidados/cat-3");
    await user.click(await screen.findByRole("button", { name: "Mudar de sítio" }));
    await user.click(screen.getByLabelText("Em jaula", { exact: false }));
    await user.type(screen.getByLabelText("Número da jaula"), "2");
    await user.type(screen.getByLabelText(/Motivo/), "Começou antibiótico");
    await user.type(screen.getByLabelText("O seu nome"), "Rui Sousa");
    await user.click(screen.getByRole("button", { name: "Guardar e avisar a equipa" }));
    expect(api.moveCat).toHaveBeenCalledWith("cat-3", { area: "caramelo", spot: "jaula", cage: "2", reason: "Começou antibiótico" }, { name: "Rui Sousa" });
    expect(await screen.findByText(/Carvão mudou de Contentor Caramelo, solto para Contentor Caramelo, jaula 2/)).toBeInTheDocument();
    expect(screen.getAllByText("Contentor Caramelo, jaula 2").length).toBeGreaterThan(0);
    expect(await axeViolations(container)).toEqual([]);
  });

  it("adds medication with two daily times", async () => {
    const user = userEvent.setup();
    localStorage.setItem("gn-o-meu-nome", "Ana Ribeiro");
    const { api } = renderAt("/cuidados/cat-3");
    await user.click(await screen.findByRole("button", { name: "Adicionar medicação" }));
    await user.type(screen.getByLabelText("Medicamento"), "Amoxicilina");
    await user.type(screen.getByLabelText(/^Dose/), "1/2 comprimido");
    await user.click(screen.getByRole("button", { name: "Adicionar outra hora" }));
    await user.type(screen.getByLabelText("2.ª hora"), "20:00");
    await user.click(screen.getByLabelText("Dar com comida"));
    await user.click(screen.getByRole("button", { name: "Guardar e avisar a equipa" }));
    expect(api.addMedication).toHaveBeenCalledWith(expect.objectContaining({ catId: "cat-3", name: "Amoxicilina", times: ["08:00", "20:00"], withFood: true, startDate: "2026-11-02" }), { name: "Ana Ribeiro" });
    expect(await screen.findByRole("article", { name: "Amoxicilina" })).toBeInTheDocument();
    expect(screen.getByText("2 vezes por dia: 08:00, 20:00, com comida")).toBeInTheDocument();
  });

  it("books a vet appointment with transport and leaves a visit note", async () => {
    const user = userEvent.setup();
    localStorage.setItem("gn-o-meu-nome", "Ana Ribeiro");
    const { api } = renderAt("/cuidados/cat-1");
    await user.click(await screen.findByRole("button", { name: "Marcar consulta" }));
    await user.type(screen.getByLabelText("Dia"), "2026-11-10");
    await user.type(screen.getByLabelText("Clínica veterinária"), "Hospital Veterinário de Viana");
    await user.type(screen.getByLabelText(/^Motivo/), "Análises aos rins");
    await user.click(screen.getByRole("button", { name: "Marcar e avisar a equipa" }));
    expect(api.addAppointment).toHaveBeenCalledWith(expect.objectContaining({ catId: "cat-1", startsAt: "2026-11-10T10:00:00.000Z", needsTransport: true }), { name: "Ana Ribeiro" });
    expect(await screen.findByRole("article", { name: "Consulta: Análises aos rins" })).toBeInTheDocument();

    await user.type(screen.getByLabelText("Como estava Tobias hoje?"), "Comeu pouco ao almoço.");
    await user.click(screen.getByLabelText(/É importante/));
    await user.click(screen.getByRole("button", { name: "Guardar comentário" }));
    expect(api.addNote).toHaveBeenCalledWith({ catId: "cat-1", text: "Comeu pouco ao almoço.", important: true }, { name: "Ana Ribeiro" });
    expect(await screen.findByText("Comeu pouco ao almoço.")).toBeInTheDocument();
  });
});

describe("Novidades", () => {
  it("shows unread changes in the menu until they are opened", async () => {
    const user = userEvent.setup();
    renderAt("/cuidados");
    const link = await screen.findByRole("link", { name: /Cuidados/ });
    await waitFor(() => expect(link).toHaveTextContent("3"));
    expect(link).toHaveAccessibleName("Cuidados 3 novidades por ver");
    await user.click(screen.getByRole("tab", { name: /Novidades/ }));
    expect(await screen.findAllByText("Novo")).toHaveLength(3);
    await waitFor(() => expect(screen.getByRole("link", { name: /Cuidados/ })).toHaveAccessibleName("Cuidados"));
    expect(screen.getAllByText("Novo")).toHaveLength(3);
  });
});

describe("Hoje", () => {
  it("brings care changes and pending doses to the first screen", async () => {
    renderAt("/");
    expect(await screen.findByText("3 mudanças nos cuidados desde a sua última visita")).toBeInTheDocument();
    expect(await screen.findByText("doses de medicação por dar hoje (2 já na hora)")).toBeInTheDocument();
  });
});
