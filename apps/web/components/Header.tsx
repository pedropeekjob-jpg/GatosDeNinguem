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
        <>
          <img src="/logo.svg" alt="" width={48} height={48} />
          <span>Gatos de Ninguém</span>
        </>
      }
    />
  );
}
