import { ConflictException, NotFoundException } from "@nestjs/common";
import {
  careRound,
  isMuted,
  lisbonNow,
  normalizePhone,
  taskAlert,
  volunteerPhones,
  type Author,
  type CareAlert,
  type CareAlertDraft,
  type CareTask,
  type Cat,
  type Medication,
} from "@gn/domain";
import { randomUUID } from "node:crypto";
import type { ApiOptions } from "../common/options";
import type { PatinhasRepository } from "../patinhas/repository";

export { catSummary } from "@gn/domain";
const OPEN: CareTask["status"][] = ["aberta", "aceite"];

/** Care rules shared by the back office (managers) and the volunteers' own area on the site. */
export class CareService {
  constructor(private readonly options: ApiOptions, private readonly accounts: PatinhasRepository, private readonly onAlert?: (alert: CareAlert) => Promise<void>) {}
  get repo() { return this.options.repository; }
  now() { return this.options.now?.() ?? new Date(); }
  today() { return lisbonNow(this.now()).date; }

  async cat(catId: string) {
    const cat = await this.repo.getCat(catId);
    if (!cat) throw new NotFoundException("Gato não encontrado.");
    return cat;
  }

  async medication(id: string) {
    const med = await this.repo.getMedication(id);
    if (!med) throw new NotFoundException("Medicação não encontrada.");
    return med;
  }

  async raise(cat: Pick<Cat, "id" | "name">, draft: CareAlertDraft, by: Author, taskId?: string): Promise<CareAlert> {
    const alert = await this.repo.saveCareAlert({ ...draft, id: randomUUID(), catId: cat.id, catName: cat.name, by, createdAt: this.now().toISOString(), taskId });
    await this.onAlert?.(alert).catch((err) => console.error("Could not tell the godparents", err));
    return alert;
  }

  /** Every dose due on a day, which cat, where it is, who gave it, and any help request about it. */
  async round(date: string) {
    const [medications, doses, cats, care, tasks] = await Promise.all([
      this.repo.listMedications(), this.repo.listDoses({ from: date, to: date }), this.repo.listCats(), this.repo.listCatCare(), this.repo.listCareTasks({ status: OPEN }),
    ]);
    return careRound({ medications, doses, cats, care, tasks }, date);
  }

  /** Records a dose once; closes any help request for it and tells everyone it is solved. */
  async giveDose(med: Medication, date: string, time: string, by: Author) {
    const already = (await this.repo.listDoses({ from: date, to: date })).find((d) => d.medicationId === med.id && d.time === time);
    if (already) {
      const at = lisbonNow(new Date(already.givenAt)).time;
      throw new ConflictException(`Esta dose já foi dada por ${already.by.name} às ${at}. Não dê outra vez.`);
    }
    let dose;
    try {
      dose = await this.repo.saveDose({ id: randomUUID(), medicationId: med.id, catId: med.catId, date, time, givenAt: this.now().toISOString(), by });
    } catch {
      // Two people pressed at the same moment: the database keeps only one.
      throw new ConflictException("Esta dose acabou de ser dada por outra pessoa. Não dê outra vez.");
    }
    const tasks = await this.repo.listCareTasks({ status: OPEN });
    for (const t of tasks.filter((x) => x.medicationId === med.id && x.date === date && x.time === time)) {
      await this.closeTask(t, "feita", by);
    }
    return dose;
  }

  // ----- help requests -----

  async requestHelp(med: Medication, input: { date: string; time: string; comment: string }, by: Author) {
    const open = (await this.repo.listCareTasks({ status: OPEN })).find((t) => t.medicationId === med.id && t.date === input.date && t.time === input.time);
    if (open) throw new ConflictException(open.status === "aberta" ? "Já foi pedida ajuda para esta dose." : `${open.acceptedBy!.name} já ficou com esta dose.`);
    const cat = await this.cat(med.catId);
    const task: CareTask = {
      id: randomUUID(), catId: cat.id, catName: cat.name, medicationId: med.id, what: `Dar ${med.name} (${med.dose})`,
      date: input.date, time: input.time, comment: input.comment, status: "aberta", createdBy: by, createdAt: this.now().toISOString(),
    };
    await this.repo.saveCareTask(task);
    // The reason stays with the cat, so whoever opens its page sees it.
    await this.repo.saveVisitNote({ id: randomUUID(), catId: cat.id, text: `Não foi possível dar ${med.name} (${input.time}): ${input.comment}`, important: true, by, createdAt: task.createdAt });
    await this.announce(task, "pedida", by);
    return task;
  }

  async task(id: string) {
    const t = await this.repo.getCareTask(id);
    if (!t) throw new NotFoundException("Pedido não encontrado.");
    return t;
  }

  async acceptTask(id: string, by: Author) {
    const t = await this.task(id);
    if (t.status !== "aberta") throw new ConflictException(t.status === "aceite" ? `${t.acceptedBy!.name} já ficou com este pedido. Obrigado na mesma!` : "Este pedido já está resolvido.");
    const next: CareTask = { ...t, status: "aceite", acceptedBy: by, acceptedAt: this.now().toISOString() };
    await this.repo.saveCareTask(next);
    await this.announce(next, "aceite", by);
    return next;
  }

  /** The person who took it cannot go after all: it goes back to everyone. */
  async releaseTask(id: string, by: Author) {
    const t = await this.task(id);
    if (t.status !== "aceite") throw new ConflictException("Este pedido não está atribuído.");
    const next: CareTask = { ...t, status: "aberta", acceptedBy: undefined, acceptedAt: undefined };
    await this.repo.saveCareTask(next);
    await this.announce(next, "devolvida", by);
    return next;
  }

  async closeTask(t: CareTask, status: "feita" | "cancelada", by: Author) {
    const next: CareTask = { ...t, status, closedBy: by, closedAt: this.now().toISOString() };
    await this.repo.saveCareTask(next);
    await this.announce(next, status, by);
    return next;
  }

  /** Writes the alert and tells every volunteer who has not silenced it: requests and their resolution alike. */
  private async announce(task: CareTask, change: Parameters<typeof taskAlert>[1], by: Author) {
    const alert = await this.raise({ id: task.catId, name: task.catName }, taskAlert(task, change, this.today()), by, task.id);
    const send = this.options.notifyVolunteers;
    if (!send) return;
    const phones = new Set(volunteerPhones(await this.repo.listShifts(), this.now()));
    const people = (await this.accounts.listAccounts()).filter((a) => a.phone && phones.has(normalizePhone(a.phone)) && a.id !== by.accountId);
    const recipients = [];
    for (const person of people) {
      const prefs = await this.repo.getCarePrefs(person.id);
      if (!prefs || !isMuted(alert, prefs)) recipients.push(person);
    }
    if (recipients.length) await send(recipients, alert).catch((err) => console.error("Could not notify volunteers", err));
  }
}
