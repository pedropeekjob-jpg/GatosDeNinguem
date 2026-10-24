import { isSenior, type Cat } from "./content";

type AdoptableCat = Pick<Cat, "slug" | "status" | "sex" | "ageYears" | "energy" | "goodWithKids" | "goodWithCats" | "goodWithDogs" | "specialNeeds">;

/** Up to this age a cat counts as young in the "Jovens" filter. */
export const youngMaxYears = 2;

/** The quick filters on /adotar, in the order people see them. Each cat carries the values it matches. */
export const catFilters = [
  { value: "jovem", label: "Jovens", test: (c: AdoptableCat) => c.ageYears <= youngMaxYears },
  { value: "senior", label: "Séniores", test: (c: AdoptableCat) => isSenior(c) },
  { value: "criancas", label: "Com crianças", test: (c: AdoptableCat) => c.goodWithKids === true },
  { value: "gatos", label: "Com outros gatos", test: (c: AdoptableCat) => c.goodWithCats === true },
  { value: "caes", label: "Com cães", test: (c: AdoptableCat) => c.goodWithDogs === true },
  { value: "calmo", label: "Calmos", test: (c: AdoptableCat) => c.energy === "calmo" },
  { value: "femea", label: "Fêmeas", test: (c: AdoptableCat) => c.sex === "femea" },
  { value: "macho", label: "Machos", test: (c: AdoptableCat) => c.sex === "macho" },
  { value: "cuidados", label: "Cuidados especiais", test: (c: AdoptableCat) => !!c.specialNeeds },
] as const;

/** The filter values a cat matches, e.g. ["jovem", "criancas", "femea"]. */
export function catFilterTags(cat: AdoptableCat): string[] {
  return catFilters.filter((f) => f.test(cat)).map((f) => f.value);
}

/**
 * Other cats to show at the end of a cat's page, so the visit never ends in a dead end.
 * Only cats that can be adopted now; the closest in age, energy and who they live well with come first.
 */
export function similarCats<T extends AdoptableCat>(cat: AdoptableCat, others: T[], count = 3): T[] {
  const score = (o: T) => {
    let s = 0;
    if (isSenior(o) === isSenior(cat)) s += 3;
    if ((o.ageYears <= youngMaxYears) === (cat.ageYears <= youngMaxYears)) s += 2;
    if (o.energy === cat.energy) s += 2;
    for (const k of ["goodWithKids", "goodWithCats", "goodWithDogs"] as const) if (cat[k] === true && o[k] === true) s += 1;
    if (!!o.specialNeeds === !!cat.specialNeeds) s += 1;
    return s;
  };
  return others
    .filter((o) => o.slug !== cat.slug && o.status === "para-adocao")
    .map((o, i) => ({ o, s: score(o), i }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, count)
    .map(({ o }) => o);
}

/** What the cat already has when it goes home. Unknown or missing items are said plainly, never hidden. */
export function goesHomeWith(cat: Pick<Cat, "sex" | "sterilized" | "vaccinated" | "microchipped">): { label: string; done: boolean }[] {
  const o = cat.sex === "femea" ? "a" : "o";
  return [
    { label: `Esterilizad${o}`, done: cat.sterilized },
    { label: `Vacinad${o}`, done: cat.vaccinated },
    { label: "Chip e registo", done: cat.microchipped },
    { label: "Contrato de adoção e acompanhamento", done: true },
  ];
}

/** The adoption, step by step. Shown on /adotar and on every cat's page. */
export const adoptionSteps = [
  { title: "Escolhe um gato", text: "Carregue em “Quero conhecer”. Não precisa de decidir nada ainda." },
  { title: "Falamos ao telefone", text: "Ligamos-lhe para conversar sobre a sua casa e marcar uma visita ao gatil." },
  { title: "Conhece o gato", text: "Se for o gato certo, assinamos o contrato de adoção e leva-o para casa." },
  { title: "Acompanhamos", text: "Ligamos uma semana e um mês depois para saber como estão." },
] as const;

/** Questions people ask before adopting. Shown on /adotar/perguntas, with FAQ structured data for search engines. */
export const adoptionFaq: { q: string; a: string }[] = [
  { q: "Quanto custa adotar?", a: "Adotar não é uma compra. Na conversa ao telefone explicamos tudo, incluindo o donativo de adoção, que ajuda a pagar o veterinário dos gatos que ainda esperam." },
  { q: "Moro num apartamento. Posso adotar?", a: "Sim. Muitos gatos vivem felizes em apartamento. Pedimos redes nas janelas e varandas, para não haver quedas. Dizemos-lhe quais os gatos que preferem uma casa mais calma." },
  { q: "Tenho crianças pequenas. Que gato devo escolher?", a: "Use o filtro “Com crianças” na lista de gatos. Na ficha de cada gato dizemos se se dá bem com crianças. Na visita, as crianças podem vir conhecê-lo." },
  { q: "Já tenho outros animais em casa.", a: "Use os filtros “Com outros gatos” e “Com cães”. Explicamos como fazer as apresentações com calma, nos primeiros dias." },
  { q: "Nunca tive gatos. Consigo?", a: "Consegue. Ajudamos a escolher um gato tranquilo e explicamos o essencial: comida, caixa de areia, arranhador e veterinário. Pode ligar-nos sempre que tiver dúvidas." },
  { q: "Tenho alergias. Posso adotar?", a: "Depende de cada pessoa. Sugerimos passar algum tempo com o gato numa visita ao gatil antes de decidir." },
  { q: "Moro longe de Viana do Castelo.", a: "Fale connosco. Precisamos de conhecer a família e de acompanhar o gato depois da adoção, por isso combinamos caso a caso." },
  { q: "Quanto tempo demora?", a: "Depende de si e do gato. Normalmente ligamos poucos dias depois do pedido e marcamos a visita para quando lhe der jeito." },
  { q: "Posso oferecer um gato a alguém?", a: "Não entregamos gatos como surpresa. A pessoa que vai viver com o gato deve conhecê-lo e querer adotá-lo." },
  { q: "E se não resultar?", a: "Fale connosco antes de tudo: muitas vezes há uma solução simples. Se mesmo assim não resultar, o gato volta para a associação. Nunca o deixe na rua nem o entregue a outra pessoa." },
  { q: "Não posso adotar. Como posso ajudar?", a: "Pode apadrinhar um gato a partir de 5 euros por mês, ser família temporária, fazer um turno no gatil ou partilhar os gatos com amigos." },
];
