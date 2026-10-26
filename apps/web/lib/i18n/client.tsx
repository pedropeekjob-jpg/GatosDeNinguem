"use client";
import { createContext, useContext, type ReactNode } from "react";
import { ptUiText, UiTextProvider, type UiText } from "@gn/ui";
import type { Lang } from "./config";
import { i18nFor, type I18n } from "./t";

const LangContext = createContext<Lang>("pt");

/** What the shared components (menus, windows, photo carousels) say, in each language. */
const uiText: Record<Lang, UiText> = {
  pt: ptUiText,
  en: {
    mainMenu: "Main menu",
    more: "More",
    menu: "Menu",
    inThisSection: "(you are in this section)",
    news: "new",
    skipToContent: "Skip to content",
    youAreHere: "You are here",
    close: "Close",
    share: "Share",
    copyPrompt: "Copy this address:",
    copied: "Copied",
    copyLink: "Copy link",
    linkCopied: "Link copied",
    step: (step, total) => `Step ${step} of ${total}`,
    back: "Back",
    continue: "Continue",
    carousel: "carousel",
    slide: "slide",
    photos: "Photos",
    previousPhoto: "Previous photo",
    nextPhoto: "Next photo",
    stopAutoplay: "Stop the slideshow",
    startAutoplay: "Play the slideshow",
    slideOf: (i, count) => `${i} of ${count}`,
    photoOf: (i, count) => `Photo ${i} of ${count}`,
  },
  es: {
    mainMenu: "Menú principal",
    more: "Más",
    menu: "Menú",
    inThisSection: "(está en esta sección)",
    news: "novedades",
    skipToContent: "Saltar al contenido",
    youAreHere: "Está aquí",
    close: "Cerrar",
    share: "Compartir",
    copyPrompt: "Copie esta dirección:",
    copied: "Copiado",
    copyLink: "Copiar enlace",
    linkCopied: "Enlace copiado",
    step: (step, total) => `Paso ${step} de ${total}`,
    back: "Volver",
    continue: "Continuar",
    carousel: "carrusel",
    slide: "diapositiva",
    photos: "Fotografías",
    previousPhoto: "Foto anterior",
    nextPhoto: "Foto siguiente",
    stopAutoplay: "Detener el pase automático",
    startAutoplay: "Pasar automáticamente",
    slideOf: (i, count) => `${i} de ${count}`,
    photoOf: (i, count) => `Foto ${i} de ${count}`,
  },
  fr: {
    mainMenu: "Menu principal",
    more: "Plus",
    menu: "Menu",
    inThisSection: "(vous êtes dans cette rubrique)",
    news: "nouveautés",
    skipToContent: "Aller au contenu",
    youAreHere: "Vous êtes ici",
    close: "Fermer",
    share: "Partager",
    copyPrompt: "Copiez cette adresse :",
    copied: "Copié",
    copyLink: "Copier le lien",
    linkCopied: "Lien copié",
    step: (step, total) => `Étape ${step} sur ${total}`,
    back: "Retour",
    continue: "Continuer",
    carousel: "carrousel",
    slide: "diapositive",
    photos: "Photos",
    previousPhoto: "Photo précédente",
    nextPhoto: "Photo suivante",
    stopAutoplay: "Arrêter le défilement",
    startAutoplay: "Défilement automatique",
    slideOf: (i, count) => `${i} sur ${count}`,
    photoOf: (i, count) => `Photo ${i} sur ${count}`,
  },
};

/** Gives client components the page's language; set once per page by the site layout. */
export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return (
    <LangContext.Provider value={lang}>
      <UiTextProvider text={uiText[lang]}>{children}</UiTextProvider>
    </LangContext.Provider>
  );
}

/** Client components: the page's language, with t() and l() as on the server. */
export function useI18n(): I18n {
  return i18nFor(useContext(LangContext));
}

/** Outside React (form helpers): the language of the page on screen. */
export function documentLang(): Lang {
  if (typeof document === "undefined") return "pt";
  const tag = document.documentElement.lang.slice(0, 2);
  return tag === "en" || tag === "es" || tag === "fr" ? tag : "pt";
}
