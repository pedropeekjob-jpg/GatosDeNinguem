import {
  adoptionFaq as ptAdoptionFaq,
  adoptionSteps as ptAdoptionSteps,
  alertAgeGroupLabel as ptAlertAgeGroupLabel,
  catFilters as ptCatFilters,
  contactTopics as ptContactTopics,
  datesIn,
  helpActions as ptHelpActions,
  partnerCategoryLabel as ptPartnerCategoryLabel,
  postCategoryLabel as ptPostCategoryLabel,
  productCategoryLabel as ptProductCategoryLabel,
  ptMatchWords,
  shiftTypeLabel as ptShiftTypeLabel,
  statusLabel as ptStatusLabel,
  type AlertAgeGroup,
  type CatAlertFilters,
  type CatStatus,
  type ContactTopic,
  type HelpAction,
  type MatchWords,
  type PartnerCategory,
  type PostCategory,
  type PostEvent,
  type ProductCategory,
  type ShiftType,
} from "@gn/domain";
import { locale, type Lang } from "./config";
import type { Tr } from "./t";

/**
 * The words that come from the shared rules (packages/domain), which are written in Portuguese: cat status,
 * ages, adoption steps, filters, topics. Here in every language of the site.
 */

type Sex = "macho" | "femea";

export const sexLabel: Tr<Record<Sex, string>> = {
  pt: { macho: "Macho", femea: "Fêmea" },
  en: { macho: "Male", femea: "Female" },
  es: { macho: "Macho", femea: "Hembra" },
  fr: { macho: "Mâle", femea: "Femelle" },
};

export const statusLabel: Tr<Record<CatStatus, string>> = {
  pt: ptStatusLabel,
  en: { "a-recuperar": "Recovering", "para-adocao": "Looking for a home", reservado: "Reserved", adotado: "Already adopted" },
  es: { "a-recuperar": "Recuperándose", "para-adocao": "Busca familia", reservado: "Reservado", adotado: "Ya adoptado" },
  fr: { "a-recuperar": "En convalescence", "para-adocao": "Cherche une famille", reservado: "Réservé", adotado: "Déjà adopté" },
};

export function ageLabel(lang: Lang, years: number): string {
  const words: Tr<[string, string, (n: number) => string]> = {
    pt: ["Bebé (menos de 1 ano)", "1 ano", (n) => `${n} anos`],
    en: ["Kitten (under 1 year)", "1 year", (n) => `${n} years`],
    es: ["Cachorro (menos de 1 año)", "1 año", (n) => `${n} años`],
    fr: ["Chaton (moins d’un an)", "1 an", (n) => `${n} ans`],
  };
  const [baby, one, many] = words[lang];
  return years < 1 ? baby : years === 1 ? one : many(years);
}

/** "Esterilizado" / "Esterilizada", and the other words that agree with the cat's sex. */
export function catWords(lang: Lang, sex: Sex) {
  const f = sex === "femea";
  const words: Tr<{ sterilized: string; vaccinated: string; adopted: string; chip: string; contract: string; senior: string; specialCare: string; newForAdoption: string }> = {
    pt: { sterilized: f ? "Esterilizada" : "Esterilizado", vaccinated: f ? "Vacinada" : "Vacinado", adopted: f ? "Adotada" : "Adotado", chip: "Chip e registo", contract: "Contrato de adoção e acompanhamento", senior: "Sénior", specialCare: "Cuidados especiais", newForAdoption: f ? "Nova para adoção" : "Novo para adoção" },
    en: { sterilized: f ? "Spayed" : "Neutered", vaccinated: "Vaccinated", adopted: "Adopted", chip: "Microchip and registration", contract: "Adoption contract and follow-up", senior: "Senior", specialCare: "Special care", newForAdoption: "New for adoption" },
    es: { sterilized: f ? "Esterilizada" : "Esterilizado", vaccinated: f ? "Vacunada" : "Vacunado", adopted: f ? "Adoptada" : "Adoptado", chip: "Microchip y registro", contract: "Contrato de adopción y seguimiento", senior: "Sénior", specialCare: "Cuidados especiales", newForAdoption: f ? "Nueva en adopción" : "Nuevo en adopción" },
    fr: { sterilized: f ? "Stérilisée" : "Stérilisé", vaccinated: f ? "Vaccinée" : "Vacciné", adopted: f ? "Adoptée" : "Adopté", chip: "Puce et enregistrement", contract: "Contrat d’adoption et suivi", senior: "Senior", specialCare: "Soins particuliers", newForAdoption: f ? "Nouvelle à l’adoption" : "Nouveau à l’adoption" },
  };
  return words[lang];
}

/** What the cat already has when it goes home (same order as goesHomeWith in the domain). */
export function goesHomeWith(lang: Lang, cat: { sex: Sex; sterilized: boolean; vaccinated: boolean; microchipped: boolean }) {
  const w = catWords(lang, cat.sex);
  return [
    { label: w.sterilized, done: cat.sterilized },
    { label: w.vaccinated, done: cat.vaccinated },
    { label: w.chip, done: cat.microchipped },
    { label: w.contract, done: true },
  ];
}

export const adoptionSteps: Tr<readonly { title: string; text: string }[]> = {
  pt: ptAdoptionSteps,
  en: [
    { title: "Choose a cat", text: "Press “I’d like to meet them”. You don’t have to decide anything yet." },
    { title: "We talk on the phone", text: "We call you to chat about your home and arrange a visit to the shelter." },
    { title: "Meet the cat", text: "If it is the right cat, we sign the adoption contract and you take them home." },
    { title: "We stay in touch", text: "We call a week and a month later to see how you are getting on." },
  ],
  es: [
    { title: "Elige un gato", text: "Pulse «Quiero conocerlo». Todavía no tiene que decidir nada." },
    { title: "Hablamos por teléfono", text: "Le llamamos para hablar de su casa y concertar una visita al refugio." },
    { title: "Conoce al gato", text: "Si es el gato adecuado, firmamos el contrato de adopción y se lo lleva a casa." },
    { title: "Le acompañamos", text: "Le llamamos a la semana y al mes para saber qué tal están." },
  ],
  fr: [
    { title: "Choisissez un chat", text: "Appuyez sur « Je veux le rencontrer ». Vous n’avez encore rien à décider." },
    { title: "On se parle au téléphone", text: "Nous vous appelons pour parler de votre maison et fixer une visite au refuge." },
    { title: "Rencontrez le chat", text: "Si c’est le bon chat, nous signons le contrat d’adoption et vous le ramenez chez vous." },
    { title: "Nous restons en contact", text: "Nous vous appelons une semaine puis un mois après pour prendre des nouvelles." },
  ],
};

export const adoptionFaq: Tr<{ q: string; a: string }[]> = {
  pt: ptAdoptionFaq,
  en: [
    { q: "How much does it cost to adopt?", a: "Adopting is not a purchase. On the phone we explain everything, including the adoption donation, which helps pay the vet bills of the cats still waiting." },
    { q: "I live in a flat. Can I adopt?", a: "Yes. Many cats live happily in flats. We ask for nets on windows and balconies, so there are no falls. We tell you which cats prefer a quieter home." },
    { q: "I have young children. Which cat should I choose?", a: "Use the “Good with children” filter on the list of cats. Each cat’s page says whether they get on with children. Children can come and meet the cat on the visit." },
    { q: "I already have other animals at home.", a: "Use the “Good with other cats” and “Good with dogs” filters. We explain how to introduce them calmly in the first few days." },
    { q: "I’ve never had a cat. Can I manage?", a: "You can. We help you choose a calm cat and explain the essentials: food, litter tray, scratching post and vet. You can call us whenever you have questions." },
    { q: "I have allergies. Can I adopt?", a: "It depends on the person. We suggest spending some time with the cat on a visit to the shelter before deciding." },
    { q: "I live far from Viana do Castelo.", a: "Get in touch. We need to meet the family and follow the cat after the adoption, so we decide case by case." },
    { q: "How long does it take?", a: "It depends on you and the cat. We usually call a few days after your request and book the visit for whenever suits you." },
    { q: "Can I give a cat to someone as a present?", a: "We don’t hand over cats as surprises. The person who will live with the cat should meet them and want to adopt them." },
    { q: "What if it doesn’t work out?", a: "Talk to us first: often there is a simple solution. If it still doesn’t work out, the cat comes back to the association. Never leave them on the street or give them to someone else." },
    { q: "I can’t adopt. How can I help?", a: "You can sponsor a cat from 5 euros a month, foster, do a shift at the shelter or share the cats with your friends." },
  ],
  es: [
    { q: "¿Cuánto cuesta adoptar?", a: "Adoptar no es una compra. En la llamada se lo explicamos todo, incluido el donativo de adopción, que ayuda a pagar el veterinario de los gatos que aún esperan." },
    { q: "Vivo en un piso. ¿Puedo adoptar?", a: "Sí. Muchos gatos viven felices en un piso. Pedimos redes en ventanas y balcones para evitar caídas. Le decimos qué gatos prefieren una casa más tranquila." },
    { q: "Tengo niños pequeños. ¿Qué gato debo elegir?", a: "Use el filtro «Con niños» en la lista de gatos. En la ficha de cada gato indicamos si se lleva bien con niños. En la visita, los niños pueden venir a conocerlo." },
    { q: "Ya tengo otros animales en casa.", a: "Use los filtros «Con otros gatos» y «Con perros». Le explicamos cómo hacer las presentaciones con calma los primeros días." },
    { q: "Nunca he tenido gatos. ¿Podré?", a: "Podrá. Le ayudamos a elegir un gato tranquilo y le explicamos lo esencial: comida, arenero, rascador y veterinario. Puede llamarnos siempre que tenga dudas." },
    { q: "Tengo alergias. ¿Puedo adoptar?", a: "Depende de cada persona. Le sugerimos pasar un rato con el gato en una visita al refugio antes de decidir." },
    { q: "Vivo lejos de Viana do Castelo.", a: "Escríbanos. Necesitamos conocer a la familia y hacer seguimiento del gato después de la adopción, así que lo vemos caso por caso." },
    { q: "¿Cuánto tarda?", a: "Depende de usted y del gato. Normalmente llamamos pocos días después de la solicitud y concertamos la visita cuando le venga bien." },
    { q: "¿Puedo regalar un gato a alguien?", a: "No entregamos gatos como sorpresa. La persona que va a vivir con el gato debe conocerlo y querer adoptarlo." },
    { q: "¿Y si no sale bien?", a: "Hable con nosotros antes de nada: muchas veces hay una solución sencilla. Si aun así no sale bien, el gato vuelve a la asociación. Nunca lo deje en la calle ni se lo dé a otra persona." },
    { q: "No puedo adoptar. ¿Cómo puedo ayudar?", a: "Puede apadrinar un gato desde 5 euros al mes, ser casa de acogida, hacer un turno en el refugio o compartir los gatos con sus amigos." },
  ],
  fr: [
    { q: "Combien coûte une adoption ?", a: "Adopter n’est pas un achat. Au téléphone, nous vous expliquons tout, y compris le don d’adoption, qui aide à payer le vétérinaire des chats qui attendent encore." },
    { q: "J’habite en appartement. Puis-je adopter ?", a: "Oui. Beaucoup de chats vivent heureux en appartement. Nous demandons des filets aux fenêtres et aux balcons pour éviter les chutes. Nous vous disons quels chats préfèrent une maison plus calme." },
    { q: "J’ai de jeunes enfants. Quel chat choisir ?", a: "Utilisez le filtre « Avec des enfants » dans la liste des chats. La fiche de chaque chat indique s’il s’entend bien avec les enfants. Les enfants peuvent venir le rencontrer lors de la visite." },
    { q: "J’ai déjà d’autres animaux.", a: "Utilisez les filtres « Avec d’autres chats » et « Avec des chiens ». Nous vous expliquons comment faire les présentations en douceur les premiers jours." },
    { q: "Je n’ai jamais eu de chat. Vais-je y arriver ?", a: "Oui. Nous vous aidons à choisir un chat calme et vous expliquons l’essentiel : nourriture, litière, griffoir et vétérinaire. Vous pouvez nous appeler dès que vous avez une question." },
    { q: "J’ai des allergies. Puis-je adopter ?", a: "Cela dépend de chacun. Nous vous conseillons de passer un moment avec le chat lors d’une visite au refuge avant de décider." },
    { q: "J’habite loin de Viana do Castelo.", a: "Écrivez-nous. Nous devons rencontrer la famille et suivre le chat après l’adoption, donc nous voyons au cas par cas." },
    { q: "Combien de temps cela prend-il ?", a: "Cela dépend de vous et du chat. En général, nous appelons quelques jours après la demande et fixons la visite quand cela vous arrange." },
    { q: "Puis-je offrir un chat à quelqu’un ?", a: "Nous ne confions pas de chats en surprise. La personne qui vivra avec le chat doit le rencontrer et vouloir l’adopter." },
    { q: "Et si cela ne marche pas ?", a: "Parlez-nous d’abord : il existe souvent une solution simple. Si cela ne marche toujours pas, le chat revient à l’association. Ne le laissez jamais dans la rue et ne le donnez pas à quelqu’un d’autre." },
    { q: "Je ne peux pas adopter. Comment aider ?", a: "Vous pouvez parrainer un chat à partir de 5 euros par mois, être famille d’accueil, faire un créneau au refuge ou partager les chats avec vos amis." },
  ],
};

type FilterValue = (typeof ptCatFilters)[number]["value"];
const filterLabels: Tr<Record<FilterValue, string>> = {
  pt: Object.fromEntries(ptCatFilters.map((f) => [f.value, f.label])) as Record<FilterValue, string>,
  en: { jovem: "Young", senior: "Seniors", criancas: "Good with children", gatos: "Good with other cats", caes: "Good with dogs", calmo: "Calm", femea: "Females", macho: "Males", cuidados: "Special care" },
  es: { jovem: "Jóvenes", senior: "Séniors", criancas: "Con niños", gatos: "Con otros gatos", caes: "Con perros", calmo: "Tranquilos", femea: "Hembras", macho: "Machos", cuidados: "Cuidados especiales" },
  fr: { jovem: "Jeunes", senior: "Seniors", criancas: "Avec des enfants", gatos: "Avec d’autres chats", caes: "Avec des chiens", calmo: "Calmes", femea: "Femelles", macho: "Mâles", cuidados: "Soins particuliers" },
};
/** The quick filters on /adotar, with their names in this language. */
export const catFilters = (lang: Lang) => ptCatFilters.map((f) => ({ ...f, label: filterLabels[lang][f.value] }));

export const alertAgeGroupLabel: Tr<Record<AlertAgeGroup, string>> = {
  pt: ptAlertAgeGroupLabel,
  en: { bebe: "Kittens (up to 1 year)", jovem: "Young (1 to 3 years)", adulto: "Adults (4 to 9 years)", senior: "Seniors (10 years or more)" },
  es: { bebe: "Cachorros (hasta 1 año)", jovem: "Jóvenes (1 a 3 años)", adulto: "Adultos (4 a 9 años)", senior: "Séniors (10 años o más)" },
  fr: { bebe: "Chatons (jusqu’à 1 an)", jovem: "Jeunes (1 à 3 ans)", adulto: "Adultes (4 à 9 ans)", senior: "Seniors (10 ans ou plus)" },
};

/** "Jovens ou adultos · fêmeas · que se dão com crianças", like describeAlertFilters in the domain. */
export function describeAlertFilters(lang: Lang, f: CatAlertFilters): string {
  const w: Tr<{ ages: Record<AlertAgeGroup, string>; or: string; female: string; male: string; kids: string; cats: string; dogs: string; and: string; with: (s: string) => string; all: string }> = {
    pt: { ages: { bebe: "bebés", jovem: "jovens", adulto: "adultos", senior: "séniores" }, or: " ou ", female: "fêmeas", male: "machos", kids: "crianças", cats: "outros gatos", dogs: "cães", and: " e ", with: (s) => `que se dão com ${s}`, all: "Todos os gatos" },
    en: { ages: { bebe: "kittens", jovem: "young cats", adulto: "adults", senior: "seniors" }, or: " or ", female: "females", male: "males", kids: "children", cats: "other cats", dogs: "dogs", and: " and ", with: (s) => `good with ${s}`, all: "All cats" },
    es: { ages: { bebe: "cachorros", jovem: "jóvenes", adulto: "adultos", senior: "séniors" }, or: " o ", female: "hembras", male: "machos", kids: "niños", cats: "otros gatos", dogs: "perros", and: " y ", with: (s) => `que se llevan bien con ${s}`, all: "Todos los gatos" },
    fr: { ages: { bebe: "chatons", jovem: "jeunes", adulto: "adultes", senior: "seniors" }, or: " ou ", female: "femelles", male: "mâles", kids: "les enfants", cats: "d’autres chats", dogs: "les chiens", and: " et ", with: (s) => `qui s’entendent avec ${s}`, all: "Tous les chats" },
  };
  const t = w[lang];
  const parts: string[] = [];
  if (f.ages.length > 0 && f.ages.length < 4) parts.push(f.ages.map((a) => t.ages[a]).join(t.or));
  if (f.sexes.length === 1) parts.push(f.sexes[0] === "femea" ? t.female : t.male);
  const with_ = [f.withKids && t.kids, f.withCats && t.cats, f.withDogs && t.dogs].filter(Boolean) as string[];
  if (with_.length > 0) parts.push(t.with(with_.length > 1 ? `${with_.slice(0, -1).join(", ")}${t.and}${with_.at(-1)}` : with_[0]!));
  if (parts.length === 0) return t.all;
  const text = parts.join(" · ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export const contactTopics: Tr<Record<ContactTopic, string>> = {
  pt: ptContactTopics,
  en: { geral: "General question", adocao: "Adoption", ajudar: "Donations, volunteering and sponsorship", loja: "Charity shop (donations with a gift)", reclamacao: "Complaint", dados: "My personal data (GDPR)", imprensa: "Press and partnerships" },
  es: { geral: "Pregunta general", adocao: "Adopción", ajudar: "Donativos, voluntariado y apadrinamiento", loja: "Tienda solidaria (donativos con regalo)", reclamacao: "Reclamación", dados: "Mis datos personales (RGPD)", imprensa: "Prensa y colaboraciones" },
  fr: { geral: "Question générale", adocao: "Adoption", ajudar: "Dons, bénévolat et parrainage", loja: "Boutique solidaire (dons avec cadeau)", reclamacao: "Réclamation", dados: "Mes données personnelles (RGPD)", imprensa: "Presse et partenariats" },
};

export const postCategoryLabel: Tr<Record<PostCategory, string>> = {
  pt: ptPostCategoryLabel,
  en: { urgente: "Urgent", evento: "Event", campanha: "Campaign", noticia: "News", precisamos: "We need help" },
  es: { urgente: "Urgente", evento: "Evento", campanha: "Campaña", noticia: "Noticia", precisamos: "Necesitamos ayuda" },
  fr: { urgente: "Urgent", evento: "Événement", campanha: "Campagne", noticia: "Actualité", precisamos: "Nous avons besoin d’aide" },
};

export const partnerCategoryLabel: Tr<Record<PartnerCategory, string>> = {
  pt: ptPartnerCategoryLabel,
  en: { veterinario: "Vet clinic", "loja-animais": "Pet shop", restauracao: "Café and restaurant", comercio: "Shop", servicos: "Services", outro: "Other" },
  es: { veterinario: "Clínica veterinaria", "loja-animais": "Tienda de animales", restauracao: "Cafetería y restaurante", comercio: "Comercio", servicos: "Servicios", outro: "Otro" },
  fr: { veterinario: "Clinique vétérinaire", "loja-animais": "Animalerie", restauracao: "Café et restaurant", comercio: "Commerce", servicos: "Services", outro: "Autre" },
};

export const productCategoryLabel: Tr<Record<ProductCategory, string>> = {
  pt: ptProductCategoryLabel,
  en: { roupa: "Clothing", casa: "Home", acessorios: "Accessories", artesanato: "Handmade", livros: "Books", outro: "Other" },
  es: { roupa: "Ropa", casa: "Hogar", acessorios: "Accesorios", artesanato: "Hecho a mano", livros: "Libros", outro: "Otros" },
  fr: { roupa: "Vêtements", casa: "Maison", acessorios: "Accessoires", artesanato: "Fait main", livros: "Livres", outro: "Autres" },
};

export const shiftTypeLabel: Tr<Record<ShiftType, string>> = {
  pt: ptShiftTypeLabel,
  en: { limpeza: "Cleaning and cuddles at the shelter", "transporte-vet": "Taking cats to the vet", evento: "Event", outro: "Another task" },
  es: { limpeza: "Limpieza y mimos en el refugio", "transporte-vet": "Llevar gatos al veterinario", evento: "Evento", outro: "Otra tarea" },
  fr: { limpeza: "Ménage et câlins au refuge", "transporte-vet": "Emmener des chats chez le vétérinaire", evento: "Événement", outro: "Autre tâche" },
};

export const helpActions: Tr<Record<HelpAction["id"], Pick<HelpAction, "title" | "description">>> = {
  pt: ptHelpActions,
  en: {
    partilhar: { title: "Share a cat", description: "Share a cat on WhatsApp or Facebook. Many adoptions start that way." },
    doar: { title: "Make a donation", description: "Any amount helps pay for food and the vet. 35 euros pays for one neutering." },
    apadrinhar: { title: "Sponsor a cat", description: "From 5 euros a month, and you get news of your cat." },
    amigo: { title: "Become a Friend of the association", description: "24 euros a year and discounts at our partners." },
    voluntariado: { title: "Do a shift at the shelter", description: "Two hours cleaning, feeding and giving cuddles. No experience needed." },
    transporte: { title: "Take cats to the vet", description: "If you have a car, help take cats to their appointments." },
    fat: { title: "Become a foster home", description: "Take a cat into your home for a few weeks. We pay for the food and the vet." },
    adotar: { title: "Adopt a cat", description: "Give one of our cats a home for ever." },
  },
  es: {
    partilhar: { title: "Compartir un gato", description: "Comparta un gato en WhatsApp o Facebook. Muchas adopciones empiezan así." },
    doar: { title: "Hacer un donativo", description: "Cualquier cantidad ayuda a pagar comida y veterinario. 35 euros pagan una esterilización." },
    apadrinhar: { title: "Apadrinar un gato", description: "Desde 5 euros al mes, y recibe noticias de su ahijado." },
    amigo: { title: "Hacerse Amigo de la asociación", description: "24 euros al año y descuentos en nuestros colaboradores." },
    voluntariado: { title: "Hacer un turno en el refugio", description: "Dos horas limpiando, dando de comer y haciendo mimos. No hace falta experiencia." },
    transporte: { title: "Llevar gatos al veterinario", description: "Si tiene coche, ayude a llevar gatos a sus citas." },
    fat: { title: "Ser casa de acogida", description: "Acoja un gato en casa unas semanas. Nosotros pagamos la comida y el veterinario." },
    adotar: { title: "Adoptar un gato", description: "Dé un hogar para siempre a uno de nuestros gatos." },
  },
  fr: {
    partilhar: { title: "Partager un chat", description: "Partagez un chat sur WhatsApp ou Facebook. Beaucoup d’adoptions commencent ainsi." },
    doar: { title: "Faire un don", description: "Chaque euro aide à payer la nourriture et le vétérinaire. 35 euros paient une stérilisation." },
    apadrinhar: { title: "Parrainer un chat", description: "À partir de 5 euros par mois, avec des nouvelles de votre filleul." },
    amigo: { title: "Devenir Ami de l’association", description: "24 euros par an et des réductions chez nos partenaires." },
    voluntariado: { title: "Faire un créneau au refuge", description: "Deux heures de ménage, de repas et de câlins. Aucune expérience nécessaire." },
    transporte: { title: "Emmener des chats chez le vétérinaire", description: "Si vous avez une voiture, aidez à emmener les chats à leurs rendez-vous." },
    fat: { title: "Devenir famille d’accueil", description: "Accueillez un chat chez vous quelques semaines. Nous payons la nourriture et le vétérinaire." },
    adotar: { title: "Adopter un chat", description: "Offrez un foyer pour toujours à l’un de nos chats." },
  },
};

export const matchWords: Tr<MatchWords> = {
  pt: ptMatchWords,
  en: {
    noKids: (n) => `${n} would rather live in a home without children.`,
    onlyCat: (n) => `${n} would rather be the only cat in the house.`,
    noDogs: (n) => `${n} doesn’t get on with dogs.`,
    needsCare: (n, needs) => `${n} needs special care: ${needs}.`,
    likesKids: (n) => `${n} likes children.`,
    likesCats: (n) => `${n} gets on with other cats.`,
    likesDogs: (n) => `${n} gets on with dogs.`,
    quietHome: "Your home is quiet, with no other animals or children.",
    calm: (n) => `${n} is calm, just as you’d like.`,
    active: (n) => `${n} is lively and playful, just as you’d like.`,
    seniorTime: (n) => `You have time to give ${n} the company a senior cat deserves.`,
    careHelp: (needs) => `We help with the special care: ${needs}.`,
    unknown: "We don’t know yet how they react to everyone in your home. We’ll talk about it on the visit.",
    goodCompany: (n) => `${n} could be good company. Come and meet them.`,
  },
  es: {
    noKids: (n) => `${n} prefiere una casa sin niños.`,
    onlyCat: (n) => `${n} prefiere ser el único gato de la casa.`,
    noDogs: (n) => `${n} no se lleva bien con perros.`,
    needsCare: (n, needs) => `${n} necesita cuidados especiales: ${needs}.`,
    likesKids: (n) => `A ${n} le gustan los niños.`,
    likesCats: (n) => `${n} se lleva bien con otros gatos.`,
    likesDogs: (n) => `${n} se lleva bien con perros.`,
    quietHome: "Su casa es tranquila, sin otros animales ni niños.",
    calm: (n) => `${n} es tranquilo, como busca.`,
    active: (n) => `${n} es activo y juguetón, como busca.`,
    seniorTime: (n) => `Tiene tiempo para dar a ${n} la compañía que merece un gato sénior.`,
    careHelp: (needs) => `Le ayudamos con los cuidados especiales: ${needs}.`,
    unknown: "Aún no sabemos cómo reacciona ante todos los miembros de su casa. Lo hablamos en la visita.",
    goodCompany: (n) => `${n} puede ser una buena compañía. Venga a conocerlo.`,
  },
  fr: {
    noKids: (n) => `${n} préfère une maison sans enfants.`,
    onlyCat: (n) => `${n} préfère être le seul chat de la maison.`,
    noDogs: (n) => `${n} ne s’entend pas avec les chiens.`,
    needsCare: (n, needs) => `${n} a besoin de soins particuliers : ${needs}.`,
    likesKids: (n) => `${n} aime les enfants.`,
    likesCats: (n) => `${n} s’entend bien avec les autres chats.`,
    likesDogs: (n) => `${n} s’entend bien avec les chiens.`,
    quietHome: "Votre maison est calme, sans autres animaux ni enfants.",
    calm: (n) => `${n} est calme, comme vous le souhaitez.`,
    active: (n) => `${n} est vif et joueur, comme vous le souhaitez.`,
    seniorTime: (n) => `Vous avez le temps de donner à ${n} la compagnie que mérite un chat senior.`,
    careHelp: (needs) => `Nous vous aidons pour les soins particuliers : ${needs}.`,
    unknown: "Nous ne savons pas encore comment il réagit avec chaque membre de votre foyer. Nous en parlerons lors de la visite.",
    goodCompany: (n) => `${n} pourrait être un bon compagnon. Venez le rencontrer.`,
  },
};

/** Dates in this language ("12 October 2026", "3 weeks ago"). */
export const dates = (lang: Lang) => datesIn(locale[lang]);

/** "domingo, 15 de novembro, das 10h00 às 17h00", like eventWhen in the domain, in this language. */
export function eventWhen(lang: Lang, e: Pick<PostEvent, "startsAt" | "endsAt">): string {
  const tz = "Europe/Lisbon";
  const loc = locale[lang];
  const hour = (iso: string) => new Intl.DateTimeFormat(loc, { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: tz }).format(new Date(iso));
  const day = (iso: string) => new Intl.DateTimeFormat(loc, { weekday: "long", day: "numeric", month: "long", timeZone: tz }).format(new Date(iso));
  const key = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date(iso));
  const w: Tr<{ range: (d: string, a: string, b: string) => string; span: (d1: string, h: string, d2: string) => string; at: (d: string, h: string) => string }> = {
    pt: { range: (d, a, b) => `${d}, das ${a.replace(":", "h")} às ${b.replace(":", "h")}`, span: (d1, h, d2) => `de ${d1}, às ${h.replace(":", "h")}, a ${d2}`, at: (d, h) => `${d}, às ${h.replace(":", "h")}` },
    en: { range: (d, a, b) => `${d}, ${a} to ${b}`, span: (d1, h, d2) => `from ${d1} at ${h} to ${d2}`, at: (d, h) => `${d} at ${h}` },
    es: { range: (d, a, b) => `${d}, de ${a} a ${b}`, span: (d1, h, d2) => `del ${d1}, a las ${h}, al ${d2}`, at: (d, h) => `${d}, a las ${h}` },
    fr: { range: (d, a, b) => `${d}, de ${a.replace(":", " h ")} à ${b.replace(":", " h ")}`, span: (d1, h, d2) => `du ${d1}, à ${h.replace(":", " h ")}, au ${d2}`, at: (d, h) => `${d}, à ${h.replace(":", " h ")}` },
  };
  const t = w[lang];
  if (e.endsAt && key(e.startsAt) === key(e.endsAt)) return t.range(day(e.startsAt), hour(e.startsAt), hour(e.endsAt));
  if (e.endsAt) return t.span(day(e.startsAt), hour(e.startsAt), day(e.endsAt));
  return t.at(day(e.startsAt), hour(e.startsAt));
}

/** "Início", "Adotar"…: the words in breadcrumbs, used on nearly every page. */
export const crumbs: Tr<{ home: string; adopt: string; help: string; donate: string; about: string; news: string; shop: string; sponsor: string }> = {
  pt: { home: "Início", adopt: "Adotar", help: "Ajudar", donate: "Doar", about: "Sobre nós", news: "Notícias", shop: "Loja solidária", sponsor: "Apadrinhar" },
  en: { home: "Home", adopt: "Adopt", help: "Help", donate: "Donate", about: "About us", news: "News", shop: "Charity shop", sponsor: "Sponsor" },
  es: { home: "Inicio", adopt: "Adoptar", help: "Ayudar", donate: "Donar", about: "Sobre nosotros", news: "Noticias", shop: "Tienda solidaria", sponsor: "Apadrinar" },
  fr: { home: "Accueil", adopt: "Adopter", help: "Aider", donate: "Donner", about: "À propos", news: "Actualités", shop: "Boutique solidaire", sponsor: "Parrainer" },
};

/** The checks in the forms (written in Portuguese in the shared rules), in the other languages. */
const validation: Record<Exclude<Lang, "pt">, Record<string, string>> = {
  en: {
    "Indique o seu nome": "Please enter your name",
    "Escreva o seu nome": "Please enter your name",
    "Indique um telefone com pelo menos 9 números": "Please enter a phone number with at least 9 digits",
    "Indique um email válido": "Please enter a valid email",
    "Indique um email válido para lhe respondermos": "Please enter a valid email so we can reply",
    "Indique um email para receber notícias": "Please enter an email to receive news",
    "Indique onde vive": "Please tell us where you live",
    "Indique a localidade": "Please enter your town",
    "Indique o nome do negócio": "Please enter the business name",
    "Indique a morada completa, com código postal": "Please enter the full address, with postcode",
    "Indique um valor em euros": "Please enter an amount in euros",
    "Escolha o assunto": "Please choose a topic",
    "Escreva a sua mensagem": "Please write your message",
    "Escreva a sua mensagem (pelo menos 10 letras)": "Please write your message (at least 10 characters)",
    "A mensagem é demasiado longa (máximo 4000 letras)": "The message is too long (4000 characters at most)",
    "Diga-nos o que quer doar": "Tell us what you would like to give",
    "Diga quanto quer doar": "Tell us how much you would like to give",
    "O donativo tem de ser pelo menos 1 €": "The donation must be at least €1",
    "Precisa de aceitar para o contactarmos": "Please tick the box so we can contact you",
    "Precisa de aceitar para lhe respondermos": "Please tick the box so we can reply",
    "Precisa de aceitar para receber emails": "Please tick the box to receive emails",
    "Precisa de aceitar para receber os avisos": "Please tick the box to receive the alerts",
    "Alguns campos não estão corretos.": "Some fields are not right.",
    "Não foi possível enviar. Tente outra vez.": "It could not be sent. Please try again.",
    "Sem ligação à internet. Verifique a ligação e tente outra vez.": "No internet connection. Check your connection and try again.",
    "O navegador não deixou mostrar notificações. Pode mudar isso nas definições do site, ou receber os avisos por email.": "The browser didn’t allow notifications. You can change that in the site settings, or get the alerts by email.",
    "Não foi possível ligar as notificações neste aparelho. Pode receber os avisos por email.": "Notifications couldn’t be turned on on this device. You can get the alerts by email.",
  },
  es: {
    "Indique o seu nome": "Indique su nombre",
    "Escreva o seu nome": "Indique su nombre",
    "Indique um telefone com pelo menos 9 números": "Indique un teléfono de al menos 9 cifras",
    "Indique um email válido": "Indique un correo electrónico válido",
    "Indique um email válido para lhe respondermos": "Indique un correo válido para que podamos responderle",
    "Indique um email para receber notícias": "Indique un correo para recibir noticias",
    "Indique onde vive": "Indique dónde vive",
    "Indique a localidade": "Indique la localidad",
    "Indique o nome do negócio": "Indique el nombre del negocio",
    "Indique a morada completa, com código postal": "Indique la dirección completa, con código postal",
    "Indique um valor em euros": "Indique una cantidad en euros",
    "Escolha o assunto": "Elija el asunto",
    "Escreva a sua mensagem": "Escriba su mensaje",
    "Escreva a sua mensagem (pelo menos 10 letras)": "Escriba su mensaje (al menos 10 letras)",
    "A mensagem é demasiado longa (máximo 4000 letras)": "El mensaje es demasiado largo (máximo 4000 letras)",
    "Diga-nos o que quer doar": "Díganos qué quiere donar",
    "Diga quanto quer doar": "Díganos cuánto quiere donar",
    "O donativo tem de ser pelo menos 1 €": "El donativo debe ser de al menos 1 €",
    "Precisa de aceitar para o contactarmos": "Tiene que aceptar para que le contactemos",
    "Precisa de aceitar para lhe respondermos": "Tiene que aceptar para que le respondamos",
    "Precisa de aceitar para receber emails": "Tiene que aceptar para recibir correos",
    "Precisa de aceitar para receber os avisos": "Tiene que aceptar para recibir los avisos",
    "Alguns campos não estão corretos.": "Algunos campos no son correctos.",
    "Não foi possível enviar. Tente outra vez.": "No se ha podido enviar. Inténtelo de nuevo.",
    "Sem ligação à internet. Verifique a ligação e tente outra vez.": "Sin conexión a internet. Compruebe la conexión e inténtelo de nuevo.",
    "O navegador não deixou mostrar notificações. Pode mudar isso nas definições do site, ou receber os avisos por email.": "El navegador no ha permitido mostrar notificaciones. Puede cambiarlo en la configuración del sitio o recibir los avisos por correo.",
    "Não foi possível ligar as notificações neste aparelho. Pode receber os avisos por email.": "No se han podido activar las notificaciones en este dispositivo. Puede recibir los avisos por correo.",
  },
  fr: {
    "Indique o seu nome": "Indiquez votre nom",
    "Escreva o seu nome": "Indiquez votre nom",
    "Indique um telefone com pelo menos 9 números": "Indiquez un numéro de téléphone d’au moins 9 chiffres",
    "Indique um email válido": "Indiquez une adresse e-mail valide",
    "Indique um email válido para lhe respondermos": "Indiquez une adresse e-mail valide pour que nous puissions répondre",
    "Indique um email para receber notícias": "Indiquez une adresse e-mail pour recevoir des nouvelles",
    "Indique onde vive": "Indiquez où vous habitez",
    "Indique a localidade": "Indiquez la localité",
    "Indique o nome do negócio": "Indiquez le nom du commerce",
    "Indique a morada completa, com código postal": "Indiquez l’adresse complète, avec le code postal",
    "Indique um valor em euros": "Indiquez un montant en euros",
    "Escolha o assunto": "Choisissez le sujet",
    "Escreva a sua mensagem": "Écrivez votre message",
    "Escreva a sua mensagem (pelo menos 10 letras)": "Écrivez votre message (au moins 10 caractères)",
    "A mensagem é demasiado longa (máximo 4000 letras)": "Le message est trop long (4000 caractères maximum)",
    "Diga-nos o que quer doar": "Dites-nous ce que vous voulez donner",
    "Diga quanto quer doar": "Dites-nous combien vous voulez donner",
    "O donativo tem de ser pelo menos 1 €": "Le don doit être d’au moins 1 €",
    "Precisa de aceitar para o contactarmos": "Cochez la case pour que nous puissions vous contacter",
    "Precisa de aceitar para lhe respondermos": "Cochez la case pour que nous puissions vous répondre",
    "Precisa de aceitar para receber emails": "Cochez la case pour recevoir des e-mails",
    "Precisa de aceitar para receber os avisos": "Cochez la case pour recevoir les alertes",
    "Alguns campos não estão corretos.": "Certains champs ne sont pas corrects.",
    "Não foi possível enviar. Tente outra vez.": "L’envoi n’a pas abouti. Réessayez.",
    "Sem ligação à internet. Verifique a ligação e tente outra vez.": "Pas de connexion internet. Vérifiez la connexion et réessayez.",
    "O navegador não deixou mostrar notificações. Pode mudar isso nas definições do site, ou receber os avisos por email.": "Le navigateur n’a pas autorisé les notifications. Vous pouvez changer cela dans les réglages du site, ou recevoir les alertes par e-mail.",
    "Não foi possível ligar as notificações neste aparelho. Pode receber os avisos por email.": "Impossible d’activer les notifications sur cet appareil. Vous pouvez recevoir les alertes par e-mail.",
  },
};

const fallbackError: Tr = { pt: "", en: "Please check this field", es: "Revise este campo", fr: "Vérifiez ce champ" };

/** A form message from the shared rules, in this language. Unknown ones become a plain "check this field". */
export function translateError(lang: Lang, message: string): string {
  if (lang === "pt") return message;
  const known = validation[lang][message];
  if (known) return known;
  // "O valor mínimo é 5 euros por mês" and other messages with numbers in them.
  const minimum = /^O valor mínimo é (\d+) euros por mês$/.exec(message);
  if (minimum) return { en: `The minimum is ${minimum[1]} euros a month`, es: `El mínimo es de ${minimum[1]} euros al mes`, fr: `Le minimum est de ${minimum[1]} euros par mois` }[lang];
  return fallbackError[lang];
}

type FosterHost = "bebes" | "recuperar" | "qualquer";
type FosterHowLong = "semanas" | "meses" | "necessario";

export const fosterCanHostLabel: Tr<Record<FosterHost, string>> = {
  pt: { bebes: "Gatinhos bebés", recuperar: "Um gato a recuperar", qualquer: "O que for preciso" },
  en: { bebes: "Baby kittens", recuperar: "A cat that is recovering", qualquer: "Whatever is needed" },
  es: { bebes: "Gatitos bebés", recuperar: "Un gato que se está recuperando", qualquer: "Lo que haga falta" },
  fr: { bebes: "Des chatons", recuperar: "Un chat en convalescence", qualquer: "Ce qu’il faudra" },
};

export const fosterHowLongLabel: Tr<Record<FosterHowLong, string>> = {
  pt: { semanas: "Algumas semanas", meses: "Um ou dois meses", necessario: "O tempo que for preciso" },
  en: { semanas: "A few weeks", meses: "One or two months", necessario: "As long as needed" },
  es: { semanas: "Algunas semanas", meses: "Uno o dos meses", necessario: "El tiempo que haga falta" },
  fr: { semanas: "Quelques semaines", meses: "Un ou deux mois", necessario: "Le temps qu’il faudra" },
};

export const itemConditionLabel: Tr<Record<"novo" | "como-novo" | "usado", string>> = {
  pt: { novo: "Novo, nunca usado", "como-novo": "Usado, como novo", usado: "Usado, com marcas de uso" },
  en: { novo: "New, never used", "como-novo": "Used, as good as new", usado: "Used, with signs of wear" },
  es: { novo: "Nuevo, sin usar", "como-novo": "Usado, como nuevo", usado: "Usado, con marcas de uso" },
  fr: { novo: "Neuf, jamais utilisé", "como-novo": "Utilisé, comme neuf", usado: "Utilisé, avec des traces d’usage" },
};

export const itemHandoverLabel: Tr<Record<"entrego" | "recolha", string>> = {
  pt: { entrego: "Entrego no gatil ou numa banca", recolha: "Preciso que alguém vá buscar" },
  en: { entrego: "I’ll bring it to the shelter or a stall", recolha: "I need someone to collect it" },
  es: { entrego: "Lo entrego en el refugio o en un puesto", recolha: "Necesito que alguien vaya a recogerlo" },
  fr: { entrego: "Je le dépose au refuge ou sur un stand", recolha: "J’ai besoin qu’on vienne le chercher" },
};
