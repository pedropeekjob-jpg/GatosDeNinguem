"use client";
import { createContext, useContext, type ReactNode } from "react";

/**
 * The few words the shared components say themselves (buttons, screen-reader names). Portuguese by default;
 * a site in another language passes its own with <UiTextProvider>.
 */
export type UiText = {
  mainMenu: string;
  more: string;
  menu: string;
  inThisSection: string;
  news: string;
  skipToContent: string;
  youAreHere: string;
  close: string;
  share: string;
  copyPrompt: string;
  copied: string;
  copyLink: string;
  linkCopied: string;
  step: (step: number, total: number) => string;
  back: string;
  continue: string;
  carousel: string;
  slide: string;
  photos: string;
  previousPhoto: string;
  nextPhoto: string;
  stopAutoplay: string;
  startAutoplay: string;
  slideOf: (i: number, count: number) => string;
  photoOf: (i: number, count: number) => string;
};

export const ptUiText: UiText = {
  mainMenu: "Menu principal",
  more: "Mais",
  menu: "Menu",
  inThisSection: "(está nesta secção)",
  news: "novidades",
  skipToContent: "Saltar para o conteúdo",
  youAreHere: "Está aqui",
  close: "Fechar",
  share: "Partilhar",
  copyPrompt: "Copie este endereço:",
  copied: "Copiado",
  copyLink: "Copiar endereço",
  linkCopied: "Endereço copiado",
  step: (step, total) => `Passo ${step} de ${total}`,
  back: "Voltar",
  continue: "Continuar",
  carousel: "carrossel",
  slide: "diapositivo",
  photos: "Fotografias",
  previousPhoto: "Fotografia anterior",
  nextPhoto: "Fotografia seguinte",
  stopAutoplay: "Parar a passagem automática",
  startAutoplay: "Passar automaticamente",
  slideOf: (i, count) => `${i} de ${count}`,
  photoOf: (i, count) => `Fotografia ${i} de ${count}`,
};

const Ctx = createContext<UiText>(ptUiText);

export function UiTextProvider({ text, children }: { text: UiText; children: ReactNode }) {
  return <Ctx.Provider value={text}>{children}</Ctx.Provider>;
}

export const useUiText = () => useContext(Ctx);
