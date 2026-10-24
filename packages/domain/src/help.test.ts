import { describe, expect, it } from "vitest";
import { recommendHelp } from "./help";

describe("recommendHelp", () => {
  it("suggests sharing when there is no time, money or space", () => {
    const r = recommendHelp({ time: "nenhum", money: "nao", space: "nao" });
    expect(r.main.id).toBe("partilhar");
    expect(r.alternatives).toEqual([]);
  });

  it("suggests adopting first for people with space and lots of time", () => {
    expect(recommendHelp({ time: "muito", money: "nao", space: "sim" }).main.id).toBe("adotar");
  });

  it("suggests a shift for people with a few hours", () => {
    const r = recommendHelp({ time: "algumas-horas", money: "pouco", space: "nao" });
    expect(r.main.id).toBe("voluntariado");
    expect(r.alternatives.map((a) => a.id)).toEqual(["transporte", "amigo"]);
  });

  it("leaves out Ser Amigo while it is not offered", () => {
    const r = recommendHelp({ time: "algumas-horas", money: "pouco", space: "nao" }, { amigo: false });
    expect(r.alternatives.map((a) => a.id)).toEqual(["transporte", "doar"]);
  });

  it("suggests sponsoring for people with money but no time", () => {
    expect(recommendHelp({ time: "nenhum", money: "sim", space: "nao" }).main.id).toBe("apadrinhar");
  });
});
