/** The people behind the association, shown on "Quem somos" so visitors put a face to the work.
 *  PLACEHOLDER: names, roles and photos are test data until the association sends its own
 *  (photo provenance in docs/equipa-origem/ORIGEM.md). To swap one, drop the new photo in
 *  public/equipa/ with the same file name, or change `photo` here. */
export interface TeamMember {
  name: string;
  role: string;
  /** One short line in the person's own words. */
  quote: string;
  photo: string;
}

export const teamIsPlaceholder = true;

export const team: TeamMember[] = [
  { name: "Ana Ribeiro", role: "Presidente", quote: "Comecei com uma colónia na rua e nunca mais parei.", photo: "/equipa/pessoa-1.webp" },
  { name: "Miguel Sousa", role: "Tesoureiro", quote: "Cada euro que entra vai para os gatos, e mostramos as contas.", photo: "/equipa/pessoa-2.webp" },
  { name: "Joana Faria", role: "Coordenação do gatil", quote: "Conheço os 140 pelo nome, e cada um pela mania.", photo: "/equipa/pessoa-3.webp" },
  { name: "Rui Barbosa", role: "Adoções", quote: "O melhor dia é quando um gato sénior vai para casa.", photo: "/equipa/pessoa-4.webp" },
  { name: "Sofia Lima", role: "Esterilizações e colónias", quote: "Capturar, esterilizar, devolver: é assim que se muda uma rua.", photo: "/equipa/pessoa-5.webp" },
  { name: "Carlos Pires", role: "Voluntário aos sábados", quote: "Venho pelas limpezas e fico pelos ronrons.", photo: "/equipa/pessoa-6.webp" },
];
