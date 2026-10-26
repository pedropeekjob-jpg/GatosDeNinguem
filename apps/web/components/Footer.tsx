import { AnimatedLogo, Container } from "@gn/ui";
import { association, contactHref } from "@/lib/association";
import { langName, langs, locale, localize } from "@/lib/i18n/config";
import { i18n } from "@/lib/i18n/server";
import { NewsletterForm } from "./forms/NewsletterForm";

/** Provisional: the association has no TikTok account yet. Change it here once the account exists. */
const TIKTOK_URL = "https://www.tiktok.com/@gatosdeninguem";

/** Kept short on purpose: everything here also lives on its own page, so the footer only points the way. */
export function Footer() {
  const { gatil } = association;
  const { lang, t, l } = i18n();
  // The legal texts are only in Portuguese for now: say so next to their links.
  const inPortuguese = lang === "pt" ? null : <span className="site-footer__small"> ({t({ pt: "", en: "in Portuguese", es: "en portugués", fr: "en portugais" })})</span>;
  return (
    <footer className="site-footer">
      <Container>
        <div className="site-footer__grid">
          <div className="gn-stack gn-stack--s">
            <h2 className="site-footer__title">{t({ pt: "Receba as novidades", en: "Get our news", es: "Reciba las novedades", fr: "Recevez nos nouvelles" })}</h2>
            <NewsletterForm />
          </div>
          <nav aria-label={t({ pt: "Mais páginas", en: "More pages", es: "Más páginas", fr: "Autres pages" })} className="gn-stack gn-stack--s">
            <h2 className="site-footer__title">{t({ pt: "Mais páginas", en: "More pages", es: "Más páginas", fr: "Autres pages" })}</h2>
            <ul className="site-footer__links site-footer__links--two">
              <li><a href={l("/adotar/descobrir")}>{t({ pt: "Descobrir o meu gato", en: "Find my cat", es: "Descubrir mi gato", fr: "Trouver mon chat" })}</a></li>
              <li><a href={l("/finais-felizes")}>{t({ pt: "Finais felizes", en: "Happy endings", es: "Finales felices", fr: "Belles histoires" })}</a></li>
              <li><a href={l("/loja")}>{t({ pt: "Loja solidária", en: "Charity shop", es: "Tienda solidaria", fr: "Boutique solidaire" })}</a></li>
              <li><a href={l("/parceiros")}>{t({ pt: "Parceiros", en: "Partners", es: "Colaboradores", fr: "Partenaires" })}</a></li>
              <li><a href={l("/doar")}>{t({ pt: "Fazer um donativo", en: "Make a donation", es: "Hacer un donativo", fr: "Faire un don" })}</a></li>
              <li><a href={l("/sobre")}>{t({ pt: "Sobre nós", en: "About us", es: "Sobre nosotros", fr: "À propos" })}</a></li>
            </ul>
          </nav>
          <div className="gn-stack gn-stack--s">
            <h2 className="site-footer__title">{t({ pt: "Onde estamos", en: "Where we are", es: "Dónde estamos", fr: "Où nous trouver" })}</h2>
            <address className="site-footer__address">
              <span>{gatil.lines.join(", ")}.</span>
              <span className="site-footer__small">{t({ pt: gatil.visits, en: "Visits by appointment only", es: "Visitas solo con cita previa", fr: "Visites uniquement sur rendez-vous" })}.</span>
              <span className="site-footer__inline">
                <a href={gatil.mapUrl} rel="noopener" target="_blank">{t({ pt: "Ver no mapa", en: "See on the map", es: "Ver en el mapa", fr: "Voir sur la carte" })}<span className="gn-sr-only"> {t({ pt: "(abre o Google Maps)", en: "(opens Google Maps)", es: "(abre Google Maps)", fr: "(ouvre Google Maps)" })}</span></a>
                <a href={l(contactHref())}>{t({ pt: "Fale connosco", en: "Contact us", es: "Contacte con nosotros", fr: "Nous contacter" })}</a>
              </span>
            </address>
            <ul className="social-links" aria-label={t({ pt: "Siga-nos", en: "Follow us", es: "Síganos", fr: "Suivez-nous" })}>
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
              <li>
                <a href={TIKTOK_URL} rel="noopener" aria-label="TikTok" title="TikTok">
                  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M16.6 3h-3.1v12.3a2.7 2.7 0 1 1-2.7-2.7c.3 0 .5 0 .8.1V9.5a5.9 5.9 0 1 0 5 5.8V9.1a7.6 7.6 0 0 0 4.4 1.4V7.4A4.4 4.4 0 0 1 16.6 3z" fill="currentColor" /></svg>
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="site-footer__bottom">
          <AnimatedLogo size={48} className="site-footer__logo" />
          <div className="gn-stack gn-stack--s">
            <nav aria-label={t({ pt: "Informação legal", en: "Legal information", es: "Información legal", fr: "Informations légales" })} className="site-footer__legal">
              <span>© {association.name} · NIF {association.nif}</span>
              <a href="/privacidade" hrefLang="pt-PT">{t({ pt: "Política de privacidade", en: "Privacy policy", es: "Política de privacidad", fr: "Politique de confidentialité" })}{inPortuguese}</a>
              <a href="/cookies" hrefLang="pt-PT">{t({ pt: "Política de cookies", en: "Cookie policy", es: "Política de cookies", fr: "Politique de cookies" })}{inPortuguese}</a>
              <a href="https://www.livroreclamacoes.pt" rel="noopener">{t({ pt: "Livro de reclamações", en: "Complaints book", es: "Libro de reclamaciones", fr: "Livre de réclamations" })}</a>
            </nav>
            <nav aria-label={t({ pt: "Idioma", en: "Language", es: "Idioma", fr: "Langue" })} className="site-footer__langs">
              {langs.map((x) => (
                <a key={x} href={localize("/", x)} hrefLang={locale[x]} lang={locale[x]} aria-current={x === lang ? "true" : undefined}>{langName[x]}</a>
              ))}
            </nav>
            <p className="site-footer__small">
              {t({ pt: "Litígios de consumo", en: "Consumer disputes", es: "Litigios de consumo", fr: "Litiges de consommation" })}: <a href="https://www.ciab.pt" rel="noopener">CIAB – Tribunal Arbitral de Consumo</a> (Braga) · <a href="https://www.consumidor.gov.pt" rel="noopener">Portal do Consumidor</a>
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
