import { IconPaw } from "@gn/ui";

/** Tells first-time visitors, above the fold, that helping earns Patinhas and where to learn more. */
export function PatinhasTeaser() {
  return (
    <aside className="patinhas-teaser" aria-labelledby="patinhas-teaser">
      <span className="patinhas-teaser__icon"><IconPaw /></span>
      <div className="patinhas-teaser__text">
        <p id="patinhas-teaser" className="patinhas-teaser__title">Cada ajuda vale Patinhas</p>
        <p className="patinhas-teaser__body">
          São os pontos de quem ajuda: partilhar um gato, doar ou fazer um turno no gatil. Sobem o seu nível e trocam-se por vantagens nos parceiros.{" "}
          <a href="/patinhas">Como funcionam as Patinhas</a>
        </p>
      </div>
    </aside>
  );
}
