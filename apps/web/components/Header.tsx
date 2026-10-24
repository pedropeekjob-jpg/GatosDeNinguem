"use client";
import { usePathname } from "next/navigation";
import { AccountLink } from "./client/AccountLink";
import { IconGift, IconHand, IconHeart, IconHome, IconNews, SiteHeader } from "@gn/ui";

// Adopting and donating come first and stand out; every other page keeps its place.
// The phone tab bar holds five items, so "Sobre nós" lives in the footer there.
const items = [
  { href: "/", label: "Início", icon: <IconHome /> },
  { href: "/adotar", label: "Adotar", icon: <IconHeart />, key: true },
  { href: "/doar", label: "Doar", icon: <IconGift />, key: true },
  { href: "/ajudar", label: "Ajudar", icon: <IconHand /> },
  { href: "/finais-felizes", label: "Finais felizes", wideOnly: true },
  { href: "/loja", label: "Loja", wideOnly: true },
  { href: "/noticias", label: "Notícias", icon: <IconNews /> },
  { href: "/sobre", label: "Sobre nós", wideOnly: true },
];

export function Header() {
  const pathname = usePathname() ?? "/";
  return (
    <SiteHeader
      homeHref="/"
      currentPath={pathname}
      items={items}
      tabBar
      tools={<AccountLink />}
      urgent={{ href: "/sos", label: "Encontrei um gato" }}
      brand={
<img className="gn-header__logo" src="/logo.svg" alt="Gatos de Ninguém, página inicial" width={81} height={84} />
      }
    />
  );
}
