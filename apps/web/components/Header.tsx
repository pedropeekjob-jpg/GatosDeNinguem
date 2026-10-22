"use client";
import { usePathname } from "next/navigation";
import { IconHand, IconHeart, IconHome, IconNews, IconPaw, SiteHeader, TextSizeControl } from "@gn/ui";

const items = [
  { href: "/", label: "Início", icon: <IconHome /> },
  { href: "/adotar", label: "Adotar", icon: <IconHeart /> },
  { href: "/ajudar", label: "Ajudar", icon: <IconHand /> },
  { href: "/noticias", label: "Notícias", icon: <IconNews /> },
  { href: "/sobre", label: "Sobre nós", icon: <IconPaw /> },
];

export function Header() {
  const pathname = usePathname() ?? "/";
  return (
    <SiteHeader
      homeHref="/"
      currentPath={pathname}
      items={items}
      tabBar
      urgent={{ href: "/sos", label: "Encontrei um gato" }}
      tools={<TextSizeControl />}
      brand={
<img className="gn-header__logo" src="/logo.svg" alt="Gatos de Ninguém, página inicial" width={81} height={84} />
      }
    />
  );
}
