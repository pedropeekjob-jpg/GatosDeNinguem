import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../test/axe";
import { NextStep, ShareBar, ToggleButton } from "./index";

describe("ShareBar", () => {
  it("builds share links for any url and copies it", async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const { container } = render(<ShareBar url="https://gatosdeninguem.pt/adotar/mia" text="Conheça a Mia" />);
    expect(screen.getByRole("link", { name: "WhatsApp" }).getAttribute("href")).toContain("wa.me/?text=Conhe%C3%A7a%20a%20Mia");
    await userEvent.click(screen.getByRole("button", { name: "Copiar endereço" }));
    expect(writeText).toHaveBeenCalledWith("https://gatosdeninguem.pt/adotar/mia");
    expect(screen.getByRole("button", { name: "Copiado ✓" })).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("ToggleButton", () => {
  it("announces its state and changes the label", async () => {
    const onToggle = vi.fn();
    const { rerender } = render(<ToggleButton pressed={false} onToggle={onToggle} pressedChildren="Guardado">Guardar</ToggleButton>);
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(onToggle).toHaveBeenCalled();
    rerender(<ToggleButton pressed onToggle={onToggle} pressedChildren="Guardado">Guardar</ToggleButton>);
    expect(screen.getByRole("button", { name: "Guardado" })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("NextStep", () => {
  it("always offers actions after a thank-you", () => {
    render(<NextStep title="Obrigado!" actions={<a href="/ajudar">Outra forma de ajudar</a>} />);
    expect(screen.getByRole("status")).toHaveTextContent("Obrigado!");
    expect(screen.getByRole("link", { name: "Outra forma de ajudar" })).toBeInTheDocument();
  });
});
