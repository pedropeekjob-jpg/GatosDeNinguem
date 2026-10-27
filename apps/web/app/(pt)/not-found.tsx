import { AnimatedLogo, Button, Container } from "@gn/ui";
import { i18n } from "@/lib/i18n/server";

export default function NotFound() {
  const { t, l } = i18n();
  return (
    <Container narrow>
      <div className="gn-stack gn-stack--m page-hero">
        <AnimatedLogo size={180} />
        <h1>{t({ pt: "Não encontrámos esta página", en: "We couldn’t find this page", es: "No hemos encontrado esta página", fr: "Nous n’avons pas trouvé cette page" })}</h1>
        <p className="gn-lead">{t({ pt: "Pode ter mudado de endereço. Experimente uma destas:", en: "It may have moved. Try one of these:", es: "Puede que haya cambiado de dirección. Pruebe una de estas:", fr: "Elle a peut-être changé d’adresse. Essayez l’une de celles-ci :" })}</p>
        <div className="action-row">
          <Button href={l("/")}>{t({ pt: "Ir para o início", en: "Go to the home page", es: "Ir al inicio", fr: "Aller à l’accueil" })}</Button>
          <Button href={l("/adotar")} variant="secondary">{t({ pt: "Ver gatos para adoção", en: "See cats for adoption", es: "Ver gatos en adopción", fr: "Voir les chats à adopter" })}</Button>
          <Button href={l("/doar")} variant="secondary">{t({ pt: "Fazer um donativo", en: "Make a donation", es: "Hacer un donativo", fr: "Faire un don" })}</Button>
        </div>
      </div>
    </Container>
  );
}
