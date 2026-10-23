import { describe, expect, it } from "vitest";
import {
  groupAlertsByCat, isMuted, relevantAlerts, splitRoundForShift, taskAlert, unreadForVolunteer, volunteerDuty, volunteerPhones,
  type CareAlert, type CareTask,
} from "./cuidados";
import type { Shift } from "./escalas";

const now = new Date("2026-11-07T08:30:00.000Z"); // Saturday 7 Nov, 08:30 in Lisbon
const shift = (over: Partial<Shift>): Shift => ({ id: "s", type: "limpeza", title: "Limpeza", startsAt: "2026-11-07T10:00:00.000Z", endsAt: "2026-11-07T12:00:00.000Z", location: "Gatil", capacity: 3, signups: [], ...over });
const ana = { volunteerId: "v1", name: "Ana", phone: "912 000 001", signedUpAt: "2026-11-01T00:00:00.000Z" };

describe("volunteerDuty", () => {
  it("finds today's gatil shift by mobile number, whatever the spacing", () => {
    const d = volunteerDuty([shift({ id: "hoje", signups: [ana] }), shift({ id: "outro" })], "+351912000001", now);
    expect(d).toMatchObject({ isVolunteer: true, isToday: true });
    expect(d.shift?.id).toBe("hoje");
  });

  it("shows the next shift ahead of time, but only within a month", () => {
    const soon = shift({ id: "sabado", startsAt: "2026-11-14T10:00:00.000Z", endsAt: "2026-11-14T12:00:00.000Z", signups: [ana] });
    const far = shift({ id: "dezembro", startsAt: "2026-12-12T10:00:00.000Z", endsAt: "2026-12-12T12:00:00.000Z", signups: [ana] });
    expect(volunteerDuty([soon], "912000001", now)).toMatchObject({ isToday: false, shift: { id: "sabado" } });
    expect(volunteerDuty([far], "912000001", now).shift).toBeUndefined();
    expect(volunteerDuty([far], "912000001", now).isVolunteer).toBe(true);
  });

  it("lists vet transports and ignores people with no shifts", () => {
    const t = shift({ id: "vet", type: "transporte-vet", signups: [ana] });
    expect(volunteerDuty([t], "912000001", now).transports.map((s) => s.id)).toEqual(["vet"]);
    expect(volunteerDuty([t], "913999999", now).isVolunteer).toBe(false);
    expect(volunteerDuty([t], undefined, now).isVolunteer).toBe(false);
  });

  it("collects every volunteer's number for help requests", () => {
    expect(volunteerPhones([shift({ signups: [ana, { ...ana, volunteerId: "v2", phone: "913000002" }] })], now)).toEqual(["912000001", "913000002"]);
  });
});

describe("splitRoundForShift", () => {
  it("keeps doses an hour either side of the shift", () => {
    const round = [{ time: "08:00" }, { time: "09:00" }, { time: "13:00" }, { time: "20:00" }];
    const { during, rest } = splitRoundForShift(round, shift({}));
    expect(during.map((r) => r.time)).toEqual(["09:00", "13:00"]);
    expect(rest.map((r) => r.time)).toEqual(["08:00", "20:00"]);
  });
});

describe("help requests and notifications", () => {
  const task: CareTask = {
    id: "t1", catId: "cat-4", catName: "Estrela", medicationId: "med-1", what: "Dar Insulina (1 unidade)", date: "2026-11-07", time: "20:00",
    comment: "Tive de sair mais cedo", status: "aberta", createdBy: { name: "Ana", accountId: "conta-1" }, createdAt: "2026-11-07T10:00:00.000Z",
  };
  const alert = (over: Partial<CareAlert>): CareAlert => ({ id: "a", catId: "cat-4", catName: "Estrela", kind: "nota", message: "x", important: false, by: { name: "Ana" }, createdAt: "2026-11-07T10:00:00.000Z", ...over });

  it("words the request and its resolution plainly", () => {
    expect(taskAlert(task, "pedida", "2026-11-07").message).toBe("Precisa-se de quem possa dar Insulina (1 unidade) a Estrela hoje às 20:00. Ana não conseguiu: “Tive de sair mais cedo”");
    expect(taskAlert({ ...task, status: "aceite", acceptedBy: { name: "Rui" } }, "aceite", "2026-11-07").message).toBe("Resolvido: Rui vai dar Insulina (1 unidade) a Estrela hoje às 20:00. Obrigado!");
  });

  it("shows one line per request with its latest news, and only cats that matter to me", () => {
    const alerts = [
      alert({ id: "p", kind: "tarefa", taskId: "t1", createdAt: "2026-11-07T10:00:00.000Z" }),
      alert({ id: "r", kind: "tarefa", taskId: "t1", createdAt: "2026-11-07T10:05:00.000Z" }),
      alert({ id: "mine", catId: "cat-1", catName: "Tobias" }),
      alert({ id: "other", catId: "cat-9", catName: "Outro" }),
      alert({ id: "old", catId: "cat-1", createdAt: "2026-10-01T00:00:00.000Z" }),
    ];
    const seen = relevantAlerts(alerts, { catIds: new Set(["cat-1"]), tasks: [task], since: "2026-11-01T00:00:00.000Z" });
    expect(seen.map((a) => a.id)).toEqual(["r", "mine"]);
  });

  it("lets each person silence by kind, by cat, or everything, for themselves", () => {
    const a = alert({ kind: "nota", catId: "cat-1" });
    expect(isMuted(a, { muteAll: false, mutedKinds: ["nota"], mutedCats: [] })).toBe(true);
    expect(isMuted(a, { muteAll: false, mutedKinds: [], mutedCats: ["cat-1"] })).toBe(true);
    expect(isMuted(a, { muteAll: true, mutedKinds: [], mutedCats: [] })).toBe(true);
    expect(isMuted(a, { muteAll: false, mutedKinds: ["tarefa"], mutedCats: ["cat-2"] })).toBe(false);
    expect(unreadForVolunteer([a, alert({ id: "b", createdAt: "2026-11-07T11:00:00.000Z" })], { lastSeenAt: "2026-11-07T10:30:00.000Z", muteAll: false, mutedKinds: [], mutedCats: [] }).map((x) => x.id)).toEqual(["b"]);
  });

  it("groups several changes about one cat", () => {
    const groups = groupAlertsByCat([alert({ id: "1" }), alert({ id: "2", createdAt: "2026-11-07T11:00:00.000Z", important: true }), alert({ id: "3", catId: "cat-1", catName: "Tobias" })]);
    expect(groups.map((g) => [g.catName, g.alerts.length, g.important])).toEqual([["Estrela", 2, true], ["Tobias", 1, false]]);
  });
});
