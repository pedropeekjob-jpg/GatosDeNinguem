"use client";
import { useRef, useState } from "react";
import { Button, ChoiceList, Notice } from "@gn/ui";
import { sosTree } from "@/lib/sos";

/** One question at a time, then clear numbered steps. */
export function SosGuide() {
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
        <Notice tone={node.urgent ? "error" : "info"} title={node.urgent ? "Urgente" : "O que fazer"}>
          <h2 ref={headingRef} tabIndex={-1} className="gn-plain-heading">{node.title}</h2>
        </Notice>
        <ol className="gn-stack gn-stack--s">{node.steps.map((s) => <li key={s}>{s}</li>)}</ol>
        <p><strong>Contactar a associação:</strong> mensagem no <a href="https://www.facebook.com/GatosdeNinguemViana/">Facebook</a> ou no <a href="https://www.instagram.com/gatosdeninguem/">Instagram</a>.</p>
        <p className="small muted">Maus tratos ou abandono: PSP ou GNR. Animal atropelado na estrada: Bombeiros. Colónias de rua: Junta de Freguesia ou Câmara Municipal.</p>
        <div className="action-row">
          <Button variant="secondary" onClick={() => go(path.slice(0, -1))}>Voltar</Button>
          <Button variant="quiet" onClick={() => go(["inicio"])}>Começar de novo</Button>
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
        {path.length > 1 ? <Button variant="secondary" onClick={() => go(path.slice(0, -1))}>Voltar</Button> : null}
        <Button type="submit" disabled={!choice}>Continuar</Button>
      </div>
    </form>
  );
}
