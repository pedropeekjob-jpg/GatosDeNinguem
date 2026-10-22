"use client";
import { useEffect, useState } from "react";
import { recommendHelp, type HelpAnswers } from "@gn/domain";
import { Button, Card, ChoiceList, Grid, NextStep, StepWizard } from "@gn/ui";
import { contaClient, readSignedIn } from "@/lib/conta";

/** Finishing the quiz counts once for Patinhas when signed in; otherwise a gentle invitation. */
function QuizPatinhas() {
  const [result, setResult] = useState<"convite" | "ganhou" | null>(null);
  useEffect(() => {
    if (!readSignedIn()) return setResult("convite");
    void contaClient().finishQuiz().then((r) => setResult(r.counted ? "ganhou" : null));
  }, []);
  if (result === "ganhou") return <p className="small" role="status">Ganhou 10 Patinhas por fazer o questionário.</p>;
  if (result === "convite") return <p className="small muted">Sabia que cada ajuda dá Patinhas, que pode trocar nos parceiros? <a href="/patinhas">Saiba como</a>.</p>;
  return null;
}

const questions = [
  {
    key: "time",
    title: "Quanto tempo tem por mês?",
    options: [
      { value: "nenhum", label: "Quase nenhum" },
      { value: "algumas-horas", label: "Algumas horas" },
      { value: "muito", label: "Bastante tempo" },
    ],
  },
  {
    key: "money",
    title: "Pode contribuir com dinheiro?",
    options: [
      { value: "nao", label: "Agora não" },
      { value: "pouco", label: "Um pouco" },
      { value: "sim", label: "Sim, todos os meses" },
    ],
  },
  {
    key: "space",
    title: "Tem espaço em casa para um gato?",
    options: [
      { value: "nao", label: "Não" },
      { value: "sim", label: "Sim" },
    ],
  },
] as const;

export function HelpQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<HelpAnswers>>({});

  if (step >= questions.length) {
    const { main, alternatives } = recommendHelp(answers as HelpAnswers);
    return (
      <div className="gn-stack gn-stack--m">
        <NextStep
          title={`A nossa sugestão: ${main.title}`}
          actions={
            <>
              <Button href={main.href}>Quero fazer isto</Button>
              <Button variant="quiet" onClick={() => { setStep(0); setAnswers({}); }}>Responder outra vez</Button>
            </>
          }
        >
          <p>{main.description}</p>
          <QuizPatinhas />
        </NextStep>
        {alternatives.length > 0 ? (
          <>
            <h3>Também pode</h3>
            <Grid>{alternatives.map((a) => <Card key={a.id} title={a.title} href={a.href}><p>{a.description}</p></Card>)}</Grid>
          </>
        ) : null}
      </div>
    );
  }

  const q = questions[step]!;
  const value = answers[q.key as keyof HelpAnswers];
  return (
    <StepWizard
      step={step + 1}
      total={questions.length}
      title={q.title}
      onBack={() => setStep((s) => s - 1)}
      onNext={() => setStep((s) => s + 1)}
      nextDisabled={!value}
      nextLabel={step === questions.length - 1 ? "Ver sugestão" : "Continuar"}
    >
      <ChoiceList
        name={`ajuda-${q.key}`}
        legend={<span className="gn-sr-only">{q.title}</span>}
        options={q.options.map((o) => ({ value: o.value as string, label: o.label }))}
        value={value}
        onChange={(v) => setAnswers((a) => ({ ...a, [q.key]: v }))}
      />
    </StepWizard>
  );
}
