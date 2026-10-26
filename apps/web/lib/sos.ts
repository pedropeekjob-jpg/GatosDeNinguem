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
