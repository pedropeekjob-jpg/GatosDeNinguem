"use client";
import { usePathname } from "next/navigation";
import { SiteHeader, TextSizeControl } from "@gn/ui";

const items = [
  { href: "/", label: "Início" },
  { href: "/adotar", label: "Adotar" },
  { href: "/ajudar", label: "Ajudar" },
  { href: "/noticias", label: "Notícias" },
  { href: "/sobre", label: "Sobre nós" },
];

export function Header() {
  const pathname = usePathname() ?? "/";
  return (
    <SiteHeader
      homeHref="/"
      currentPath={pathname}
      items={items}
      urgent={{ href: "/sos", label: "Encontrei um gato" }}
      tools={<TextSizeControl />}
      brand={
<img className="gn-header__logo" src="/logo.svg" alt="Gatos de Ninguém, página inicial" width={81} height={84} />
      }
    />
  );
}
