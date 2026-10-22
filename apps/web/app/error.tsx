"use client";
import { useEffect } from "react";
import { AnimatedLogo, Button, Container } from "@gn/ui";

/** Shown instead of a crash when a page cannot load its content (for example, the API is restarting). */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <Container narrow>
      <div className="gn-stack gn-stack--m page-hero" role="alert">
        <AnimatedLogo variant="loader" size={140} />
        <h1>Esta página não abriu agora</h1>
        <p className="gn-lead">Não conseguimos ir buscar a informação mais recente. Costuma resolver-se em poucos segundos.</p>
        <div className="action-row">
          <Button onClick={reset}>Tentar outra vez</Button>
          <Button href="/" variant="secondary">Ir para o início</Button>
          <Button href="/sos" variant="urgent">Encontrei um gato</Button>
        </div>
      </div>
    </Container>
  );
}
