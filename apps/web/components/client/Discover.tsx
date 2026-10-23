"use client";
import { useMemo, useRef, useState } from "react";
import { ageLabel, rankCats, type AdopterProfile, type MatchableCat } from "@gn/domain";
import { Button, ChoiceList, NextStep, StepWizard } from "@gn/ui";
import { useFavorites } from "./favorites";

type Answers = { household?: string; pets?: string; time?: AdopterProfile["timeAtHome"]; energy?: AdopterProfile["energyPreference"]; care?: "sim" | "nao" };

const steps = [
  { key: "household", title: "Há crianças em sua casa?", options: [{ value: "sim", label: "Sim" }, { value: "nao", label: "Não" }] },
  { key: "pets", title: "Tem outros animais?", options: [{ value: "nenhum", label: "Não tenho" }, { value: "gatos", label: "Tenho gatos" }, { value: "caes", label: "Tenho cães" }, { value: "ambos", label: "Tenho gatos e cães" }] },
  { key: "time", title: "Quanto tempo passa em casa?", options: [{ value: "pouco", label: "Pouco, trabalho fora o dia todo" }, { value: "algum", label: "Algum tempo" }, { value: "muito", label: "Muito, estou quase sempre em casa" }] },
  { key: "energy", title: "Que feitio procura?", options: [{ value: "calmo", label: "Um gato calmo, de colo" }, { value: "ativo", label: "Um gato brincalhão" }, { value: "tanto-faz", label: "Tanto faz" }] },
  { key: "care", title: "Pode cuidar de um gato com necessidades especiais?", options: [{ value: "sim", label: "Sim, se me ensinarem" }, { value: "nao", label: "Prefiro que não" }] },
] as const;

function toProfile(a: Answers): AdopterProfile {
  return {
    hasKids: a.household === "sim",
    hasCats: a.pets === "gatos" || a.pets === "ambos",
    hasDogs: a.pets === "caes" || a.pets === "ambos",
    timeAtHome: a.time ?? "algum",
    energyPreference: a.energy ?? "tanto-faz",
    openToSpecialNeeds: a.care === "sim",
  };
}

/**
 * Descobrir: one cat at a time with big labelled buttons. Swiping left/right is
 * an optional shortcut. A match explains why; nothing here approves an adoption.
 */
export function Discover({ cats }: { cats: MatchableCat[] }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [index, setIndex] = useState(0);
  const { toggle, isFavorite, favorites } = useFavorites();
  const touchX = useRef<number | null>(null);

  const ranked = useMemo(() => (step >= steps.length ? rankCats(cats, toProfile(answers)) : []), [cats, answers, step]);

  if (step < steps.length) {
    const q = steps[step]!;
    const value = answers[q.key as keyof Answers];
    return (
      <StepWizard step={step + 1} total={steps.length} title={q.title} onBack={() => setStep((s) => s - 1)} onNext={() => setStep((s) => s + 1)} nextDisabled={!value} nextLabel={step === steps.length - 1 ? "Ver gatos" : "Continuar"}>
        <ChoiceList name={`descobrir-${q.key}`} legend={<span className="gn-sr-only">{q.title}</span>} options={q.options.map((o) => ({ ...o }))} value={value} onChange={(v) => setAnswers((a) => ({ ...a, [q.key]: v }))} />
      </StepWizard>
    );
  }

  const current = ranked[index];
  if (!current) {
    const saved = cats.filter((c) => favorites.includes(c.slug));
    return (
      <NextStep
        title={ranked.length === 0 ? "De momento não temos um gato que combine com a sua casa" : "Já viu todos os gatos que combinam consigo"}
        actions={
          <>
            {ranked.length > 0 ? <Button onClick={() => setIndex(0)}>Ver outra vez</Button> : null}
            <Button href="/ajudar/familia-temporaria" variant="secondary">Ser família temporária</Button>
            <Button variant="quiet" onClick={() => { setStep(0); setIndex(0); }}>Mudar respostas</Button>
          </>
        }
      >
        {saved.length > 0 ? (
          <p>Guardou: {saved.map((c, i) => <span key={c.slug}>{i ? ", " : ""}<a href={`/adotar/${c.slug}`}>{c.name}</a></span>)}.</p>
        ) : (
          <p>Chegam gatos novos todas as semanas. Inscreva-se nas novidades no fundo da página para saber primeiro.</p>
        )}
      </NextStep>
    );
  }

  const { cat, match } = current;
  const photo = cat.photos[0]!;
  const next = () => setIndex((i) => i + 1);
  const pronoun = cat.sex === "femea" ? "a" : "o";

  return (
    <article
      className="discover-card"
      aria-labelledby="descobrir-nome"
      onTouchStart={(e) => { touchX.current = e.touches[0]?.clientX ?? null; }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        const end = e.changedTouches[0]?.clientX;
        touchX.current = null;
        if (start == null || end == null || Math.abs(end - start) < 80) return;
        if (end > start && !isFavorite(cat.slug)) toggle(cat.slug);
        next();
      }}
    >
      <p className="small muted" aria-live="polite">Gato {index + 1} de {ranked.length}</p>
      <img className="cat-profile__photo" src={photo.url} alt={photo.alt} width={800} height={600} />
      <div className="action-row">
        <h2 id="descobrir-nome">{cat.name}</h2>
        <span className={match.level === "super-match" ? "match-pill match-pill--super" : "match-pill"}>
          {match.level === "super-match" ? "★ Super match" : "✓ Combina consigo"}
        </span>
      </div>
      <p className="muted">{ageLabel(cat.ageYears)} · {cat.sex === "femea" ? "Fêmea" : "Macho"}</p>
      <p>{cat.summary}</p>
      <div>
        <p><strong>Porque combina consigo:</strong></p>
        <ul className="reasons">{match.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
      </div>
      <div className="action-row">
        <Button onClick={() => { if (!isFavorite(cat.slug)) toggle(cat.slug); next(); }} icon="♥">Gostava de conhecer</Button>
        <Button variant="secondary" onClick={next}>Ver outro gato</Button>
      </div>
      <p><a href={`/adotar/${cat.slug}`}>Ler a história d{pronoun} {cat.name}</a></p>
    </article>
  );
}
