/** The adoption, step by step: a numbered list, because the order is what people need to know. */
export function AdoptionSteps({ steps }: { steps: readonly { title: string; text: string }[] }) {
  return (
    <ol className="adoption-steps">
      {steps.map((s) => (
        <li key={s.title}>
          <strong>{s.title}</strong>
          <span>{s.text}</span>
        </li>
      ))}
    </ol>
  );
}
