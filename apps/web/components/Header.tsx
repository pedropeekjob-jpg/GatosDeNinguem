"use client";
import { usePathname, useRouter } from "next/navigation";
import { AccountLink } from "./client/AccountLink";
import { features } from "@/lib/features";
import { IconGift, IconHeart, IconHome, SiteHeader, type NavItem } from "@gn/ui";

// Four sections at most, so the menu reads at a glance. Adopting and donating come first and stand out.
// Every page keeps its place: wide screens open each section's pages from the top menu, phones from "Mais".
const sections: NavItem[] = [
  {
    href: "/adotar", label: "Adotar", key: true, children: [
      { href: "/adotar", label: "Gatos para adoção", description: "Conheça os gatos que procuram casa" },
      { href: "/adotar/descobrir", label: "Descobrir o meu gato", description: "Algumas perguntas para encontrar o gato certo" },
      { href: "/adotar/perguntas", label: "Como funciona a adoção", description: "Os passos e as perguntas mais comuns" },
      { href: "/finais-felizes", label: "Finais felizes", description: "Gatos que já encontraram família" },
    ],
  },
  {
    href: "/doar", label: "Doar", key: true, children: [
      { href: "/doar", label: "Fazer um donativo", description: "Transferência e outras formas de dar" },
      { href: "/apadrinhar", label: "Apadrinhar um gato", description: "Ajude um gato todos os meses" },
      { href: "/loja", label: "Loja solidária", description: "Compre e ajude o gatil" },
    ],
  },
  {
    href: "/ajudar", label: "Ajudar", children: [
      { href: "/ajudar", label: "Todas as formas de ajudar", description: "Veja o que pode fazer pelos gatos" },
      { href: "/ajudar/voluntariado", label: "Ser voluntário", description: "Dar uma mão no gatil" },
      { href: "/ajudar/familia-temporaria", label: "Família temporária", description: "Receber um gato em casa por uns tempos" },
      { href: "/ajudar/turnos", label: "Turnos no gatil", description: "Escolher um turno livre" },
      ...(features.amigo ? [{ href: "/ajudar/amigo", label: "Ser Amigo", description: "Quota anual, com descontos nos parceiros" }] : []),
      ...(features.patinhas ? [{ href: "/patinhas", label: "Patinhas", description: "Cada ajuda dá Patinhas" }] : []),
    ],
  },
  {
    href: "/sobre", label: "Sobre nós", children: [
      { href: "/sobre", label: "Quem somos", description: "A associação e o gatil" },
      { href: "/noticias", label: "Notícias", description: "Eventos e novidades do gatil" },
      { href: "/parceiros", label: "Parceiros", description: "Quem nos apoia" },
    ],
  },
];

// The phone tab bar: the home page and the two main paths, then "Mais" with everything else.
const tabs: NavItem[] = [
  { href: "/", label: "Início", icon: <IconHome /> },
  { href: "/adotar", label: "Adotar", icon: <IconHeart />, key: true },
  { href: "/doar", label: "Doar", icon: <IconGift />, key: true },
];

export function Header() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  return (
    <SiteHeader
      homeHref="/"
      currentPath={pathname}
      items={sections}
      tabs={tabs}
      onNavigate={(href) => router.push(href)}
      tools={<AccountLink />}
      brand={
<img className="gn-header__logo" src="/logo.svg" alt="Gatos de Ninguém, página inicial" width={81} height={84} />
      }
    />
  );
}
