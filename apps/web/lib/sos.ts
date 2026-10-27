/**
 * Emergency guide as a decision tree, from the association's "Manual de Emergência".
 * The answers point to vets and public services, never to the association, which wants as few
 * found-cat requests as possible (Pedro, 2026-10-26): the site's focus is adopting and donating.
 */
export type SosNode =
  | { kind: "question"; id: string; question: string; options: { label: string; next: string }[] }
  | { kind: "answer"; id: string; title: string; urgent?: boolean; steps: string[] };

export const sosTree: Record<string, SosNode> = {
  inicio: {
    kind: "question",
    id: "inicio",
    question: "O que encontrou?",
    options: [
      { label: "Um gato ferido ou atropelado", next: "ferido" },
      { label: "Gatinhos bebés", next: "bebes" },
      { label: "Um gato adulto na rua", next: "adulto" },
      { label: "Um gato dentro do motor do carro", next: "motor" },
      { label: "Um gato morto", next: "morto" },
    ],
  },
  ferido: {
    kind: "answer",
    id: "ferido",
    urgent: true,
    title: "Leve-o já ao veterinário mais próximo",
    steps: ["Cada minuto conta.", "Pegue no gato com cuidado, de preferência com uma toalha ou manta.", "Leve-o à clínica veterinária mais próxima.", "Um veterinário consegue ler o chip e encontrar a família, se o gato tiver dono."],
  },
  bebes: {
    kind: "question",
    id: "bebes",
    question: "A mãe está por perto?",
    options: [
      { label: "Sim, e é meiga", next: "bebes-mae-meiga" },
      { label: "Sim, mas é assustada", next: "colonia" },
      { label: "Não vejo a mãe", next: "bebes-sozinhos" },
    ],
  },
  "bebes-mae-meiga": {
    kind: "answer",
    id: "bebes-mae-meiga",
    title: "Deixe os bebés com a mãe",
    steps: ["Se conseguir pegar na mãe, leve a família para um sítio seguro e tranquilo.", "Dê-lhes água, comida, uma manta e uma caixa de areia.", "Quando os bebés tiverem 2 meses, leve a mãe a esterilizar: a Câmara Municipal e muitos veterinários têm campanhas a preço reduzido."],
  },
  "bebes-sozinhos": {
    kind: "question",
    id: "bebes-sozinhos",
    question: "Os bebés já têm os olhos abertos e andam?",
    options: [
      { label: "Não, são muito pequeninos", next: "recem-nascidos" },
      { label: "Sim, já andam", next: "bebes-independentes" },
    ],
  },
  "recem-nascidos": {
    kind: "answer",
    id: "recem-nascidos",
    urgent: true,
    title: "Mantenha-os quentes e leve-os já ao veterinário",
    steps: ["Embrulhe-os numa manta para não arrefecerem.", "Não lhes dê leite de vaca.", "Leve-os ao veterinário mais próximo hoje: os recém-nascidos correm grande risco e precisam de leite próprio para gatinhos."],
  },
  "bebes-independentes": {
    kind: "answer",
    id: "bebes-independentes",
    title: "Leve-os para um sítio seguro",
    steps: ["Coloque-os num espaço seguro e confortável.", "Dê-lhes água, comida e uma caixa de areia.", "Partilhe fotografias nos grupos de animais da sua zona para lhes encontrar família."],
  },
  adulto: {
    kind: "question",
    id: "adulto",
    question: "Como é o gato?",
    options: [
      { label: "É meigo e deixa-se pegar", next: "adulto-meigo" },
      { label: "É assustado ou vive num grupo de gatos", next: "colonia" },
      { label: "Parece doente", next: "doente" },
    ],
  },
  "adulto-meigo": {
    kind: "answer",
    id: "adulto-meigo",
    title: "Pode ter dono: leve-o para um sítio seguro",
    steps: ["Leve-o para um espaço seguro com água, comida, uma manta e areia.", "Peça a um veterinário que leia o chip: é rápido e pode devolvê-lo à família.", "Partilhe uma fotografia no Facebook da sua zona: pode ser um gato perdido."],
  },
  colonia: {
    kind: "answer",
    id: "colonia",
    title: "Deixe-os onde estão e avise a Junta",
    steps: ["Não tente apanhar gatos assustados: podem fugir ou magoar-se.", "Anote a morada exata ou um ponto de referência.", "Avise a Junta de Freguesia ou a Câmara Municipal: tratam da esterilização das colónias de rua (programa CED)."],
  },
  doente: {
    kind: "answer",
    id: "doente",
    title: "Leve-o ao veterinário, se possível",
    steps: ["Se o gato se deixar pegar, leve-o a um veterinário.", "Se for assustado, avise a Junta de Freguesia ou a Câmara Municipal com o local exato e uma fotografia, se possível."],
  },
  motor: {
    kind: "question",
    id: "motor",
    question: "O gato está ferido?",
    options: [
      { label: "Sim, ou não se mexe", next: "ferido" },
      { label: "Não parece ferido", next: "motor-ok" },
    ],
  },
  "motor-ok": {
    kind: "answer",
    id: "motor-ok",
    title: "Retire-o com cuidado",
    steps: ["Se for meigo, retire-o com cuidado e leve-o para um sítio seguro.", "Se for assustado, abra o capô, afaste-se e dê-lhe tempo para sair.", "Dica para o inverno: bata no capô antes de ligar o carro."],
  },
  morto: {
    kind: "answer",
    id: "morto",
    title: "Avise a Câmara Municipal",
    steps: ["A Câmara Municipal ou a Junta de Freguesia tratam da recolha: indique o local exato.", "Se tiver coleira, um veterinário pode ler o chip para avisar a família."],
  },
};

export function nextNode(currentId: string, optionIndex: number): SosNode | undefined {
  const node = sosTree[currentId];
  if (!node || node.kind !== "question") return undefined;
  const option = node.options[optionIndex];
  return option ? sosTree[option.next] : undefined;
}

/** The tree's words in the other languages (same nodes and order); Portuguese services keep their names. */
type NodeWords = { question: string; options: string[] } | { title: string; steps: string[] };
const translations: Record<"en" | "es" | "fr", Record<string, NodeWords>> = {
  en: {
    inicio: { question: "What did you find?", options: ["An injured cat or one hit by a car", "Kittens", "An adult cat in the street", "A cat inside a car engine", "A dead cat"] },
    ferido: { title: "Take them to the nearest vet now", steps: ["Every minute counts.", "Pick the cat up carefully, ideally with a towel or blanket.", "Take them to the nearest vet clinic.", "A vet can read the microchip and find the family, if the cat has one."] },
    bebes: { question: "Is the mother nearby?", options: ["Yes, and she is friendly", "Yes, but she is frightened", "I can’t see the mother"] },
    "bebes-mae-meiga": { title: "Leave the kittens with their mother", steps: ["If you can pick up the mother, take the family somewhere safe and quiet.", "Give them water, food, a blanket and a litter tray.", "When the kittens are 2 months old, have the mother spayed: the Câmara Municipal (town council) and many vets run low-cost campaigns."] },
    "bebes-sozinhos": { question: "Are the kittens’ eyes open, and can they walk?", options: ["No, they are very tiny", "Yes, they can walk"] },
    "recem-nascidos": { title: "Keep them warm and take them to the vet now", steps: ["Wrap them in a blanket so they don’t get cold.", "Don’t give them cow’s milk.", "Take them to the nearest vet today: newborns are at great risk and need special kitten milk."] },
    "bebes-independentes": { title: "Take them somewhere safe", steps: ["Put them in a safe, comfortable space.", "Give them water, food and a litter tray.", "Share photos in the animal groups in your area to find them a family."] },
    adulto: { question: "What is the cat like?", options: ["Friendly and lets me pick them up", "Frightened, or lives in a group of cats", "Looks ill"] },
    "adulto-meigo": { title: "They may have an owner: take them somewhere safe", steps: ["Take them to a safe space with water, food, a blanket and litter.", "Ask a vet to read the microchip: it’s quick and can get them back to their family.", "Share a photo on your area’s Facebook groups: it may be a lost cat."] },
    colonia: { title: "Leave them where they are and tell the Junta", steps: ["Don’t try to catch frightened cats: they may run away or get hurt.", "Note the exact address or a landmark.", "Tell the Junta de Freguesia (parish council) or the Câmara Municipal (town council): they handle neutering of street colonies (TNR programme)."] },
    doente: { title: "Take them to the vet, if you can", steps: ["If the cat lets you pick them up, take them to a vet.", "If they are frightened, tell the Junta de Freguesia or the Câmara Municipal, with the exact place and a photo if possible."] },
    motor: { question: "Is the cat injured?", options: ["Yes, or not moving", "Doesn’t look injured"] },
    "motor-ok": { title: "Take them out carefully", steps: ["If they are friendly, take them out carefully and somewhere safe.", "If they are frightened, open the bonnet, step back and give them time to come out.", "Winter tip: knock on the bonnet before starting the car."] },
    morto: { title: "Tell the Câmara Municipal", steps: ["The Câmara Municipal (town council) or the Junta de Freguesia collect dead animals: give them the exact place.", "If the cat has a collar, a vet can read the microchip to let the family know."] },
  },
  es: {
    inicio: { question: "¿Qué ha encontrado?", options: ["Un gato herido o atropellado", "Gatitos bebés", "Un gato adulto en la calle", "Un gato dentro del motor del coche", "Un gato muerto"] },
    ferido: { title: "Llévelo ya al veterinario más cercano", steps: ["Cada minuto cuenta.", "Coja al gato con cuidado, mejor con una toalla o una manta.", "Llévelo a la clínica veterinaria más cercana.", "Un veterinario puede leer el microchip y encontrar a la familia, si el gato tiene dueño."] },
    bebes: { question: "¿Está la madre cerca?", options: ["Sí, y es cariñosa", "Sí, pero está asustada", "No veo a la madre"] },
    "bebes-mae-meiga": { title: "Deje a los bebés con su madre", steps: ["Si puede coger a la madre, lleve a la familia a un sitio seguro y tranquilo.", "Deles agua, comida, una manta y un arenero.", "Cuando los bebés tengan 2 meses, lleve a la madre a esterilizar: la Câmara Municipal (ayuntamiento) y muchos veterinarios tienen campañas a precio reducido."] },
    "bebes-sozinhos": { question: "¿Los bebés ya tienen los ojos abiertos y andan?", options: ["No, son muy pequeñitos", "Sí, ya andan"] },
    "recem-nascidos": { title: "Manténgalos calientes y llévelos ya al veterinario", steps: ["Envuélvalos en una manta para que no se enfríen.", "No les dé leche de vaca.", "Llévelos hoy al veterinario más cercano: los recién nacidos corren un gran riesgo y necesitan leche especial para gatitos."] },
    "bebes-independentes": { title: "Llévelos a un sitio seguro", steps: ["Póngalos en un espacio seguro y cómodo.", "Deles agua, comida y un arenero.", "Comparta fotos en los grupos de animales de su zona para encontrarles familia."] },
    adulto: { question: "¿Cómo es el gato?", options: ["Es cariñoso y se deja coger", "Es asustadizo o vive en un grupo de gatos", "Parece enfermo"] },
    "adulto-meigo": { title: "Puede tener dueño: llévelo a un sitio seguro", steps: ["Llévelo a un espacio seguro con agua, comida, una manta y arena.", "Pida a un veterinario que lea el microchip: es rápido y puede devolverlo a su familia.", "Comparta una foto en el Facebook de su zona: puede ser un gato perdido."] },
    colonia: { title: "Déjelos donde están y avise a la Junta", steps: ["No intente coger gatos asustados: pueden huir o hacerse daño.", "Apunte la dirección exacta o un punto de referencia.", "Avise a la Junta de Freguesia (junta parroquial) o a la Câmara Municipal: se ocupan de esterilizar las colonias callejeras (programa CER)."] },
    doente: { title: "Llévelo al veterinario, si puede", steps: ["Si el gato se deja coger, llévelo a un veterinario.", "Si está asustado, avise a la Junta de Freguesia o a la Câmara Municipal con el lugar exacto y una foto, si es posible."] },
    motor: { question: "¿El gato está herido?", options: ["Sí, o no se mueve", "No parece herido"] },
    "motor-ok": { title: "Sáquelo con cuidado", steps: ["Si es cariñoso, sáquelo con cuidado y llévelo a un sitio seguro.", "Si está asustado, abra el capó, apártese y dele tiempo para salir.", "Consejo para el invierno: dé unos golpes en el capó antes de arrancar el coche."] },
    morto: { title: "Avise a la Câmara Municipal", steps: ["La Câmara Municipal (ayuntamiento) o la Junta de Freguesia se encargan de la recogida: indique el lugar exacto.", "Si lleva collar, un veterinario puede leer el microchip para avisar a la familia."] },
  },
  fr: {
    inicio: { question: "Qu’avez-vous trouvé ?", options: ["Un chat blessé ou renversé", "Des chatons", "Un chat adulte dans la rue", "Un chat dans le moteur d’une voiture", "Un chat mort"] },
    ferido: { title: "Emmenez-le tout de suite chez le vétérinaire le plus proche", steps: ["Chaque minute compte.", "Prenez le chat avec précaution, de préférence dans une serviette ou une couverture.", "Emmenez-le à la clinique vétérinaire la plus proche.", "Un vétérinaire peut lire la puce et retrouver la famille, si le chat en a une."] },
    bebes: { question: "La mère est-elle dans les parages ?", options: ["Oui, et elle est gentille", "Oui, mais elle a peur", "Je ne vois pas la mère"] },
    "bebes-mae-meiga": { title: "Laissez les chatons avec leur mère", steps: ["Si vous pouvez prendre la mère, emmenez la famille dans un endroit sûr et calme.", "Donnez-leur de l’eau, de la nourriture, une couverture et une litière.", "Quand les chatons ont 2 mois, faites stériliser la mère : la Câmara Municipal (mairie) et beaucoup de vétérinaires font des campagnes à prix réduit."] },
    "bebes-sozinhos": { question: "Les chatons ont-ils les yeux ouverts et marchent-ils ?", options: ["Non, ils sont tout petits", "Oui, ils marchent"] },
    "recem-nascidos": { title: "Gardez-les au chaud et emmenez-les tout de suite chez le vétérinaire", steps: ["Enveloppez-les dans une couverture pour qu’ils ne prennent pas froid.", "Ne leur donnez pas de lait de vache.", "Emmenez-les chez le vétérinaire le plus proche aujourd’hui : les nouveau-nés courent un grand risque et ont besoin de lait spécial chaton."] },
    "bebes-independentes": { title: "Mettez-les en sécurité", steps: ["Installez-les dans un endroit sûr et confortable.", "Donnez-leur de l’eau, de la nourriture et une litière.", "Partagez des photos dans les groupes d’animaux de votre région pour leur trouver une famille."] },
    adulto: { question: "Comment est le chat ?", options: ["Il est gentil et se laisse prendre", "Il a peur ou vit dans un groupe de chats", "Il a l’air malade"] },
    "adulto-meigo": { title: "Il a peut-être un maître : mettez-le en sécurité", steps: ["Installez-le dans un endroit sûr avec de l’eau, de la nourriture, une couverture et une litière.", "Demandez à un vétérinaire de lire la puce : c’est rapide et cela peut le ramener à sa famille.", "Partagez une photo sur le Facebook de votre région : c’est peut-être un chat perdu."] },
    colonia: { title: "Laissez-les où ils sont et prévenez la Junta", steps: ["N’essayez pas d’attraper des chats craintifs : ils peuvent s’enfuir ou se blesser.", "Notez l’adresse exacte ou un point de repère.", "Prévenez la Junta de Freguesia (conseil de paroisse) ou la Câmara Municipal (mairie) : elles s’occupent de stériliser les colonies de rue (programme de capture-stérilisation)."] },
    doente: { title: "Emmenez-le chez le vétérinaire, si possible", steps: ["Si le chat se laisse prendre, emmenez-le chez un vétérinaire.", "S’il a peur, prévenez la Junta de Freguesia ou la Câmara Municipal en indiquant le lieu exact et, si possible, avec une photo."] },
    motor: { question: "Le chat est-il blessé ?", options: ["Oui, ou il ne bouge pas", "Il n’a pas l’air blessé"] },
    "motor-ok": { title: "Sortez-le avec précaution", steps: ["S’il est gentil, sortez-le avec précaution et mettez-le en sécurité.", "S’il a peur, ouvrez le capot, éloignez-vous et laissez-lui le temps de sortir.", "Astuce d’hiver : tapez sur le capot avant de démarrer."] },
    morto: { title: "Prévenez la Câmara Municipal", steps: ["La Câmara Municipal (mairie) ou la Junta de Freguesia s’occupent du ramassage : indiquez le lieu exact.", "S’il a un collier, un vétérinaire peut lire la puce pour prévenir la famille."] },
  },
};

/** The emergency guide in one language: the same tree with that language's words. */
export function sosTreeIn(lang: "pt" | "en" | "es" | "fr"): Record<string, SosNode> {
  if (lang === "pt") return sosTree;
  const words = translations[lang];
  return Object.fromEntries(Object.entries(sosTree).map(([id, node]) => {
    const w = words[id];
    if (!w) return [id, node];
    if (node.kind === "question" && "question" in w) return [id, { ...node, question: w.question, options: node.options.map((o, i) => ({ ...o, label: w.options[i] ?? o.label })) }];
    if (node.kind === "answer" && "title" in w) return [id, { ...node, title: w.title, steps: w.steps }];
    return [id, node];
  }));
}
