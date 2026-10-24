import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import axe from "axe-core";
import { Shell } from "../src/App";
import { noFeatures } from "@gn/domain";
import { fakeApi } from "./fakeApi";

const today = new Date("2026-11-02T09:00:00.000Z");

function renderPatinhas(api = fakeApi(today)) {
  const utils = render(
    <MemoryRouter initialEntries={["/patinhas"]}>
      <Shell api={api} today={today} />
    </MemoryRouter>,
  );
  return { ...utils, api };
}

async function axeViolations(container: Element) {
  const r = await axe.run(container, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
  return r.violations.map((v) => v.id);
}

describe("Patinhas", () => {
  it("lists helpers with their level and confirms a donation for one of them", async () => {
    const user = userEvent.setup();
    const { container, api } = renderPatinhas();
    const ana = await screen.findByRole("listitem", { name: "Ana Ribeiro" });
    expect(within(ana).getByText("Nível 2 · Amigo de Bigodes")).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);

    const joao = screen.getByRole("listitem", { name: "João Costa" });
    await user.click(within(joao).getByRole("button", { name: "Dar Patinhas a João Costa" }));
    await user.selectOptions(within(joao).getByLabelText("O que fez"), "donativo");
    await user.type(within(joao).getByLabelText("Nota (opcional)"), "Transferência de 10 €");
    await user.click(within(joao).getByRole("button", { name: "Confirmar" }));
    expect(api.givePatinhas).toHaveBeenCalledWith("conta-2", { action: "donativo", quantity: undefined, note: "Transferência de 10 €" });
    expect(await within(await screen.findByRole("listitem", { name: "João Costa" })).findByText("50")).toBeInTheDocument();
  });

  it("finds a person by mobile number", async () => {
    const user = userEvent.setup();
    renderPatinhas();
    await screen.findByRole("listitem", { name: "Ana Ribeiro" });
    await user.type(screen.getByLabelText("Procurar pessoa"), "913 000");
    expect(screen.queryByRole("listitem", { name: "Ana Ribeiro" })).not.toBeInTheDocument();
    expect(screen.getByRole("listitem", { name: "João Costa" })).toBeInTheDocument();
  });

  it("marks a perk code as used", async () => {
    const user = userEvent.setup();
    renderPatinhas();
    await user.click(await screen.findByRole("tab", { name: "Trocas" }));
    await user.click(await screen.findByRole("button", { name: "Marcar como usada GN-K7P2Q" }));
    expect(await screen.findByText("Usada")).toBeInTheDocument();
  });

  it("changes how many Patinhas an action is worth", async () => {
    const user = userEvent.setup();
    const { api } = renderPatinhas();
    await user.click(await screen.findByRole("tab", { name: "Pontos" }));
    const field = await screen.findByLabelText("Patinhas por hora");
    await user.clear(field);
    await user.type(field, "30");
    await user.click(screen.getByRole("button", { name: "Guardar pontos" }));
    expect(await screen.findByText("Guardado")).toBeInTheDocument();
    expect(api.savePointsRules).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ action: "turno-hora", points: 30 })]));
    expect(screen.queryByText(/adoção|adotar.*Patinhas/i)).toBeNull();
  });

  it("creates a badge and a monthly challenge", async () => {
    const user = userEvent.setup();
    const { container } = renderPatinhas();
    await user.click(await screen.findByRole("tab", { name: "Medalhas" }));
    await user.click(await screen.findByRole("button", { name: "Nova medalha" }));
    await user.type(screen.getByLabelText("Nome"), "Inverno quente");
    await user.type(screen.getByLabelText("Como se ganha"), "Ajudou na campanha de inverno");
    await user.selectOptions(screen.getByLabelText("Ação"), "donativo");
    await user.click(screen.getByRole("button", { name: "Guardar medalha" }));
    expect(await screen.findByRole("listitem", { name: "Inverno quente" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Desafios" }));
    await user.click(await screen.findByRole("button", { name: "Novo desafio" }));
    await user.type(screen.getByLabelText("Nome do desafio"), "Dezembro: 20 transportes");
    const goal = screen.getByLabelText("Objetivo");
    await user.clear(goal);
    await user.type(goal, "20");
    expect(await axeViolations(container)).toEqual([]);
    await user.click(screen.getByRole("button", { name: "Guardar desafio" }));
    expect(await screen.findByRole("listitem", { name: "Dezembro: 20 transportes" })).toBeInTheDocument();
  });

  it("sets the Patinhas price and minimum level of a partner perk", async () => {
    const user = userEvent.setup();
    const { api } = renderPatinhas();
    await user.click(await screen.findByRole("tab", { name: "Vantagens" }));
    const shop = await screen.findByRole("form", { name: "Bigodes Pet Shop (exemplo)" });
    const cost = within(shop).getByLabelText("Custo em Patinhas");
    await user.clear(cost);
    await user.type(cost, "120");
    await user.selectOptions(within(shop).getByLabelText("Nível mínimo"), "3");
    await user.click(within(shop).getByRole("button", { name: /Guardar/ }));
    expect(await within(shop).findByText("Guardado")).toBeInTheDocument();
    expect(api.updatePartner).toHaveBeenCalledWith("partner-2", { perks: [expect.objectContaining({ id: "racao-15", patinhasCost: 120, minLevel: 3 })] });
  });
});

describe("Patinhas switched off", () => {
  it("leaves Patinhas out of the menu and explains how to switch them on", async () => {
    renderPatinhas(fakeApi(today, noFeatures));
    expect(await screen.findByRole("heading", { name: "Patinhas" })).toBeInTheDocument();
    expect(await screen.findByText("As Patinhas estão desligadas")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Patinhas" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Pessoas" })).not.toBeInTheDocument();
  });

  it("with Patinhas on but swaps off, hides the swaps and partner perks", async () => {
    renderPatinhas(fakeApi(today, { patinhas: true, trocas: false, amigo: false }));
    expect(await screen.findByRole("tab", { name: "Pessoas" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Patinhas" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Trocas" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Vantagens" })).not.toBeInTheDocument();
  });
});
