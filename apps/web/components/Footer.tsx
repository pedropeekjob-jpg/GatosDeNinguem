import { Container } from "@gn/ui";
import { NewsletterForm } from "./forms/NewsletterForm";

export function Footer() {
  return (
    <footer className="site-footer">
      <Container>
        <div className="site-footer__brand">
          <img src="/logo.svg" alt="Gatos de Ninguém" width={77} height={80} />
          <p>Resgatamos, tratamos e encontramos famílias para os gatos de rua de Viana do Castelo.</p>
        </div>
        <div className="site-footer__grid">
          <div className="gn-stack gn-stack--s">
            <h2 className="site-footer__title">Receba as novidades</h2>
            <p>Um email por mês com os gatos que procuram casa e como pode ajudar.</p>
            <NewsletterForm />
          </div>
          <nav aria-label="Mais páginas" className="gn-stack gn-stack--s">
            <h2 className="site-footer__title">Mais páginas</h2>
            <ul className="site-footer__links">
              <li><a href="/adotar/descobrir">Descobrir o meu gato</a></li>
              <li><a href="/finais-felizes">Finais felizes</a></li>
              <li><a href="/parceiros">Parceiros</a></li>
              <li><a href="/sos">Encontrei um gato</a></li>
              <li><a href="/ajudar#doar">Fazer um donativo</a></li>
            </ul>
          </nav>
          <div className="gn-stack gn-stack--s">
            <h2 className="site-footer__title">Siga-nos</h2>
            <ul className="site-footer__links">
              <li><a href="https://www.facebook.com/GatosdeNinguemViana/" rel="noopener">Facebook</a></li>
              <li><a href="https://www.instagram.com/gatosdeninguem/" rel="noopener">Instagram</a></li>
            </ul>
            <p className="site-footer__small">Associação Gatos de Ninguém, Viana do Castelo. Desde 2014.</p>
            <p className="site-footer__small">Maus tratos e abandono são crime (Lei 69/2014). Denuncie à PSP ou GNR.</p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
