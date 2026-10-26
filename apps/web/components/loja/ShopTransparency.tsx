import { euros, type ShopTransparency as Summary } from "@gn/domain";
import { StatTile } from "@gn/ui";
import { i18n } from "@/lib/i18n/server";

/** How much was donated through the shop this year and what the money paid for, kept up to date by the team. */
export function ShopTransparency({ summary }: { summary: Summary }) {
  const { lang, locale, t } = i18n();
  const day = (date: string) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
  const y = summary.year;
  return (
    <div className="gn-stack gn-stack--m">
      <div className="stats">
        <StatTile value={euros(summary.forTheCatsCents)} label={t({ pt: `para os gatos em ${y}`, en: `for the cats in ${y}`, es: `para los gatos en ${y}`, fr: `pour les chats en ${y}` })} />
        <StatTile value={summary.giftsGiven} label={t({ pt: "artigos que já saíram da loja", en: "items that have left the shop", es: "artículos que ya han salido de la tienda", fr: "articles déjà partis de la boutique" })} />
        <StatTile value={euros(summary.spentCents)} label={t({ pt: "já gastos em comida e tratamentos", en: "already spent on food and treatment", es: "ya gastados en comida y tratamientos", fr: "déjà dépensés en nourriture et en soins" })} />
      </div>
      {summary.spending.length > 0 ? (
        <div className="gn-stack gn-stack--s">
          <h3>{t({ pt: "Em que foi gasto", en: "What it was spent on", es: "En qué se ha gastado", fr: "À quoi l’argent a servi" })}</h3>
          <ul className="spending">
            {summary.spending.map((s) => (
              <li key={s.id}>
                <span><time className="spending__date" dateTime={s.date}>{day(s.date)}</time> <span lang={lang === "pt" ? undefined : "pt-PT"}>{s.description}</span></span>
                <strong>{euros(s.amountCents)}</strong>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="small muted">{t({
        pt: `Donativos recebidos desde 1 de janeiro de ${y}, já sem o custo dos artigos. A equipa atualiza a lista de gastos sempre que usa este dinheiro.`,
        en: `Donations received since 1 January ${y}, after the cost of the items. The team updates the list of spending every time this money is used.`,
        es: `Donativos recibidos desde el 1 de enero de ${y}, ya descontado el coste de los artículos. El equipo actualiza la lista de gastos cada vez que usa este dinero.`,
        fr: `Dons reçus depuis le 1er janvier ${y}, coût des articles déduit. L’équipe met à jour la liste des dépenses chaque fois qu’elle utilise cet argent.`,
      })}</p>
    </div>
  );
}
