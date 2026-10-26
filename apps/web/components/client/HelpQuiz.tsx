"use client";
import { useEffect, useState } from "react";
import { recommendHelp, type HelpAnswers } from "@gn/domain";
import { Button, Card, ChoiceList, Grid, NextStep, StepWizard } from "@gn/ui";
import { contaClient, readSignedIn } from "@/lib/conta";
import { features } from "@/lib/features";
import { useI18n } from "@/lib/i18n/client";
import { helpActions } from "@/lib/i18n/labels";
import type { I18n } from "@/lib/i18n/t";

/** Finishing the quiz counts once for Patinhas when signed in; otherwise a gentle invitation. */
function QuizPatinhas() {
  const { t } = useI18n();
  const [result, setResult] = useState<"convite" | "ganhou" | null>(null);
  useEffect(() => {
    if (!readSignedIn()) return setResult("convite");
    void contaClient().finishQuiz().then((r) => setResult(r.counted ? "ganhou" : null));
  }, []);
  if (result === "ganhou") return <p className="small" role="status">{t({ pt: "Ganhou 10 Patinhas por fazer o questionário.", en: "You earned 10 Patinhas for doing the quiz.", es: "Ha ganado 10 Patinhas por hacer el cuestionario.", fr: "Vous avez gagné 10 Patinhas en répondant au questionnaire." })}</p>;
  if (result === "convite") return <p className="small muted">{t({ pt: `Sabia que cada ajuda dá Patinhas${features.trocas ? ", que pode trocar nos parceiros" : ""}?`, en: `Did you know every bit of help earns Patinhas${features.trocas ? ", which you can exchange at our partners" : ""}?`, es: `¿Sabía que cada ayuda da Patinhas${features.trocas ? ", que puede canjear en nuestros socios" : ""}?`, fr: `Saviez-vous que chaque aide rapporte des Patinhas${features.trocas ? ", à échanger chez nos partenaires" : ""} ?` })} <a href="/patinhas">{t({ pt: "Saiba como", en: "Find out how", es: "Descubra cómo", fr: "Découvrez comment" })}</a>.</p>;
  return null;
}

const questions = ({ t }: I18n): { key: keyof HelpAnswers; title: string; options: { value: string; label: string }[] }[] => [
  {
    key: "time",
    title: t({ pt: "Quanto tempo tem por mês?", en: "How much time do you have each month?", es: "¿Cuánto tiempo tiene al mes?", fr: "Combien de temps avez-vous par mois ?" }),
    options: [
      { value: "nenhum", label: t({ pt: "Quase nenhum", en: "Hardly any", es: "Casi nada", fr: "Presque pas" }) },
      { value: "algumas-horas", label: t({ pt: "Algumas horas", en: "A few hours", es: "Algunas horas", fr: "Quelques heures" }) },
      { value: "muito", label: t({ pt: "Bastante tempo", en: "Quite a lot", es: "Bastante tiempo", fr: "Pas mal de temps" }) },
    ],
  },
  {
    key: "money",
    title: t({ pt: "Pode contribuir com dinheiro?", en: "Can you give money?", es: "¿Puede contribuir con dinero?", fr: "Pouvez-vous donner de l’argent ?" }),
    options: [
      { value: "nao", label: t({ pt: "Agora não", en: "Not right now", es: "Ahora no", fr: "Pas pour l’instant" }) },
      { value: "pouco", label: t({ pt: "Um pouco", en: "A little", es: "Un poco", fr: "Un peu" }) },
      { value: "sim", label: t({ pt: "Sim, todos os meses", en: "Yes, every month", es: "Sí, todos los meses", fr: "Oui, tous les mois" }) },
    ],
  },
  {
    key: "space",
    title: t({ pt: "Tem espaço em casa para um gato?", en: "Do you have room at home for a cat?", es: "¿Tiene espacio en casa para un gato?", fr: "Avez-vous de la place chez vous pour un chat ?" }),
    options: [
      { value: "nao", label: t({ pt: "Não", en: "No", es: "No", fr: "Non" }) },
      { value: "sim", label: t({ pt: "Sim", en: "Yes", es: "Sí", fr: "Oui" }) },
    ],
  },
];

export function HelpQuiz() {
  const i18n = useI18n();
  const { lang, t, l } = i18n;
  const qs = questions(i18n);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<HelpAnswers>>({});

  if (step >= qs.length) {
    const recommended = recommendHelp(answers as HelpAnswers, { amigo: features.amigo });
    const inLang = (a: typeof recommended.main) => ({ ...a, ...helpActions[lang][a.id], href: l(a.href) });
    const main = inLang(recommended.main);
    const alternatives = recommended.alternatives.map(inLang);
    return (
      <div className="gn-stack gn-stack--m">
        <NextStep
          title={t({ pt: `A nossa sugestão: ${main.title}`, en: `Our suggestion: ${main.title}`, es: `Nuestra sugerencia: ${main.title}`, fr: `Notre suggestion : ${main.title}` })}
          actions={
            <>
              <Button href={main.href}>{t({ pt: "Quero fazer isto", en: "I want to do this", es: "Quiero hacerlo", fr: "Je veux le faire" })}</Button>
              <Button variant="quiet" onClick={() => { setStep(0); setAnswers({}); }}>{t({ pt: "Responder outra vez", en: "Answer again", es: "Responder otra vez", fr: "Répondre à nouveau" })}</Button>
            </>
          }
        >
          <p>{main.description}</p>
          {features.patinhas ? <QuizPatinhas /> : null}
        </NextStep>
        {alternatives.length > 0 ? (
          <>
            <h3>{t({ pt: "Também pode", en: "You could also", es: "También puede", fr: "Vous pouvez aussi" })}</h3>
            <Grid>{alternatives.map((a) => <Card key={a.id} title={a.title} href={a.href}><p>{a.description}</p></Card>)}</Grid>
          </>
        ) : null}
      </div>
    );
  }

  const q = qs[step]!;
  const value = answers[q.key];
  return (
    <StepWizard
      step={step + 1}
      total={qs.length}
      title={q.title}
      onBack={() => setStep((s) => s - 1)}
      onNext={() => setStep((s) => s + 1)}
      nextDisabled={!value}
      nextLabel={step === qs.length - 1 ? t({ pt: "Ver sugestão", en: "See suggestion", es: "Ver sugerencia", fr: "Voir la suggestion" }) : t({ pt: "Continuar", en: "Continue", es: "Continuar", fr: "Continuer" })}
    >
      <ChoiceList
        name={`ajuda-${q.key}`}
        legend={<span className="gn-sr-only">{q.title}</span>}
        options={q.options}
        value={value}
        onChange={(v) => setAnswers((a) => ({ ...a, [q.key]: v }))}
      />
    </StepWizard>
  );
}
