import type { Appointment, CareAlert, CatCare, Dose, Medication, VisitNote } from "./cuidados";
import type { FosterPlacement, Shift, Sponsorship, StoredFosterApplication } from "./escalas";
import type { z } from "zod";
import { pageSchema } from "./content";
import type { Cat, Impact, Page, Partner, Post, Redirect, SeoSettings } from "./index";

/**
 * Demo content used in development, tests and preview deploys.
 * The cats are fictional examples, not real animals from the shelter.
 */
const now = "2026-10-22T09:00:00.000Z";

export const seedSeoSettings: SeoSettings = {
  siteName: "Gatos de Ninguém",
  siteUrl: "https://gatosdeninguem.pt",
  titleTemplate: "%s | Gatos de Ninguém",
  defaultDescription:
    "Associação de Viana do Castelo que resgata, esteriliza e encontra famílias para gatos de rua. Adote, apadrinhe, seja voluntário ou doe.",
  locale: "pt_PT",
  organization: {
    legalName: "Associação Gatos de Ninguém",
    locality: "Viana do Castelo",
    country: "PT",
    sameAs: [
      "https://www.facebook.com/GatosdeNinguemViana/",
      "https://www.instagram.com/gatosdeninguem/",
    ],
  },
};

export const seedCats: Cat[] = [
  {
    id: "cat-1",
    slug: "tobias",
    energy: "calmo",
    name: "Tobias",
    sex: "macho",
    ageYears: 11,
    status: "para-adocao",
    summary: "Senhor calmo que adora sestas ao sol e colo ao fim do dia.",
    story:
      "O Tobias foi encontrado num quintal em Darque, magro mas muito meigo. Já recuperou e procura uma casa tranquila onde possa passar a reforma.",
    traits: ["calmo", "meigo", "gosta de colo"],
    goodWithKids: true,
    goodWithCats: true,
    goodWithDogs: false,
    sterilized: true,
    vaccinated: true,
    microchipped: true,
    photos: [
      { url: "/fotos/gato-senior-ruby.webp", alt: "O Tobias, gato sénior preto e branco, a receber festas numa mesa da clínica" },
      { url: "/fotos/gato-tigrado-branco-riquinho.webp", alt: "Gato tigrado e branco de olhos verdes deitado numa mesa" },
    ],
    seo: {},
    updatedAt: now,
  },
  {
    id: "cat-2",
    slug: "mia",
    energy: "ativo",
    name: "Mia",
    sex: "femea",
    ageYears: 1,
    status: "para-adocao",
    summary: "Jovem curiosa e brincalhona, sempre pronta para uma aventura.",
    story:
      "A Mia nasceu numa colónia junto ao rio Lima e foi esterilizada no nosso programa. É muito sociável e daria uma ótima companheira para uma família ativa.",
    traits: ["brincalhona", "curiosa", "sociável"],
    goodWithKids: true,
    goodWithCats: true,
    goodWithDogs: true,
    sterilized: true,
    vaccinated: true,
    microchipped: true,
    photos: [
      { url: "/fotos/gato-tigrado-dani.webp", alt: "A Mia, gata tigrada, sentada a olhar para nós" },
      { url: "/fotos/gatinho-tigrado-zeca.webp", alt: "Gatinho tigrado de barriga para cima a receber festas" },
    ],
    seo: {},
    updatedAt: now,
  },
  {
    id: "cat-3",
    slug: "carvao",
    energy: "calmo",
    name: "Carvão",
    sex: "macho",
    ageYears: 4,
    status: "para-adocao",
    summary: "Gato preto tímido no início, muito carinhoso depois de ganhar confiança.",
    story:
      "O Carvão precisa de alguns dias para se habituar a pessoas novas. Depois disso, segue os donos pela casa toda. Ideal para uma casa sem crianças pequenas.",
    traits: ["tímido", "fiel", "tranquilo"],
    goodWithKids: false,
    goodWithCats: true,
    goodWithDogs: false,
    sterilized: true,
    vaccinated: true,
    microchipped: true,
    photos: [{ url: "/fotos/gato-preto-branco-betty.webp", alt: "O Carvão, gato preto e branco, sentado num canto branco a olhar para nós" }],
    seo: {},
    updatedAt: now,
  },
  {
    id: "cat-4",
    slug: "estrela",
    energy: "calmo",
    name: "Estrela",
    sex: "femea",
    ageYears: 7,
    status: "para-adocao",
    summary: "Gata doce com diabetes controlada; precisa de insulina duas vezes por dia.",
    story:
      "A Estrela é muito tranquila e habituou-se bem ao tratamento. A associação ensina a família a dar a insulina e ajuda com os primeiros custos.",
    traits: ["doce", "tranquila"],
    goodWithKids: true,
    goodWithCats: false,
    goodWithDogs: false,
    specialNeeds: "Diabetes controlada com insulina (2x por dia)",
    sterilized: true,
    vaccinated: true,
    microchipped: true,
    photos: [{ url: "/fotos/gata-tartaruga.webp", alt: "A Estrela, gata tartaruga preta e laranja de olhos cor de mel, deitada" }],
    seo: {},
    updatedAt: now,
  },
  {
    id: "cat-5",
    slug: "pimenta",
    energy: "equilibrado",
    name: "Pimenta",
    sex: "femea",
    ageYears: 2,
    status: "a-recuperar",
    summary: "A recuperar de uma cirurgia à pata; em breve estará pronta para adoção.",
    story: "A Pimenta foi atropelada em Meadela e operada numa clínica parceira. Está a recuperar numa família temporária.",
    traits: ["corajosa", "meiga"],
    sterilized: true,
    vaccinated: true,
    microchipped: false,
    photos: [{ url: "/fotos/gatinho-tigrado-oscar.webp", alt: "A Pimenta, gata tigrada, a descansar numa cama branca enquanto recupera" }],
    seo: {},
    updatedAt: now,
  },
  {
    id: "cat-6",
    slug: "bolacha",
    energy: "equilibrado",
    name: "Bolacha",
    sex: "femea",
    ageYears: 3,
    status: "adotado",
    summary: "Encontrada numa caixa de cartão em Areosa, hoje dorme no sofá.",
    story: "A Bolacha chegou-nos com duas semanas de vida e foi criada à mão por uma família temporária.",
    traits: ["meiga"],
    sterilized: true,
    vaccinated: true,
    microchipped: true,
    photos: [{ url: "/fotos/gatinhos-caixa-cartao.webp", alt: "A Bolacha em bebé, numa caixa de cartão com um irmão" }],
    adoptedAt: "2026-09-14T10:00:00.000Z",
    happyEnding: {
      text: "A Bolacha manda beijinhos! Já é a dona da casa e acorda-nos todos os dias às sete.",
      adopterConsent: true,
      adopterName: "Família Correia",
      adopterTown: "Ponte de Lima",
    },
    seo: {},
    updatedAt: now,
  },
  {
    id: "cat-7",
    slug: "lua",
    energy: "calmo",
    name: "Lua",
    sex: "femea",
    ageYears: 13,
    status: "adotado",
    summary: "Gata sénior que esperou dois anos por uma família.",
    story: "A Lua viveu dois anos no gatil. Foi adotada por um casal reformado que procurava uma companheira tranquila.",
    traits: ["calma"],
    sterilized: true,
    vaccinated: true,
    microchipped: true,
    photos: [{ url: "/fotos/gato-cinzento-pelo-comprido.webp", alt: "A Lua, gata cinzenta de pelo comprido, sentada no sofá da nova casa" }],
    adoptedAt: "2026-08-02T10:00:00.000Z",
    happyEnding: {
      text: "A Lua passa as tardes ao sol na janela da sala. Foi a melhor decisão que tomámos.",
      adopterConsent: false,
      adopterName: "Nome privado",
    },
    seo: {},
    updatedAt: now,
  },
];

/** Example numbers for previews: replace with the association's real figures. */
export const seedImpact: Impact = {
  catsInShelter: 140,
  adoptionsThisYear: 37,
  sterilizationsThisYear: 212,
  volunteers: 25,
  campaign: { title: "Esterilizações de outubro na Meadela", current: 18, goal: 30, unit: "gatos", href: "/ajudar/doar" },
  updatedAt: now,
};

export const seedPosts: Post[] = [
  {
    id: "post-1",
    slug: "precisamos-de-areia-e-racao",
    title: "Precisamos de areia e ração húmida para gatinhos",
    category: "precisamos",
    summary: "O inverno está a chegar e o gatil tem 140 gatos. Pode deixar donativos no gatil aos sábados de manhã.",
    body: "Estamos com pouca areia e ração húmida para gatinhos. Pode deixar os donativos no gatil em Santa Marta de Portuzelo aos sábados, das 10h às 12h. Obrigado a todos!",
    publishedAt: "2026-10-20T09:00:00.000Z",
    cta: { label: "Outras formas de ajudar", href: "/ajudar" },
    seo: {},
    updatedAt: now,
  },
  {
    id: "post-2",
    slug: "open-day-novembro",
    title: "Open Day no gatil: venha conhecer os nossos gatos",
    category: "evento",
    summary: "Visitas guiadas, banca solidária e muitos gatos à espera de família.",
    body: "Abrimos as portas do gatil para que possa conhecer o nosso trabalho e os gatos que procuram família. Haverá visitas guiadas de meia em meia hora e a nossa Loja Solidária.",
    publishedAt: "2026-10-15T09:00:00.000Z",
    event: { startsAt: "2026-11-15T10:00:00.000Z", endsAt: "2026-11-15T17:00:00.000Z", location: "Gatil, Santa Marta de Portuzelo" },
    seo: {},
    updatedAt: now,
  },
  {
    id: "post-3",
    slug: "campanha-esterilizacao-outubro",
    title: "Campanha de esterilização: 18 gatos de rua já operados",
    category: "campanha",
    summary: "Graças aos vossos donativos, esterilizámos 18 gatos da colónia da Meadela este mês. Faltam 12 para a meta.",
    body: "A esterilização é a forma mais eficaz de controlar as colónias de rua. Cada esterilização custa cerca de 35 euros. Ajude-nos a chegar aos 30.",
    publishedAt: "2026-10-08T09:00:00.000Z",
    cta: { label: "Doar para a campanha", href: "/ajudar/doar" },
    seo: {},
    updatedAt: now,
  },
];

/** Fictional example partners for previews. */
export const seedPartners: Partner[] = [
  {
    id: "partner-1",
    slug: "clinica-veterinaria-exemplo",
    name: "Clínica Veterinária do Lima (exemplo)",
    category: "veterinario",
    town: "Viana do Castelo",
    why: "Fazemos as esterilizações do programa CED a preço solidário.",
    perks: [{ id: "consulta-10", description: "10% em consultas para Amigos da associação", audience: "amigos", patinhasCost: 150, minLevel: 2, monthlyLimitPerPerson: 1 }],
    active: true,
    since: "2024-03-01T00:00:00.000Z",
  },
  {
    id: "partner-2",
    slug: "loja-animais-exemplo",
    name: "Bigodes Pet Shop (exemplo)",
    category: "loja-animais",
    town: "Viana do Castelo",
    why: "Cada saco de ração vendido com o código GN ajuda o gatil.",
    perks: [{ id: "racao-15", description: "15% em ração e areia", audience: "amigos", patinhasCost: 100, monthlyLimitPerPerson: 2 }],
    active: true,
    since: "2025-01-15T00:00:00.000Z",
  },
  {
    id: "partner-3",
    slug: "cafe-exemplo",
    name: "Café da Ribeira (exemplo)",
    category: "restauracao",
    town: "Darque",
    why: "Temos um mealheiro solidário ao balcão.",
    perks: [{ id: "cafe-turno", description: "Um café oferecido por cada turno de voluntariado", audience: "voluntarios", patinhasCost: 30 }],
    active: true,
    since: "2025-06-01T00:00:00.000Z",
  },
];

/** Written without the defaulted fields (gallery, carousel); filled in by the schema below. */
const seedPageInputs: z.input<typeof pageSchema>[] = [
  {
    id: "page-home",
    path: "/",
    heading: "Ajude um gato de ninguém a ser de alguém",
    intro: "Resgatamos, tratamos e encontramos famílias para gatos de rua em Viana do Castelo. Há muitas formas de ajudar, mesmo sem tempo ou dinheiro.",
    // Placeholder pictures until the shelter's own photos are added in the back office (Fotos do gatil).
    gallery: [
      { url: "/fotos/gatinhos-pauleta-kiza-davy.webp", alt: "Três gatinhos bebés a dormir juntos numa manta laranja", caption: "Pauleta, Kiza e Davy, encontrados sem mãe em Darque" },
      { url: "/fotos/gatinho-zorro-biberao.webp", alt: "Voluntário a dar biberão a um gatinho preto e branco", caption: "O Zorro, encontrado bebé em Chafé, alimentado a biberão" },
      { url: "/fotos/gato-siames-salvador.webp", alt: "Gato siamês a comer na rua junto a taças de comida", caption: "O Salvador, da colónia da Abelheira, hoje adotado" },
      { url: "/fotos/gatinhos-cupido-valentim.webp", alt: "Dois gatinhos aninhados junto a um peluche", caption: "Cupido e Valentim, com três semanas" },
      { url: "/fotos/gato-preto-branco-rua-amelia.webp", alt: "Gata preta e branca num passeio, junto a taças de água e comida", caption: "A Amélia, resgatada no Cais Novo e adotada" },
      { url: "/fotos/gatinhos-pirilampo-cometa-trovao.webp", alt: "Três gatinhos muito pequenos numa manta laranja com patinhas", caption: "Pirilampo, Cometa e Trovão, resgatados em São Domingos" },
    ],
    seo: { title: "Gatos de Ninguém, adoção e resgate de gatos em Viana do Castelo" },
    updatedAt: now,
  },
  {
    id: "page-adotar",
    path: "/adotar",
    heading: "Adotar um gato",
    intro: "Todos os nossos gatos estão vacinados, esterilizados e com chip. Escolha com calma: adotar é para toda a vida.",
    seo: {},
    updatedAt: now,
  },
  {
    id: "page-ajudar",
    path: "/ajudar",
    heading: "Como posso ajudar?",
    intro: "Escolha a forma que lhe for mais fácil. Todas fazem diferença.",
    seo: {},
    updatedAt: now,
  },
  {
    id: "page-turnos",
    path: "/ajudar/turnos",
    heading: "Escolha o seu turno de voluntariado",
    intro: "Veja os dias em que precisamos de ajuda e marque o seu lugar. Não precisa de experiência.",
    seo: { title: "Voluntariado no gatil em Viana do Castelo: turnos livres" },
    updatedAt: now,
  },
  {
    id: "page-sos",
    path: "/sos",
    heading: "Encontrei um gato. O que faço?",
    intro: "Responda a uma pergunta de cada vez. Dizemos-lhe o que fazer.",
    seo: { title: "Encontrei um gato na rua: o que fazer" },
    updatedAt: now,
  },
  {
    id: "page-noticias",
    path: "/noticias",
    heading: "Notícias",
    intro: "Pedidos urgentes, eventos e novidades da associação.",
    seo: {},
    updatedAt: now,
  },
  {
    id: "page-finais-felizes",
    path: "/finais-felizes",
    heading: "Finais felizes",
    intro: "Gatos que encontraram família. Obrigado a todos os que os adotaram.",
    seo: {},
    updatedAt: now,
  },
  {
    id: "page-descobrir",
    path: "/adotar/descobrir",
    heading: "Descobrir o gato certo para si",
    intro: "Responda a quatro perguntas simples e mostramos-lhe os gatos que combinam com a sua casa.",
    seo: {},
    updatedAt: now,
  },
  {
    id: "page-loja",
    path: "/loja",
    heading: "Loja solidária",
    intro: "T-shirts, canecas, calendários e peças feitas à mão. Cada compra paga comida, vacinas e tratamentos aos gatos do gatil.",
    seo: {},
    updatedAt: now,
  },
  {
    id: "page-parceiros",
    path: "/parceiros",
    heading: "Parceiros",
    intro: "Negócios de Viana do Castelo que apoiam os gatos e oferecem vantagens a quem ajuda a associação.",
    seo: {},
    updatedAt: now,
  },
  {
    id: "page-patinhas",
    path: "/patinhas",
    heading: "Patinhas: cada ajuda conta",
    intro: "Ganhe Patinhas sempre que ajuda os gatos. Subir de nível dá vantagens nos parceiros e um obrigado especial da associação.",
    seo: {},
    updatedAt: now,
  },
  {
    id: "page-conta",
    path: "/conta",
    heading: "A minha conta",
    intro: "Veja as suas Patinhas, as medalhas e as vantagens nos parceiros. Para entrar só precisa do email ou do telemóvel.",
    seo: { noindex: true },
    updatedAt: now,
  },
  {
    id: "page-sobre",
    path: "/sobre",
    heading: "Quem somos",
    intro: "Somos uma associação sem fins lucrativos de Viana do Castelo, formada em 2014 por voluntários que cuidavam de gatos de rua.",
    seo: {},
    updatedAt: now,
  },
  {
    id: "page-privacidade",
    path: "/privacidade",
    heading: "Política de privacidade",
    intro: "Como a associação trata os seus dados pessoais, para que os usa e como pode exercer os seus direitos (RGPD).",
    seo: {},
    updatedAt: now,
  },
  {
    id: "page-cookies",
    path: "/cookies",
    heading: "Política de cookies",
    intro: "Este site usa apenas o essencial para funcionar. Não usamos cookies de publicidade nem de estatísticas.",
    seo: {},
    updatedAt: now,
  },
];

export const seedPages: Page[] = seedPageInputs.map((p) => pageSchema.parse(p));

export const seedRedirects: Redirect[] = [
  { id: "r1", from: "/gatos", to: "/", permanent: true },
  { id: "r2", from: "/gatos/como-ajudar", to: "/ajudar", permanent: true },
  { id: "r3", from: "/gatos/manual-de-emerg-ncia", to: "/sos", permanent: true },
  { id: "r4", from: "/gatos/miss-o", to: "/sobre", permanent: true },
];

/** Example schedules for previews (November 2026). */
export const seedShifts: Shift[] = [
  { id: "shift-1", type: "limpeza", title: "Limpeza e mimos de sábado", startsAt: "2026-11-07T10:00:00.000Z", endsAt: "2026-11-07T12:00:00.000Z", location: "Gatil, Santa Marta de Portuzelo", capacity: 4, seriesId: "serie-sabado", signups: [{ volunteerId: "vol-1", name: "Ana Ribeiro", phone: "912000001", signedUpAt: now }] },
  { id: "shift-2", type: "limpeza", title: "Limpeza e mimos de sábado", startsAt: "2026-11-14T10:00:00.000Z", endsAt: "2026-11-14T12:00:00.000Z", location: "Gatil, Santa Marta de Portuzelo", capacity: 4, seriesId: "serie-sabado", signups: [] },
  { id: "shift-3", type: "transporte-vet", title: "Levar a Pimenta à revisão", startsAt: "2026-11-05T15:00:00.000Z", endsAt: "2026-11-05T16:30:00.000Z", location: "Gatil → Clínica Veterinária do Lima", capacity: 1, catSlug: "pimenta", clinic: "Clínica Veterinária do Lima (exemplo)", notes: "Levar a transportadora azul.", signups: [] },
  { id: "shift-4", type: "evento", title: "Open Day: montagem", startsAt: "2026-11-15T09:00:00.000Z", endsAt: "2026-11-15T10:00:00.000Z", location: "Gatil", capacity: 3, eventName: "Open Day de novembro", signups: [] },
  { id: "shift-5", type: "evento", title: "Open Day: banca solidária", startsAt: "2026-11-15T10:00:00.000Z", endsAt: "2026-11-15T13:00:00.000Z", location: "Gatil", capacity: 2, eventName: "Open Day de novembro", signups: [{ volunteerId: "vol-2", name: "Rui Sousa", phone: "912000002", signedUpAt: now }] },
];

export const seedFosterPlacements: FosterPlacement[] = [
  { id: "fat-1", catSlug: "pimenta", status: "ativa", startDate: "2026-10-10", expectedEndDate: "2026-11-20", familyName: "Família Lopes", notes: "Recuperação da pata." },
  { id: "fat-2", catSlug: "estrela", status: "procura-familia", startDate: "2026-11-01", notes: "Precisa de alguém que dê insulina 2x por dia." },
];

/** Example "Quero ser família temporária" request, so the back office demo shows one. */
export const seedFosterApplications: StoredFosterApplication[] = [
  { id: "fat-pedido-1", name: "Sofia Martins", phone: "912000009", town: "Meadela", canHost: "bebes", howLong: "meses", otherAnimals: "Um cão calmo", consent: true, receivedAt: "2026-10-21T18:30:00.000Z", status: "nova" },
];

export const seedSponsorships: Sponsorship[] = [
  { id: "sp-1", catSlug: "tobias", sponsorName: "Marta Gomes", email: "marta@example.pt", monthlyAmount: 10, startDate: "2026-03-01", active: true, lastUpdateSentAt: "2026-09-10" },
  { id: "sp-2", catSlug: "estrela", sponsorName: "Escola EB de Darque (exemplo)", monthlyAmount: 25, startDate: "2026-05-01", active: true, lastUpdateSentAt: "2026-10-15" },
];

/** Example care data: where the demo cats live, their medication and appointments. */
const ana = { name: "Ana Ribeiro" };
const rui = { name: "Rui Sousa" };

export const seedCatCare: CatCare[] = [
  { catId: "cat-1", location: { area: "paquito", spot: "solto" }, since: "2026-09-02T10:00:00.000Z", updatedBy: ana },
  { catId: "cat-2", location: { area: "colonia", spot: "solto" }, since: "2026-08-15T10:00:00.000Z", updatedBy: ana },
  { catId: "cat-3", location: { area: "caramelo", spot: "solto" }, since: "2026-07-20T10:00:00.000Z", updatedBy: rui },
  { catId: "cat-4", location: { area: "carlota", spot: "jaula", cage: "1", reason: "Controlo da diabetes" }, since: "2026-10-18T18:00:00.000Z", updatedBy: rui },
  { catId: "cat-5", location: { area: "fora", spot: "solto", reason: "Em família temporária (Família Lopes)" }, since: "2026-10-10T12:00:00.000Z", updatedBy: ana },
];

export const seedMedications: Medication[] = [
  { id: "med-1", catId: "cat-4", name: "Insulina", dose: "1 unidade", times: ["08:00", "20:00"], withFood: true, instructions: "Dar depois de comer. Picar na pele do pescoço, mudar de lado.", startDate: "2026-10-01", createdBy: rui, updatedAt: now },
  { id: "med-2", catId: "cat-1", name: "Semintra (rins)", dose: "1 ml", times: ["09:00"], withFood: true, startDate: "2026-09-15", createdBy: ana, updatedAt: now },
  { id: "med-3", catId: "cat-5", name: "Meloxicam", dose: "0,3 ml", times: ["20:00"], withFood: true, instructions: "Dado pela família temporária.", startDate: "2026-10-10", endDate: "2026-11-09", createdBy: ana, updatedAt: now },
];

export const seedDoses: Dose[] = [];

export const seedAppointments: Appointment[] = [
  { id: "con-1", catId: "cat-5", startsAt: "2026-11-05T15:30:00.000Z", clinic: "Clínica Veterinária do Lima (exemplo)", reason: "Revisão da pata", status: "marcada", transportShiftId: "shift-3", createdBy: ana, updatedAt: now },
  { id: "con-2", catId: "cat-4", startsAt: "2026-11-12T10:00:00.000Z", clinic: "Clínica Veterinária do Lima (exemplo)", reason: "Curva de glicemia", notes: "Ir em jejum: não dar comida nem insulina de manhã.", status: "marcada", createdBy: rui, updatedAt: now },
];

export const seedVisitNotes: VisitNote[] = [
  { id: "nota-1", catId: "cat-4", text: "Comeu tudo e deixou-se picar sem problema.", important: false, by: ana, createdAt: "2026-10-21T19:10:00.000Z" },
  { id: "nota-2", catId: "cat-1", text: "Bebeu muita água hoje. Vale a pena falar com a veterinária na próxima consulta.", important: true, by: rui, createdAt: "2026-10-21T11:00:00.000Z" },
];

export const seedCareAlerts: CareAlert[] = [
  { id: "al-1", catId: "cat-4", catName: "Estrela", kind: "localizacao", message: "Estrela mudou de Contentor Carlota, solto para Contentor Carlota, jaula 1. Motivo: Controlo da diabetes.", important: true, by: rui, createdAt: "2026-10-18T18:00:00.000Z" },
  { id: "al-2", catId: "cat-1", catName: "Tobias", kind: "nota", message: "Sobre Tobias: “Bebeu muita água hoje. Vale a pena falar com a veterinária na próxima consulta.”", important: true, by: rui, createdAt: "2026-10-21T11:00:00.000Z" },
  { id: "al-3", catId: "cat-4", catName: "Estrela", kind: "nota", message: "Sobre Estrela: “Comeu tudo e deixou-se picar sem problema.”", important: false, by: ana, createdAt: "2026-10-21T19:10:00.000Z" },
];
