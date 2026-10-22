import { IconPaw } from "@gn/ui";

/** Tells first-time visitors, above the fold, that helping earns Patinhas and where to learn more. */
export function PatinhasTeaser() {
  return (
    <aside className="patinhas-teaser" aria-labelledby="patinhas-teaser">
      <span className="patinhas-teaser__icon"><IconPaw /></span>
      <div className="patinhas-teaser__text">
        <p id="patinhas-teaser" className="patinhas-teaser__title">Cada ajuda vale Patinhas</p>
        <p className="patinhas-teaser__body">
          {/* Phones get the one-line version; only one of the two is ever shown (and read aloud). */}
          <span className="patinhas-teaser__short">Pontos que se trocam por vantagens.</span>
          <span className="patinhas-teaser__long">São os pontos de quem ajuda: partilhar um gato, doar ou fazer um turno no gatil. Sobem o seu nível e trocam-se por vantagens nos parceiros.</span>{" "}
          {/* On phones the whole card is the link (with an arrow); the words stay for screen readers. */}
          <a href="/patinhas" className="patinhas-teaser__link"><span className="patinhas-teaser__link-text">Como funcionam as Patinhas</span></a>
        </p>
      </div>
    </aside>
  );
}
