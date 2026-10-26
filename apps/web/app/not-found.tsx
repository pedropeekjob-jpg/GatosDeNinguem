import { AnimatedLogo, Button, Container } from "@gn/ui";

export default function NotFound() {
  return (
    <Container narrow>
      <div className="gn-stack gn-stack--m page-hero">
        <AnimatedLogo size={180} />
        <h1>Não encontrámos esta página</h1>
        <p className="gn-lead">Pode ter mudado de endereço. Experimente uma destas:</p>
        <div className="action-row">
          <Button href="/">Ir para o início</Button>
          <Button href="/adotar" variant="secondary">Ver gatos para adoção</Button>
          <Button href="/doar" variant="secondary">Fazer um donativo</Button>
        </div>
      </div>
    </Container>
  );
}
