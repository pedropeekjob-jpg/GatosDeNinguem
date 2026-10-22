/** Emergency guide as a decision tree, from the association's "Manual de Emergência". */
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
    steps: ["Cada minuto conta.", "Pegue no gato com cuidado, de preferência com uma toalha ou manta.", "Leve-o à clínica veterinária mais próxima.", "Depois, contacte a associação para combinarmos os próximos passos."],
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
    steps: ["Se conseguir pegar na mãe, leve a família para um sítio seguro e tranquilo.", "Dê-lhes água, comida, uma manta e uma caixa de areia.", "Contacte a associação."],
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
    title: "Mantenha-os quentes e contacte-nos já",
    steps: ["Embrulhe-os numa manta para não arrefecerem.", "Não lhes dê leite de vaca.", "Contacte a associação imediatamente: os recém-nascidos correm grande risco."],
  },
  "bebes-independentes": {
    kind: "answer",
    id: "bebes-independentes",
    title: "Leve-os para um sítio seguro",
    steps: ["Coloque-os num espaço seguro e confortável.", "Dê-lhes água, comida e uma caixa de areia.", "Contacte a associação para tratarmos da adoção."],
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
    steps: ["Leve-o para um espaço seguro com água, comida, uma manta e areia.", "Contacte a associação. Podemos verificar se tem chip.", "Partilhe uma fotografia no Facebook da sua zona: pode ser um gato perdido."],
  },
  colonia: {
    kind: "answer",
    id: "colonia",
    title: "Indique-nos o local exato",
    steps: ["Não tente apanhar gatos assustados: podem fugir ou magoar-se.", "Anote a morada exata ou um ponto de referência.", "Contacte a associação. Podemos incluí-los no programa de esterilização (CED)."],
  },
  doente: {
    kind: "answer",
    id: "doente",
    title: "Contacte-nos com a localização",
    steps: ["Se o gato se deixar pegar, leve-o para um sítio seguro e contacte a associação.", "Se for assustado, indique-nos o local exato e uma fotografia, se possível."],
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
    steps: ["Se for meigo, retire-o com cuidado e contacte a associação.", "Se for assustado, abra o capô, afaste-se e dê-lhe tempo para sair.", "Dica para o inverno: bata no capô antes de ligar o carro."],
  },
  morto: {
    kind: "answer",
    id: "morto",
    title: "Indique-nos o local",
    steps: ["Indique à associação o local exato.", "Se tiver coleira, ajudamos a avisar a família."],
  },
};

export function nextNode(currentId: string, optionIndex: number): SosNode | undefined {
  const node = sosTree[currentId];
  if (!node || node.kind !== "question") return undefined;
  const option = node.options[optionIndex];
  return option ? sosTree[option.next] : undefined;
}
