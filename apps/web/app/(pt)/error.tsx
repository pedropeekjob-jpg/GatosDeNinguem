"use client";
import { useEffect } from "react";
import { AnimatedLogo, Button, Container } from "@gn/ui";
import { useI18n } from "@/lib/i18n/client";

/** Shown instead of a crash when a page cannot load its content (for example, the API is restarting). */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t, l } = useI18n();
  useEffect(() => { console.error(error); }, [error]);
  return (
    <Container narrow>
      <div className="gn-stack gn-stack--m page-hero" role="alert">
        <AnimatedLogo variant="loader" size={140} />
        <h1>{t({ pt: "Esta página não abriu agora", en: "This page didn’t open just now", es: "Esta página no se ha abierto ahora", fr: "Cette page ne s’est pas ouverte" })}</h1>
        <p className="gn-lead">{t({ pt: "Não conseguimos ir buscar a informação mais recente. Costuma resolver-se em poucos segundos.", en: "We couldn’t fetch the latest information. It usually sorts itself out in a few seconds.", es: "No hemos podido obtener la información más reciente. Suele resolverse en pocos segundos.", fr: "Nous n’avons pas pu récupérer les dernières informations. Cela se règle en général en quelques secondes." })}</p>
        <div className="action-row">
          <Button onClick={reset}>{t({ pt: "Tentar outra vez", en: "Try again", es: "Intentarlo de nuevo", fr: "Réessayer" })}</Button>
          <Button href={l("/")} variant="secondary">{t({ pt: "Ir para o início", en: "Go to the home page", es: "Ir al inicio", fr: "Aller à l’accueil" })}</Button>
        </div>
      </div>
    </Container>
  );
}
