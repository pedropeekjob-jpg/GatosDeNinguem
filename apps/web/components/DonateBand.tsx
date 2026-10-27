import { Button, Container } from "@gn/ui";
import type { Impact } from "@gn/domain";
import { i18n } from "@/lib/i18n/server";
import { CampaignMeter } from "./CampaignMeter";

/** "Doar" on the home page, right after the cats waiting for a home: what a gift pays for, and the way in. */
export function DonateBand({ impact }: { impact: Impact }) {
  const { t, l } = i18n();
  const { campaign } = impact;
  const n = impact.catsInShelter;
  return (
    <section className="donate-band" aria-labelledby="doar-home">
      <Container>
        <div className="donate-band__inner">
          <div className="gn-stack gn-stack--s">
            <h2 id="doar-home">{t({ pt: "Não pode adotar? Pode doar.", en: "Can’t adopt? You can donate.", es: "¿No puede adoptar? Puede donar.", fr: "Vous ne pouvez pas adopter ? Vous pouvez donner." })}</h2>
            <p>{t({
              pt: `Os donativos pagam a comida, as vacinas e o veterinário dos ${n} gatos do gatil. 35 euros pagam uma esterilização.`,
              en: `Donations pay for the food, vaccines and vet care of the ${n} cats at the shelter. 35 euros pays for one neutering.`,
              es: `Los donativos pagan la comida, las vacunas y el veterinario de los ${n} gatos del refugio. 35 euros pagan una esterilización.`,
              fr: `Les dons paient la nourriture, les vaccins et le vétérinaire des ${n} chats du refuge. 35 euros paient une stérilisation.`,
            })}</p>
          </div>
          {campaign ? <CampaignMeter campaign={campaign} /> : null}
          <div className="donate-band__actions">
            <Button href={l("/doar")}>{t({ pt: "Fazer um donativo", en: "Make a donation", es: "Hacer un donativo", fr: "Faire un don" })}</Button>
            <Button href={l("/apadrinhar")} variant="secondary">{t({ pt: "Apadrinhar um gato", en: "Sponsor a cat", es: "Apadrinar un gato", fr: "Parrainer un chat" })}</Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
