import { Button, Container, ProgressMeter } from "@gn/ui";
import type { Impact } from "@gn/domain";

/** "Doar" on the home page, right after the cats waiting for a home: what a gift pays for, and the way in. */
export function DonateBand({ impact }: { impact: Impact }) {
  const { campaign } = impact;
  return (
    <section className="donate-band" aria-labelledby="doar-home">
      <Container>
        <div className="donate-band__inner">
          <div className="gn-stack gn-stack--s">
            <h2 id="doar-home">Não pode adotar? Pode doar.</h2>
            <p>Os donativos pagam a comida, as vacinas e o veterinário dos {impact.catsInShelter} gatos do gatil. 35 euros pagam uma esterilização.</p>
          </div>
          {campaign ? (
            <ProgressMeter label={campaign.title} value={campaign.current} max={campaign.goal} valueText={`${campaign.current} de ${campaign.goal} ${campaign.unit}`} />
          ) : null}
          <div className="donate-band__actions">
            <Button href="/doar">Fazer um donativo</Button>
            <Button href="/apadrinhar" variant="secondary">Apadrinhar um gato</Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
