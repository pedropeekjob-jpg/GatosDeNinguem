import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ShopVisit } from "./ShopVisit";

describe("ShopVisit", () => {
  it("says the address and hours are coming while the team has not set them", () => {
    render(<ShopVisit settings={{}} />);
    expect(screen.getByText(/Em breve dizemos aqui a morada e o horário/)).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("shows the address with directions in Google Maps, and the hours line by line", () => {
    render(<ShopVisit settings={{ address: "Rua da Bandeira 10, Viana do Castelo", hours: "Sábados, 10h às 13h\nDomingos, fechado" }} />);
    expect(screen.getByText("Rua da Bandeira 10, Viana do Castelo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Como chegar (Google Maps)" })).toHaveAttribute(
      "href",
      "https://www.google.com/maps/dir/?api=1&destination=Rua%20da%20Bandeira%2010%2C%20Viana%20do%20Castelo",
    );
    expect(screen.getByText(/Domingos, fechado/)).toBeInTheDocument();
  });

  it("still says the hours are coming when only the address is known", () => {
    render(<ShopVisit settings={{ address: "Rua da Bandeira 10" }} />);
    expect(screen.getByText("Em breve dizemos aqui o horário.")).toBeInTheDocument();
  });
});
