import { ProgressMeter } from "@gn/ui";
import type { Impact } from "@gn/domain";
import { i18n } from "@/lib/i18n/server";

/** The current campaign's progress ("18 de 30 gatos"), with its title in the visitor's language when the team gave one. */
export function CampaignMeter({ campaign }: { campaign: NonNullable<Impact["campaign"]> }) {
  const { lang, t } = i18n();
  const words = lang !== "pt" ? campaign.translations?.[lang] : undefined;
  const unit = words?.unit ?? campaign.unit;
  const { current, goal } = campaign;
  return (
    <ProgressMeter
      label={words?.title ?? campaign.title}
      value={current}
      max={goal}
      valueText={t({ pt: `${current} de ${goal} ${unit}`, en: `${current} of ${goal} ${unit}`, es: `${current} de ${goal} ${unit}`, fr: `${current} sur ${goal} ${unit}` })}
    />
  );
}
