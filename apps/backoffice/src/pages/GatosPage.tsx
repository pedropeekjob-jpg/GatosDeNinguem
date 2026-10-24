import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ageLabel, formatDate, formatMonthYear, statusLabel, type CatStatus } from "@gn/domain";
import { Badge, Button, Checkbox, ChoiceList, Notice, TextArea, TextField } from "@gn/ui";
import { PhotoManager } from "../components/PhotoManager";
import { errorMessage, useApi } from "../lib/api";
import { photoSrc } from "../lib/photos";
import { slugify } from "../lib/slug";
import type { Cat, CatInput } from "../lib/types";

const statusOptions = (Object.keys(statusLabel) as CatStatus[]).map((s) => ({ value: s, label: statusLabel[s] }));
type Tri = "sim" | "nao" | "nao-sei";
const toTri = (v: boolean | undefined): Tri => (v === undefined ? "nao-sei" : v ? "sim" : "nao");
const fromTri = (v: Tri) => (v === "nao-sei" ? undefined : v === "sim");
const triOptions = [{ value: "sim", label: "Sim" }, { value: "nao", label: "Não" }, { value: "nao-sei", label: "Ainda não sabemos" }] as const;

export function GatosPage() {
  const api = useApi();
  const cats = useQuery({ queryKey: ["cats"], queryFn: () => api.cats() });
  const [editing, setEditing] = useState<Cat | "novo">();

  if (editing) return <CatForm cat={editing === "novo" ? undefined : editing} onClose={() => setEditing(undefined)} />;
  return (
    <div className="gn-stack gn-stack--m">
      <h1>Gatos</h1>
      <div><Button onClick={() => setEditing("novo")}>Adicionar gato</Button></div>
      {cats.isError ? <Notice tone="error" title="Erro">{errorMessage(cats.error)}</Notice> : null}
      <ul className="cat-list">
        {cats.data?.map((c) => (
          <li key={c.id} className="shift">
            <img src={c.photos[0] ? photoSrc(c.photos[0].url) : undefined} alt="" width={96} height={72} />
            <div className="gn-stack gn-stack--s">
              <p className="shift__title">{c.name}</p>
              <p className="small muted">{ageLabel(c.ageYears)} · {c.sex === "femea" ? "Fêmea" : "Macho"}{c.arrivedAt ? <> · no gatil desde <time dateTime={c.arrivedAt}>{formatMonthYear(c.arrivedAt)}</time></> : null}</p>
              <div><Badge tone={c.status === "para-adocao" ? "success" : "neutral"}>{statusLabel[c.status]}</Badge></div>
            </div>
            <Button variant="secondary" onClick={() => setEditing(c)}>Editar<span className="gn-sr-only"> {c.name}</span></Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CatForm({ cat, onClose }: { cat?: Cat; onClose: () => void }) {
  const api = useApi();
  const qc = useQueryClient();
  const [f, setF] = useState({
    name: cat?.name ?? "",
    sex: cat?.sex ?? "femea",
    ageYears: String(cat?.ageYears ?? 1),
    status: cat?.status ?? "a-recuperar",
    energy: cat?.energy ?? "equilibrado",
    summary: cat?.summary ?? "",
    story: cat?.story ?? "",
    traits: cat?.traits.join(", ") ?? "",
    kids: toTri(cat?.goodWithKids),
    cats: toTri(cat?.goodWithCats),
    dogs: toTri(cat?.goodWithDogs),
    specialNeeds: cat?.specialNeeds ?? "",
    sterilized: cat?.sterilized ?? false,
    vaccinated: cat?.vaccinated ?? false,
    microchipped: cat?.microchipped ?? false,
    photos: cat?.photos ?? [],
    // A new cat has usually just arrived.
    arrivedAt: cat ? cat.arrivedAt ?? "" : new Date().toISOString().slice(0, 10),
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  const save = useMutation({
    mutationFn: () => {
      if (f.photos.length === 0) throw new Error("Adicione pelo menos uma fotografia.");
      if (f.photos.some((p) => p.alt.trim().length < 3)) throw new Error("Escreva uma descrição curta em cada fotografia.");
      const input: CatInput = {
        slug: cat?.slug ?? slugify(f.name),
        name: f.name,
        sex: f.sex,
        ageYears: Number(f.ageYears),
        status: f.status,
        energy: f.energy,
        summary: f.summary,
        story: f.story,
        traits: f.traits.split(",").map((t) => t.trim()).filter(Boolean),
        goodWithKids: fromTri(f.kids),
        goodWithCats: fromTri(f.cats),
        goodWithDogs: fromTri(f.dogs),
        specialNeeds: f.specialNeeds || undefined,
        sterilized: f.sterilized,
        vaccinated: f.vaccinated,
        microchipped: f.microchipped,
        photos: f.photos.map((p) => ({ url: p.url, alt: p.alt.trim() })),
        seo: cat?.seo ?? {},
        arrivedAt: f.arrivedAt || undefined,
        listedAt: cat?.listedAt,
        adoptedAt: cat?.adoptedAt,
        happyEnding: cat?.happyEnding,
      };
      return cat ? api.updateCat(cat.id, input) : api.createCat(input);
    },
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["cats"] }); onClose(); },
  });

  return (
    <form className="gn-stack gn-stack--m" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
      <div><Button variant="quiet" onClick={onClose}>← Voltar</Button></div>
      <h1>{cat ? `Editar ${cat.name}` : "Novo gato"}</h1>
      <TextField id="c-name" label="Nome" value={f.name} onChange={(e) => set("name", e.target.value)} hint={!cat && f.name ? `Endereço: /adotar/${slugify(f.name)}` : undefined} />
      <section className="gn-stack gn-stack--s" aria-labelledby="c-photos">
        <h2 id="c-photos">Fotografias</h2>
        <PhotoManager photos={f.photos} onChange={(photos) => set("photos", photos)} altFor={(n) => `${f.name || "Gato"}, foto ${n}`} />
      </section>
      <ChoiceList name="c-status" legend="Situação" value={f.status} onChange={(v) => set("status", v)} options={statusOptions} />
      <ChoiceList name="c-sex" legend="Sexo" value={f.sex} onChange={(v) => set("sex", v)} options={[{ value: "femea", label: "Fêmea" }, { value: "macho", label: "Macho" }]} />
      <TextField
        id="c-arrived"
        label="Chegou ao gatil a"
        hint={`Aparece no site como "No gatil desde…".${cat?.listedAt ? ` Para adoção desde ${formatDate(cat.listedAt)}.` : ""}${cat?.adoptedAt ? ` Adotad${cat.sex === "femea" ? "a" : "o"} a ${formatDate(cat.adoptedAt)}.` : ""}`}
        type="date"
        value={f.arrivedAt}
        onChange={(e) => set("arrivedAt", e.target.value)}
      />
      <TextField id="c-age" label="Idade (anos)" hint="Use 0 para bebés com menos de 1 ano." type="number" inputMode="numeric" value={f.ageYears} onChange={(e) => set("ageYears", e.target.value)} />
      <ChoiceList name="c-energy" legend="Feitio" value={f.energy} onChange={(v) => set("energy", v)} options={[{ value: "calmo", label: "Calmo" }, { value: "equilibrado", label: "Equilibrado" }, { value: "ativo", label: "Ativo e brincalhão" }]} />
      <TextArea id="c-summary" label="Resumo (uma frase)" hint="Aparece nos cartões e no Google." rows={2} value={f.summary} onChange={(e) => set("summary", e.target.value)} recommended={{ min: 50, max: 160 }} />
      <TextArea id="c-story" label="História" rows={5} value={f.story} onChange={(e) => set("story", e.target.value)} />
      <TextField id="c-traits" label="Características" hint="Separadas por vírgulas: meigo, curioso, gosta de colo" value={f.traits} onChange={(e) => set("traits", e.target.value)} />
      <ChoiceList name="c-kids" legend="Dá-se bem com crianças?" value={f.kids} onChange={(v) => set("kids", v)} options={[...triOptions]} />
      <ChoiceList name="c-cats" legend="Dá-se bem com outros gatos?" value={f.cats} onChange={(v) => set("cats", v)} options={[...triOptions]} />
      <ChoiceList name="c-dogs" legend="Dá-se bem com cães?" value={f.dogs} onChange={(v) => set("dogs", v)} options={[...triOptions]} />
      <TextField id="c-special" label="Cuidados especiais (opcional)" value={f.specialNeeds} onChange={(e) => set("specialNeeds", e.target.value)} />
      <Checkbox id="c-ster" label="Esterilizado" checked={f.sterilized} onChange={(v) => set("sterilized", v)} />
      <Checkbox id="c-vac" label="Vacinado" checked={f.vaccinated} onChange={(v) => set("vaccinated", v)} />
      <Checkbox id="c-chip" label="Com chip" checked={f.microchipped} onChange={(v) => set("microchipped", v)} />
      {save.isError ? <Notice tone="error" title="Não foi guardado">{errorMessage(save.error)}</Notice> : null}
      <div><Button type="submit" disabled={save.isPending}>{save.isPending ? "A guardar…" : "Guardar gato"}</Button></div>
    </form>
  );
}
