import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import axe from "axe-core";
import { Shell } from "../src/App";
import { fakeApi } from "./fakeApi";

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

describe("Loja: pedidos", () => {
  it("shows orders to handle, marks one paid and then delivered", async () => {
    const user = userEvent.setup();
    const { container, api } = renderAt("/loja");
    const order = await screen.findByRole("article", { name: "Pedido L-7K3Q" });
    expect(within(order).getByText("À espera de pagamento")).toBeInTheDocument();
    expect(within(order).getByText(/2 × Caneca/)).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);

    await user.click(within(order).getByRole("button", { name: "Marcar como pago (L-7K3Q)" }));
    expect(api.updateOrder).toHaveBeenCalledWith("enc-1", { status: "pago" });
    const paid = await screen.findByRole("article", { name: "Pedido L-7K3Q" });
    expect(await within(paid).findByText("Pago, por entregar")).toBeInTheDocument();
    await user.click(within(paid).getByRole("button", { name: "Marcar como entregue (L-7K3Q)" }));
    // Delivered orders leave the "Por tratar" list.
    await screen.findByRole("button", { name: "Por tratar (1)" });
    expect(screen.queryByRole("article", { name: "Pedido L-7K3Q" })).not.toBeInTheDocument();
  });

  it("asks before cancelling", async () => {
    const user = userEvent.setup();
    const { api } = renderAt("/loja");
    const order = await screen.findByRole("article", { name: "Pedido L-M4TS" });
    await user.click(within(order).getByRole("button", { name: "Cancelar pedido L-M4TS" }));
    expect(api.updateOrder).not.toHaveBeenCalled();
    await user.click(within(order).getByRole("button", { name: "Sim, cancelar o pedido L-M4TS" }));
    expect(api.updateOrder).toHaveBeenCalledWith("enc-2", { status: "cancelado" });
  });

  it("records a donation at a stand, at least the minimum of the gifts", async () => {
    const user = userEvent.setup();
    const { api } = renderAt("/loja");
    await user.click(await screen.findByRole("button", { name: "Registar donativo na loja ou na banca" }));
    await user.selectOptions(await screen.findByLabelText("Oferta"), "art-tshirt");
    await user.selectOptions(screen.getByLabelText("Tamanho"), "M");
    await user.clear(screen.getByLabelText("Quantidade"));
    await user.type(screen.getByLabelText("Quantidade"), "2");
    await user.click(screen.getByRole("button", { name: "Juntar ao donativo" }));
    expect(screen.getByText(/Pelo menos 30\s€/)).toBeInTheDocument();
    await user.type(screen.getByLabelText("Quanto deu (euros)"), "20");
    await user.click(screen.getByRole("button", { name: "Registar donativo" }));
    expect(await screen.findByText(/O donativo mínimo para estas ofertas é 30\s€/)).toBeInTheDocument();
    expect(api.giveInPerson).not.toHaveBeenCalled();
    await user.clear(screen.getByLabelText("Quanto deu (euros)"));
    await user.type(screen.getByLabelText("Quanto deu (euros)"), "35");
    await user.click(screen.getByRole("button", { name: "Registar donativo" }));
    expect(api.giveInPerson).toHaveBeenCalledWith([{ productId: "art-tshirt", variant: "M", quantity: 2 }], 3500);
  });
});

describe("Loja: artigos", () => {
  it("adds a gift with sizes, shows how much goes to the cats and warns when it is not symbolic", async () => {
    const user = userEvent.setup();
    const { api } = renderAt("/loja");
    await user.click(await screen.findByRole("tab", { name: "Artigos" }));
    await user.click(await screen.findByRole("button", { name: "Adicionar artigo" }));
    await user.type(screen.getByLabelText("Nome"), "Sweatshirt amarela");
    await user.upload(screen.getByLabelText("Escolher fotografias para adicionar"), new File(["x"], "foto.jpg", { type: "image/jpeg" }));
    await screen.findByLabelText("Descrição da fotografia 1");
    await user.type(screen.getByLabelText("Donativo mínimo (euros)"), "25");
    await user.type(screen.getByLabelText(/Quanto custou/), "15");
    expect(screen.getByText("Esta oferta não é simbólica")).toBeInTheDocument();
    await user.clear(screen.getByLabelText(/Quanto custou/));
    await user.type(screen.getByLabelText(/Quanto custou/), "11,50");
    expect(screen.getByText(/13,50\s€/)).toBeInTheDocument();
    expect(screen.queryByText("Esta oferta não é simbólica")).not.toBeInTheDocument();
    await user.click(screen.getByLabelText("Tem tamanhos ou cores"));
    await user.click(screen.getByRole("button", { name: "Juntar opção" }));
    await user.type(screen.getByLabelText("Opção 1"), "M");
    await user.clear(screen.getByLabelText("Quantos há (opção 1)"));
    await user.type(screen.getByLabelText("Quantos há (opção 1)"), "5");
    await user.click(screen.getByRole("button", { name: "Guardar artigo" }));
    expect(api.createProduct).toHaveBeenCalledWith(expect.objectContaining({
      slug: "sweatshirt-amarela", minDonationCents: 2500, costCents: 1150, variants: [{ label: "M", stock: 5 }], stock: 0, active: true,
    }));
    expect(await screen.findByRole("button", { name: "Editar Sweatshirt amarela" })).toBeInTheDocument();
  });
});

describe("Loja: doações de artigos", () => {
  it("accepts an offer, marks it received and puts it in the shop as donated", async () => {
    const user = userEvent.setup();
    const { api } = renderAt("/loja");
    await user.click(await screen.findByRole("tab", { name: "Doações de artigos" }));
    const offer = await screen.findByRole("article", { name: "Oferta de Inês Faria" });
    await user.click(within(offer).getByRole("button", { name: "Aceitar (oferta de Inês Faria)" }));
    await user.click(await within(offer).findByRole("button", { name: "Já recebemos (oferta de Inês Faria)" }));
    await user.click(await within(offer).findByRole("button", { name: "Pôr na loja (oferta de Inês Faria)" }));
    expect(await screen.findByText("A partir de uma doação")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Foi oferecido à loja/)).toBeChecked();
    expect(screen.getByLabelText(/^Descrição$/)).toHaveValue("Caixa com 10 livros infantis e 2 puzzles completos");
    expect(api.createProduct).not.toHaveBeenCalled();
  });
});

describe("Loja: contas", () => {
  it("shows the year's numbers, adds what the money paid for and saves where the shop is and when it opens", async () => {
    const user = userEvent.setup();
    const { api, container } = renderAt("/loja");
    await user.click(await screen.findByRole("tab", { name: "Contas e transparência" }));
    expect((await screen.findAllByText("Vacinas da Estrela e do Tobias", { exact: false })).length).toBeGreaterThan(0);
    await user.type(screen.getByLabelText("Valor (euros)"), "24");
    await user.type(screen.getByLabelText("Em quê"), "Areia para o Paquito");
    await user.click(screen.getByRole("button", { name: "Juntar gasto" }));
    expect(api.addSpending).toHaveBeenCalledWith({ date: "2026-11-02", description: "Areia para o Paquito", amountCents: 2400 });
    expect((await screen.findAllByText("Areia para o Paquito", { exact: false })).length).toBeGreaterThan(0);

    await user.type(screen.getByLabelText("Morada da loja"), "Rua da Bandeira 10, Viana do Castelo");
    await user.type(screen.getByLabelText("Horário"), "Sábados, 10h às 13h");
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    expect(api.saveShopSettings).toHaveBeenCalledWith({ address: "Rua da Bandeira 10, Viana do Castelo", hours: "Sábados, 10h às 13h" });
    expect(await axeViolations(container)).toEqual([]);
  });
});
