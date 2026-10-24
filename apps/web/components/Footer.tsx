import { AnimatedLogo, Container } from "@gn/ui";
import { association } from "@/lib/association";
import { NewsletterForm } from "./forms/NewsletterForm";

/** Kept short on purpose: everything here also lives on its own page, so the footer only points the way. */
export function Footer() {
  const { gatil } = association;
  return (
    <footer className="site-footer">
      <Container>
        <div className="site-footer__grid">
          <div className="gn-stack gn-stack--s">
            <h2 className="site-footer__title">Receba as novidades</h2>
            <NewsletterForm />
          </div>
          <nav aria-label="Mais páginas" className="gn-stack gn-stack--s">
            <h2 className="site-footer__title">Mais páginas</h2>
            <ul className="site-footer__links site-footer__links--two">
              <li><a href="/adotar/descobrir">Descobrir o meu gato</a></li>
              <li><a href="/finais-felizes">Finais felizes</a></li>
              <li><a href="/loja">Loja solidária</a></li>
              <li><a href="/parceiros">Parceiros</a></li>
              <li><a href="/sos">Encontrei um gato</a></li>
              <li><a href="/ajudar#doar">Fazer um donativo</a></li>
            </ul>
          </nav>
          <div className="gn-stack gn-stack--s">
            <h2 className="site-footer__title">Onde estamos</h2>
            <address className="site-footer__address">
              <span>{gatil.lines.join(", ")}.</span>
              <span className="site-footer__small">{gatil.visits}.</span>
              <span className="site-footer__inline">
                <a href={gatil.mapUrl} rel="noopener" target="_blank">Ver no mapa<span className="gn-sr-only"> (abre o Google Maps)</span></a>
                <a href={`mailto:${association.email}`}>{association.email}</a>
              </span>
            </address>
            <ul className="social-links" aria-label="Siga-nos">
              <li>
                <a href="https://www.facebook.com/GatosdeNinguemViana/" rel="noopener" aria-label="Facebook" title="Facebook">
                  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.9v3h2.6V21h3z" fill="currentColor" /></svg>
                </a>
              </li>
              <li>
                <a href="https://www.instagram.com/gatosdeninguem/" rel="noopener" aria-label="Instagram" title="Instagram">
                  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" /></svg>
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="site-footer__bottom">
          <AnimatedLogo size={48} className="site-footer__logo" />
          <div className="gn-stack gn-stack--s">
            <nav aria-label="Informação legal" className="site-footer__legal">
              <span>© {association.name} · NIF {association.nif}</span>
              <a href="/privacidade">Política de privacidade</a>
              <a href="/cookies">Política de cookies</a>
              <a href="https://www.livroreclamacoes.pt" rel="noopener">Livro de reclamações</a>
            </nav>
            <p className="site-footer__small">
              Litígios de consumo: <a href="https://www.ciab.pt" rel="noopener">CIAB – Tribunal Arbitral de Consumo</a> (Braga) · <a href="https://www.consumidor.gov.pt" rel="noopener">Portal do Consumidor</a>
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
