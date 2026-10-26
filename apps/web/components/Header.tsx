"use client";
import { usePathname, useRouter } from "next/navigation";
import { AccountLink } from "./client/AccountLink";
import { LangSwitcher } from "./client/LangSwitcher";
import { features } from "@/lib/features";
import { useI18n } from "@/lib/i18n/client";
import type { I18n } from "@/lib/i18n/t";
import { IconGift, IconHeart, IconHome, SiteHeader, type NavItem } from "@gn/ui";

// Four sections at most, so the menu reads at a glance. Adopting and donating come first and stand out.
// Every page keeps its place: wide screens open each section's pages from the top menu, phones from "Mais".
function sections({ t, l }: I18n): NavItem[] {
  const page = (href: string, label: string, description: string): NavItem => ({ href: l(href), label, description });
  return [
    {
      href: l("/adotar"), label: t({ pt: "Adotar", en: "Adopt", es: "Adoptar", fr: "Adopter" }), key: true, children: [
        page("/adotar", t({ pt: "Gatos para adoção", en: "Cats for adoption", es: "Gatos en adopción", fr: "Chats à adopter" }), t({ pt: "Conheça os gatos que procuram casa", en: "Meet the cats looking for a home", es: "Conozca a los gatos que buscan casa", fr: "Les chats qui cherchent une maison" })),
        page("/adotar/descobrir", t({ pt: "Descobrir o meu gato", en: "Find my cat", es: "Descubrir mi gato", fr: "Trouver mon chat" }), t({ pt: "Algumas perguntas para encontrar o gato certo", en: "A few questions to find the right cat", es: "Unas preguntas para encontrar el gato adecuado", fr: "Quelques questions pour trouver le bon chat" })),
        page("/adotar/perguntas", t({ pt: "Como funciona a adoção", en: "How adoption works", es: "Cómo funciona la adopción", fr: "Comment se passe l’adoption" }), t({ pt: "Os passos e as perguntas mais comuns", en: "The steps and the most common questions", es: "Los pasos y las preguntas más frecuentes", fr: "Les étapes et les questions fréquentes" })),
        page("/finais-felizes", t({ pt: "Finais felizes", en: "Happy endings", es: "Finales felices", fr: "Belles histoires" }), t({ pt: "Gatos que já encontraram família", en: "Cats who have found a family", es: "Gatos que ya encontraron familia", fr: "Des chats qui ont trouvé une famille" })),
      ],
    },
    {
      href: l("/doar"), label: t({ pt: "Doar", en: "Donate", es: "Donar", fr: "Donner" }), key: true, children: [
        page("/doar", t({ pt: "Fazer um donativo", en: "Make a donation", es: "Hacer un donativo", fr: "Faire un don" }), t({ pt: "Transferência e outras formas de dar", en: "Bank transfer and other ways to give", es: "Transferencia y otras formas de dar", fr: "Virement et autres façons de donner" })),
        page("/apadrinhar", t({ pt: "Apadrinhar um gato", en: "Sponsor a cat", es: "Apadrinar un gato", fr: "Parrainer un chat" }), t({ pt: "Ajude um gato todos os meses", en: "Help a cat every month", es: "Ayude a un gato cada mes", fr: "Aidez un chat chaque mois" })),
        page("/loja", t({ pt: "Loja solidária", en: "Charity shop", es: "Tienda solidaria", fr: "Boutique solidaire" }), t({ pt: "Compre e ajude o gatil", en: "Shop and help the shelter", es: "Compre y ayude al refugio", fr: "Achetez et aidez le refuge" })),
      ],
    },
    {
      href: l("/ajudar"), label: t({ pt: "Ajudar", en: "Help", es: "Ayudar", fr: "Aider" }), children: [
        page("/ajudar", t({ pt: "Todas as formas de ajudar", en: "All the ways to help", es: "Todas las formas de ayudar", fr: "Toutes les façons d’aider" }), t({ pt: "Veja o que pode fazer pelos gatos", en: "See what you can do for the cats", es: "Vea lo que puede hacer por los gatos", fr: "Ce que vous pouvez faire pour les chats" })),
        page("/ajudar/voluntariado", t({ pt: "Ser voluntário", en: "Volunteer", es: "Ser voluntario", fr: "Devenir bénévole" }), t({ pt: "Dar uma mão no gatil", en: "Lend a hand at the shelter", es: "Echar una mano en el refugio", fr: "Donner un coup de main au refuge" })),
        page("/ajudar/familia-temporaria", t({ pt: "Família temporária", en: "Foster home", es: "Casa de acogida", fr: "Famille d’accueil" }), t({ pt: "Receber um gato em casa por uns tempos", en: "Look after a cat at home for a while", es: "Acoger un gato en casa una temporada", fr: "Accueillir un chat chez vous un moment" })),
        page("/ajudar/turnos", t({ pt: "Turnos no gatil", en: "Shelter shifts", es: "Turnos en el refugio", fr: "Créneaux au refuge" }), t({ pt: "Escolher um turno livre", en: "Pick a free shift", es: "Elegir un turno libre", fr: "Choisir un créneau libre" })),
        ...(features.amigo ? [page("/ajudar/amigo", t({ pt: "Ser Amigo", en: "Become a Friend", es: "Hacerse Amigo", fr: "Devenir Ami" }), t({ pt: "Quota anual, com descontos nos parceiros", en: "Yearly membership, with partner discounts", es: "Cuota anual, con descuentos en colaboradores", fr: "Cotisation annuelle, avec réductions chez les partenaires" }))] : []),
        ...(features.patinhas ? [page("/patinhas", "Patinhas", t({ pt: "Cada ajuda dá Patinhas", en: "Every bit of help earns Patinhas", es: "Cada ayuda da Patinhas", fr: "Chaque geste rapporte des Patinhas" }))] : []),
      ],
    },
    {
      href: l("/sobre"), label: t({ pt: "Sobre nós", en: "About us", es: "Sobre nosotros", fr: "À propos" }), children: [
        page("/sobre", t({ pt: "Quem somos", en: "Who we are", es: "Quiénes somos", fr: "Qui sommes-nous" }), t({ pt: "A associação e o gatil", en: "The association and the shelter", es: "La asociación y el refugio", fr: "L’association et le refuge" })),
        page("/noticias", t({ pt: "Notícias", en: "News", es: "Noticias", fr: "Actualités" }), t({ pt: "Eventos e novidades do gatil", en: "Events and news from the shelter", es: "Eventos y novedades del refugio", fr: "Événements et nouvelles du refuge" })),
        page("/parceiros", t({ pt: "Parceiros", en: "Partners", es: "Colaboradores", fr: "Partenaires" }), t({ pt: "Quem nos apoia", en: "Who supports us", es: "Quién nos apoya", fr: "Ceux qui nous soutiennent" })),
      ],
    },
  ];
}

// The phone tab bar: the home page and the two main paths, then "Mais" with everything else.
function tabs({ t, l }: I18n): NavItem[] {
  return [
    { href: l("/"), label: t({ pt: "Início", en: "Home", es: "Inicio", fr: "Accueil" }), icon: <IconHome /> },
    { href: l("/adotar"), label: t({ pt: "Adotar", en: "Adopt", es: "Adoptar", fr: "Adopter" }), icon: <IconHeart />, key: true },
    { href: l("/doar"), label: t({ pt: "Doar", en: "Donate", es: "Donar", fr: "Donner" }), icon: <IconGift />, key: true },
  ];
}

export function Header() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const i18n = useI18n();
  return (
    <SiteHeader
      homeHref={i18n.l("/")}
      currentPath={pathname}
      items={sections(i18n)}
      tabs={tabs(i18n)}
      onNavigate={(href) => router.push(href)}
      tools={<><LangSwitcher /><AccountLink /></>}
      brand={
<img className="gn-header__logo" src="/logo.svg" alt={i18n.t({ pt: "Gatos de Ninguém, página inicial", en: "Gatos de Ninguém, home page", es: "Gatos de Ninguém, página de inicio", fr: "Gatos de Ninguém, page d’accueil" })} width={81} height={84} />
      }
    />
  );
}
