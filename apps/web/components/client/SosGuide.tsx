"use client";
import { useRef, useState } from "react";
import { Button, ChoiceList, Notice } from "@gn/ui";
import { useI18n } from "@/lib/i18n/client";
import { sosTreeIn } from "@/lib/sos";

/** One question at a time, then clear numbered steps. */
export function SosGuide() {
  const { lang, t } = useI18n();
  const sosTree = sosTreeIn(lang);
  const [path, setPath] = useState<string[]>(["inicio"]);
  const [choice, setChoice] = useState<string>();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const node = sosTree[path[path.length - 1]!]!;

  const go = (next: string[]) => {
    setPath(next);
    setChoice(undefined);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  if (node.kind === "answer") {
    return (
      <div className="gn-stack gn-stack--m">
        <Notice tone={node.urgent ? "error" : "info"} title={node.urgent ? t({ pt: "Urgente", en: "Urgent", es: "Urgente", fr: "Urgent" }) : t({ pt: "O que fazer", en: "What to do", es: "Qué hacer", fr: "Que faire" })}>
          <h2 ref={headingRef} tabIndex={-1} className="gn-plain-heading">{node.title}</h2>
        </Notice>
        <ol className="gn-stack gn-stack--s">{node.steps.map((s) => <li key={s}>{s}</li>)}</ol>
        <p className="small muted">{t({
          pt: "Maus tratos ou abandono: PSP ou GNR. Animal atropelado na estrada: Bombeiros. Colónias de rua e recolha de animais: Junta de Freguesia ou Câmara Municipal.",
          en: "Cruelty or abandonment: PSP or GNR (police). Animal hit on the road: Bombeiros (fire brigade). Street colonies and animal collection: Junta de Freguesia or Câmara Municipal (local council).",
          es: "Maltrato o abandono: PSP o GNR (policía). Animal atropellado en la carretera: Bombeiros (bomberos). Colonias callejeras y recogida de animales: Junta de Freguesia o Câmara Municipal (ayuntamiento).",
          fr: "Maltraitance ou abandon : PSP ou GNR (police). Animal heurté sur la route : Bombeiros (pompiers). Colonies de rue et ramassage d’animaux : Junta de Freguesia ou Câmara Municipal (mairie).",
        })}</p>
        <div className="action-row">
          <Button variant="secondary" onClick={() => go(path.slice(0, -1))}>{t({ pt: "Voltar", en: "Back", es: "Volver", fr: "Retour" })}</Button>
          <Button variant="quiet" onClick={() => go(["inicio"])}>{t({ pt: "Começar de novo", en: "Start again", es: "Empezar de nuevo", fr: "Recommencer" })}</Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="gn-stack gn-stack--m"
      onSubmit={(e) => {
        e.preventDefault();
        const option = node.options.find((o) => o.next === choice);
        if (option) go([...path, option.next]);
      }}
    >
      <h2 ref={headingRef} tabIndex={-1} className="gn-plain-heading">{node.question}</h2>
      <ChoiceList name={`sos-${node.id}`} legend={<span className="gn-sr-only">{node.question}</span>} options={node.options.map((o) => ({ value: o.next, label: o.label }))} value={choice} onChange={setChoice} />
      <div className="action-row">
        {path.length > 1 ? <Button variant="secondary" onClick={() => go(path.slice(0, -1))}>{t({ pt: "Voltar", en: "Back", es: "Volver", fr: "Retour" })}</Button> : null}
        <Button type="submit" disabled={!choice}>{t({ pt: "Continuar", en: "Continue", es: "Continuar", fr: "Continuer" })}</Button>
      </div>
    </form>
  );
}
