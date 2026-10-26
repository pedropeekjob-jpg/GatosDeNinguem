import { euros, type ShopTransparency as Summary } from "@gn/domain";
import { StatTile } from "@gn/ui";

const day = (date: string) => new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));

/** How much was donated through the shop this year and what the money paid for, kept up to date by the team. */
export function ShopTransparency({ summary }: { summary: Summary }) {
  return (
    <div className="gn-stack gn-stack--m">
      <div className="stats">
        <StatTile value={euros(summary.forTheCatsCents)} label={`para os gatos em ${summary.year}`} />
        <StatTile value={summary.giftsGiven} label="artigos que já saíram da loja" />
        <StatTile value={euros(summary.spentCents)} label="já gastos em comida e tratamentos" />
      </div>
      {summary.spending.length > 0 ? (
        <div className="gn-stack gn-stack--s">
          <h3>Em que foi gasto</h3>
          <ul className="spending">
            {summary.spending.map((s) => (
              <li key={s.id}>
                <span><time className="spending__date" dateTime={s.date}>{day(s.date)}</time> {s.description}</span>
                <strong>{euros(s.amountCents)}</strong>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="small muted">Donativos recebidos desde 1 de janeiro de {summary.year}, já sem o custo dos artigos. A equipa atualiza a lista de gastos sempre que usa este dinheiro.</p>
    </div>
  );
}
