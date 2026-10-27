import { IconPaw } from "@gn/ui";
import { i18n } from "@/lib/i18n/server";

/** Tells first-time visitors, above the fold, that helping earns Patinhas and where to learn more. */
export function PatinhasTeaser() {
  const { t, l } = i18n();
  return (
    <aside className="patinhas-teaser" aria-labelledby="patinhas-teaser">
      <span className="patinhas-teaser__icon"><IconPaw /></span>
      <div className="patinhas-teaser__text">
        <p id="patinhas-teaser" className="patinhas-teaser__title">{t({ pt: "Cada ajuda vale Patinhas", en: "Every bit of help earns Patinhas", es: "Cada ayuda vale Patinhas", fr: "Chaque geste rapporte des Patinhas" })}</p>
        <p className="patinhas-teaser__body">
          {/* Phones get the one-line version; only one of the two is ever shown (and read aloud). */}
          <span className="patinhas-teaser__short">{t({ pt: "Pontos que se trocam por vantagens.", en: "Points you can swap for perks.", es: "Puntos que se cambian por ventajas.", fr: "Des points à échanger contre des avantages." })}</span>
          <span className="patinhas-teaser__long">{t({
            pt: "São os pontos de quem ajuda: partilhar um gato, doar ou fazer um turno no gatil. Sobem o seu nível e trocam-se por vantagens nos parceiros.",
            en: "Points for everyone who helps: sharing a cat, donating or doing a shift at the shelter. They raise your level and can be swapped for perks at our partners.",
            es: "Son los puntos de quien ayuda: compartir un gato, donar o hacer un turno en el refugio. Suben su nivel y se cambian por ventajas en los colaboradores.",
            fr: "Les points de ceux qui aident : partager un chat, faire un don ou un créneau au refuge. Ils font monter votre niveau et s’échangent contre des avantages chez nos partenaires.",
          })}</span>{" "}
          {/* On phones the whole card is the link (with an arrow); the words stay for screen readers. */}
          <a href={l("/patinhas")} className="patinhas-teaser__link"><span className="patinhas-teaser__link-text">{t({ pt: "Como funcionam as Patinhas", en: "How Patinhas work", es: "Cómo funcionan las Patinhas", fr: "Comment marchent les Patinhas" })}</span></a>
        </p>
      </div>
    </aside>
  );
}
