export type HelpAnswers = {
  time: "nenhum" | "algumas-horas" | "muito";
  money: "nao" | "pouco" | "sim";
  space: "nao" | "sim";
};

export type HelpAction = {
  id: "partilhar" | "doar" | "apadrinhar" | "amigo" | "voluntariado" | "transporte" | "fat" | "adotar";
  title: string;
  description: string;
  href: string;
};

export const helpActions: Record<HelpAction["id"], HelpAction> = {
  partilhar: { id: "partilhar", title: "Partilhar um gato", description: "Partilhe um gato no WhatsApp ou Facebook. Muitas adoções começam assim.", href: "/adotar" },
  doar: { id: "doar", title: "Fazer um donativo", description: "Qualquer valor ajuda a pagar comida e veterinário. 35 euros pagam uma esterilização.", href: "/ajudar#doar" },
  apadrinhar: { id: "apadrinhar", title: "Apadrinhar um gato", description: "A partir de 5 euros por mês, recebe notícias do seu afilhado.", href: "/apadrinhar" },
  amigo: { id: "amigo", title: "Ser Amigo da associação", description: "24 euros por ano e descontos nos nossos parceiros.", href: "/ajudar#amigo" },
  voluntariado: { id: "voluntariado", title: "Fazer um turno no gatil", description: "Duas horas a limpar, alimentar e dar mimos. Não precisa de experiência.", href: "/ajudar#voluntariado" },
  transporte: { id: "transporte", title: "Levar gatos ao veterinário", description: "Se tem carro, ajude a levar gatos às consultas.", href: "/ajudar#voluntariado" },
  fat: { id: "fat", title: "Ser família temporária", description: "Acolha um gato em casa por umas semanas. Nós pagamos a comida e o veterinário.", href: "/ajudar/familia-temporaria" },
  adotar: { id: "adotar", title: "Adotar um gato", description: "Dê uma casa para sempre a um dos nossos gatos.", href: "/adotar/descobrir" },
};

/** One main suggestion and two alternatives. There is always something anyone can do. */
export function recommendHelp(a: HelpAnswers): { main: HelpAction; alternatives: HelpAction[] } {
  const ids: HelpAction["id"][] = [];
  if (a.space === "sim" && a.time === "muito") ids.push("adotar", "fat");
  else if (a.space === "sim") ids.push("fat");
  if (a.time !== "nenhum") ids.push("voluntariado", "transporte");
  if (a.money === "sim") ids.push("apadrinhar", "amigo", "doar");
  if (a.money === "pouco") ids.push("amigo", "doar");
  ids.push("partilhar");
  const unique = [...new Set(ids)];
  return { main: helpActions[unique[0]!], alternatives: unique.slice(1, 3).map((id) => helpActions[id]) };
}
