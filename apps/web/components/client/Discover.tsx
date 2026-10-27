"use client";
import { useMemo, useRef, useState } from "react";
import { rankCats, type AdopterProfile, type MatchableCat } from "@gn/domain";
import { Button, ChoiceList, NextStep, StepWizard } from "@gn/ui";
import { useI18n } from "@/lib/i18n/client";
import { ageLabel, matchWords, sexLabel } from "@/lib/i18n/labels";
import type { I18n } from "@/lib/i18n/t";
import { useFavorites } from "./favorites";

type Answers = { household?: string; pets?: string; time?: AdopterProfile["timeAtHome"]; energy?: AdopterProfile["energyPreference"]; care?: "sim" | "nao" };

type Step = { key: keyof Answers; title: string; options: { value: string; label: string }[] };

const steps = ({ t }: I18n): Step[] => [
  { key: "household", title: t({ pt: "Há crianças em sua casa?", en: "Are there children in your home?", es: "¿Hay niños en su casa?", fr: "Y a-t-il des enfants chez vous ?" }), options: [{ value: "sim", label: t({ pt: "Sim", en: "Yes", es: "Sí", fr: "Oui" }) }, { value: "nao", label: t({ pt: "Não", en: "No", es: "No", fr: "Non" }) }] },
  { key: "pets", title: t({ pt: "Tem outros animais?", en: "Do you have other pets?", es: "¿Tiene otros animales?", fr: "Avez-vous d’autres animaux ?" }), options: [
    { value: "nenhum", label: t({ pt: "Não tenho", en: "No", es: "No tengo", fr: "Non" }) },
    { value: "gatos", label: t({ pt: "Tenho gatos", en: "I have cats", es: "Tengo gatos", fr: "J’ai des chats" }) },
    { value: "caes", label: t({ pt: "Tenho cães", en: "I have dogs", es: "Tengo perros", fr: "J’ai des chiens" }) },
    { value: "ambos", label: t({ pt: "Tenho gatos e cães", en: "I have cats and dogs", es: "Tengo gatos y perros", fr: "J’ai des chats et des chiens" }) },
  ] },
  { key: "time", title: t({ pt: "Quanto tempo passa em casa?", en: "How much time do you spend at home?", es: "¿Cuánto tiempo pasa en casa?", fr: "Combien de temps passez-vous chez vous ?" }), options: [
    { value: "pouco", label: t({ pt: "Pouco, trabalho fora o dia todo", en: "Little, I work away all day", es: "Poco, trabajo fuera todo el día", fr: "Peu, je travaille dehors toute la journée" }) },
    { value: "algum", label: t({ pt: "Algum tempo", en: "Some time", es: "Algo de tiempo", fr: "Un peu" }) },
    { value: "muito", label: t({ pt: "Muito, estou quase sempre em casa", en: "A lot, I’m nearly always at home", es: "Mucho, estoy casi siempre en casa", fr: "Beaucoup, je suis presque toujours là" }) },
  ] },
  { key: "energy", title: t({ pt: "Que feitio procura?", en: "What kind of cat are you looking for?", es: "¿Qué carácter busca?", fr: "Quel caractère cherchez-vous ?" }), options: [
    { value: "calmo", label: t({ pt: "Um gato calmo, de colo", en: "A calm lap cat", es: "Un gato tranquilo, de regazo", fr: "Un chat calme, qui aime les genoux" }) },
    { value: "ativo", label: t({ pt: "Um gato brincalhão", en: "A playful cat", es: "Un gato juguetón", fr: "Un chat joueur" }) },
    { value: "tanto-faz", label: t({ pt: "Tanto faz", en: "Either", es: "Me da igual", fr: "Peu importe" }) },
  ] },
  { key: "care", title: t({ pt: "Pode cuidar de um gato com necessidades especiais?", en: "Could you care for a cat with special needs?", es: "¿Puede cuidar de un gato con necesidades especiales?", fr: "Pourriez-vous vous occuper d’un chat aux besoins particuliers ?" }), options: [
    { value: "sim", label: t({ pt: "Sim, se me ensinarem", en: "Yes, if you show me how", es: "Sí, si me enseñan", fr: "Oui, si on m’explique" }) },
    { value: "nao", label: t({ pt: "Prefiro que não", en: "I’d rather not", es: "Prefiero que no", fr: "Je préfère pas" }) },
  ] },
];

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
  const i18n = useI18n();
  const { lang, t, l } = i18n;
  const questions = useMemo(() => steps(i18n), [lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [index, setIndex] = useState(0);
  const { toggle, isFavorite, favorites } = useFavorites();
  const touchX = useRef<number | null>(null);

  const ranked = useMemo(() => (step >= questions.length ? rankCats(cats, toProfile(answers), matchWords[lang]) : []), [cats, answers, step, questions, lang]);

  if (step < questions.length) {
    const q = questions[step]!;
    const value = answers[q.key];
    return (
      <StepWizard step={step + 1} total={questions.length} title={q.title} onBack={() => setStep((s) => s - 1)} onNext={() => setStep((s) => s + 1)} nextDisabled={!value} nextLabel={step === questions.length - 1 ? t({ pt: "Ver gatos", en: "See cats", es: "Ver gatos", fr: "Voir les chats" }) : t({ pt: "Continuar", en: "Continue", es: "Continuar", fr: "Continuer" })}>
        <ChoiceList name={`descobrir-${q.key}`} legend={<span className="gn-sr-only">{q.title}</span>} options={q.options.map((o) => ({ ...o }))} value={value} onChange={(v) => setAnswers((a) => ({ ...a, [q.key]: v }))} />
      </StepWizard>
    );
  }

  const current = ranked[index];
  if (!current) {
    const saved = cats.filter((c) => favorites.includes(c.slug));
    return (
      <NextStep
        title={ranked.length === 0
          ? t({ pt: "De momento não temos um gato que combine com a sua casa", en: "Right now we don’t have a cat that suits your home", es: "Ahora mismo no tenemos un gato que encaje con su casa", fr: "Pour l’instant, nous n’avons pas de chat adapté à votre foyer" })
          : t({ pt: "Já viu todos os gatos que combinam consigo", en: "You have seen all the cats that suit you", es: "Ya ha visto todos los gatos que encajan con usted", fr: "Vous avez vu tous les chats qui vous correspondent" })}
        actions={
          <>
            {ranked.length > 0 ? <Button onClick={() => setIndex(0)}>{t({ pt: "Ver outra vez", en: "See them again", es: "Verlos otra vez", fr: "Les revoir" })}</Button> : null}
            <Button href={l("/ajudar/familia-temporaria")} variant="secondary">{t({ pt: "Ser família temporária", en: "Become a foster home", es: "Ser casa de acogida", fr: "Devenir famille d’accueil" })}</Button>
            <Button variant="quiet" onClick={() => { setStep(0); setIndex(0); }}>{t({ pt: "Mudar respostas", en: "Change answers", es: "Cambiar respuestas", fr: "Modifier mes réponses" })}</Button>
          </>
        }
      >
        {saved.length > 0 ? (
          <p>{t({ pt: "Guardou:", en: "You saved:", es: "Ha guardado:", fr: "Vous avez gardé :" })} {saved.map((c, i) => <span key={c.slug}>{i ? ", " : ""}<a href={l(`/adotar/${c.slug}`)}>{c.name}</a></span>)}.</p>
        ) : (
          <p>{t({ pt: "Chegam gatos novos todas as semanas. Inscreva-se nas novidades no fundo da página para saber primeiro.", en: "New cats arrive every week. Sign up for news at the bottom of the page to hear first.", es: "Llegan gatos nuevos cada semana. Suscríbase a las novedades al final de la página para enterarse antes.", fr: "De nouveaux chats arrivent chaque semaine. Inscrivez-vous aux nouvelles en bas de la page pour être prévenu en premier." })}</p>
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
      <p className="small muted" aria-live="polite">{t({ pt: `Gato ${index + 1} de ${ranked.length}`, en: `Cat ${index + 1} of ${ranked.length}`, es: `Gato ${index + 1} de ${ranked.length}`, fr: `Chat ${index + 1} sur ${ranked.length}` })}</p>
      <img className="cat-profile__photo" src={photo.url} alt={photo.alt} width={800} height={600} />
      <div className="action-row">
        <h2 id="descobrir-nome">{cat.name}</h2>
        <span className={match.level === "super-match" ? "match-pill match-pill--super" : "match-pill"}>
          {match.level === "super-match" ? "★ Super match" : t({ pt: "✓ Combina consigo", en: "✓ A good match", es: "✓ Encaja con usted", fr: "✓ Vous correspond" })}
        </span>
      </div>
      <p className="muted">{ageLabel(lang, cat.ageYears)} · {sexLabel[lang][cat.sex]}</p>
      <p>{cat.summary}</p>
      <div>
        <p><strong>{t({ pt: "Porque combina consigo:", en: "Why it’s a match:", es: "Por qué encaja con usted:", fr: "Pourquoi il vous correspond :" })}</strong></p>
        <ul className="reasons">{match.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
      </div>
      <div className="action-row">
        <Button onClick={() => { if (!isFavorite(cat.slug)) toggle(cat.slug); next(); }} icon="♥">{t({ pt: "Gostava de conhecer", en: "I’d like to meet", es: "Me gustaría conocerlo", fr: "J’aimerais le rencontrer" })}</Button>
        <Button variant="secondary" onClick={next}>{t({ pt: "Ver outro gato", en: "See another cat", es: "Ver otro gato", fr: "Voir un autre chat" })}</Button>
      </div>
      <p><a href={l(`/adotar/${cat.slug}`)}>{t({ pt: `Ler a história d${pronoun} ${cat.name}`, en: `Read ${cat.name}’s story`, es: `Leer la historia de ${cat.name}`, fr: `Lire l’histoire de ${cat.name}` })}</a></p>
    </article>
  );
}
