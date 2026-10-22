import { describe, expect, it } from "vitest";
import {
  appointmentAlert,
  catLocationSchema,
  isMedicationActive,
  locationChangeAlert,
  locationLabel,
  medicationAlert,
  medicationInputSchema,
  medicationRound,
  noteAlert,
  overdueDoses,
  timesLabel,
  transportWindow,
  unreadAlerts,
  upcomingAppointments,
  type Appointment,
  type CareAlert,
  type Medication,
} from "./cuidados";
import { seedAppointments, seedCareAlerts, seedCatCare, seedMedications } from "./seed";

const ana = { name: "Ana" };
const med = (over: Partial<Medication> = {}): Medication => ({
  id: "m1", catId: "c1", name: "Insulina", dose: "1 unidade", times: ["20:00", "08:00"], withFood: true, startDate: "2026-11-01", createdBy: ana, updatedAt: "2026-11-01T08:00:00.000Z", ...over,
});

describe("location", () => {
  it("describes where a cat is in plain words", () => {
    expect(locationLabel({ area: "paquito", spot: "solto" })).toBe("Contentor Paquito, solto");
    expect(locationLabel({ area: "caramelo", spot: "jaula", cage: "2" })).toBe("Contentor Caramelo, jaula 2");
    expect(locationLabel({ area: "colonia", spot: "solto" })).toBe("Colónia");
  });

  it("only allows cages inside the containers", () => {
    expect(catLocationSchema.safeParse({ area: "colonia", spot: "jaula" }).success).toBe(false);
    expect(catLocationSchema.safeParse({ area: "carlota", spot: "jaula", cage: "3" }).success).toBe(true);
  });

  it("raises an alert when a cat moves, and none when nothing changed", () => {
    const from = { area: "paquito", spot: "solto" } as const;
    const to = { area: "caramelo", spot: "jaula", cage: "2", reason: "A tomar antibiótico" } as const;
    expect(locationChangeAlert("Tobias", from, to)).toEqual({
      kind: "localizacao",
      message: "Tobias mudou de Contentor Paquito, solto para Contentor Caramelo, jaula 2. Motivo: A tomar antibiótico.",
      important: true,
    });
    expect(locationChangeAlert("Tobias", to, { ...to, reason: "Outro motivo" })).toBeUndefined();
    expect(locationChangeAlert("Mia", undefined, { area: "colonia", spot: "solto" })?.message).toBe("Mia está agora em Colónia.");
  });

  it("gives every demo cat in the shelter a place", () => {
    expect(seedCatCare.map((c) => catLocationSchema.parse(c.location).area)).toEqual(["paquito", "colonia", "caramelo", "carlota", "fora"]);
  });
});

describe("medication", () => {
  it("is active between its start and end dates, unless stopped", () => {
    const m = med({ endDate: "2026-11-10" });
    expect(isMedicationActive(m, "2026-10-31")).toBe(false);
    expect(isMedicationActive(m, "2026-11-10")).toBe(true);
    expect(isMedicationActive(m, "2026-11-11")).toBe(false);
    expect(isMedicationActive({ ...m, stoppedAt: "2026-11-05T10:00:00.000Z" }, "2026-11-06")).toBe(false);
  });

  it("refuses an end date before the start", () => {
    const r = medicationInputSchema.safeParse({ catId: "c1", name: "Antibiótico", dose: "1 ml", startDate: "2026-11-05", endDate: "2026-11-01" });
    expect(r.success).toBe(false);
  });

  it("explains when to give it", () => {
    expect(timesLabel(med())).toBe("2 vezes por dia: 08:00, 20:00, com comida");
    expect(timesLabel(med({ times: ["09:00"], withFood: false }))).toBe("Uma vez por dia, às 09:00");
    expect(timesLabel(med({ times: [], withFood: false }))).toBe("Só quando for preciso");
  });

  it("builds the day's round by time and marks doses already given", () => {
    const other = med({ id: "m2", catId: "c2", name: "Semintra", times: ["09:00"] });
    const given = { id: "d1", medicationId: "m1", catId: "c1", date: "2026-11-02", time: "08:00", givenAt: "2026-11-02T08:05:00.000Z", by: ana };
    const round = medicationRound([med(), other, med({ id: "old", endDate: "2026-11-01" })], [given], "2026-11-02");
    expect(round.map((r) => `${r.time} ${r.medication.name}`)).toEqual(["08:00 Insulina", "09:00 Semintra", "20:00 Insulina"]);
    expect(round[0]!.given?.by.name).toBe("Ana");
    expect(overdueDoses(round, "10:00").map((r) => r.medication.name)).toEqual(["Semintra"]);
  });

  it("alerts the team about new and stopped treatments", () => {
    expect(medicationAlert("Estrela", med({ endDate: "2026-11-15" }), "nova").message).toBe("Estrela começa a tomar Insulina, 1 unidade. 2 vezes por dia: 08:00, 20:00, com comida até 15 de novembro.");
    expect(medicationAlert("Estrela", med(), "terminada").message).toBe("Estrela deixou de tomar Insulina.");
  });
});

describe("appointments", () => {
  const a: Appointment = { id: "a1", catId: "c1", startsAt: "2026-11-05T15:30:00.000Z", clinic: "Clínica do Lima", reason: "Revisão", status: "marcada", createdBy: ana, updatedAt: "2026-11-01T00:00:00.000Z" };

  it("lists upcoming ones, soonest first", () => {
    const later = { ...a, id: "a2", startsAt: "2026-11-20T10:00:00.000Z" };
    const done = { ...a, id: "a3", status: "feita" as const };
    expect(upcomingAppointments([later, done, a], new Date("2026-11-01T00:00:00.000Z")).map((x) => x.id)).toEqual(["a1", "a2"]);
  });

  it("sizes the transport slot around the appointment", () => {
    expect(transportWindow(a.startsAt)).toEqual({ startsAt: "2026-11-05T15:00:00.000Z", endsAt: "2026-11-05T16:30:00.000Z" });
  });

  it("writes alerts in Lisbon time", () => {
    expect(appointmentAlert("Pimenta", a, "marcada").message).toBe("Consulta marcada para Pimenta: Revisão, quinta-feira, 5 de novembro às 15:30, Clínica do Lima.");
    expect(appointmentAlert("Pimenta", { ...a, outcome: "Tira os pontos dia 12." }, "feita").message).toBe("Pimenta foi à consulta (Revisão). Tira os pontos dia 12.");
  });

  it("links the demo transport slot to Pimenta's appointment", () => {
    expect(seedAppointments.find((x) => x.catId === "cat-5")?.transportShiftId).toBe("shift-3");
  });
});

describe("notes and alerts", () => {
  it("shortens long notes in the alert", () => {
    const alert = noteAlert("Mia", { text: "a".repeat(300), important: true });
    expect(alert.message.length).toBeLessThan(180);
    expect(alert.important).toBe(true);
  });

  it("counts what is new since the last visit", () => {
    const alerts: CareAlert[] = seedCareAlerts;
    expect(unreadAlerts(alerts, undefined)).toHaveLength(3);
    expect(unreadAlerts(alerts, "2026-10-21T12:00:00.000Z").map((x) => x.id)).toEqual(["al-3"]);
  });

  it("keeps demo medication consistent", () => {
    expect(seedMedications.every((m) => m.times.every((t) => /^\d{2}:\d{2}$/.test(t)))).toBe(true);
  });
});
