import type { ShopSettings } from "@gn/domain";
import { Button } from "@gn/ui";
import { i18n } from "@/lib/i18n/server";

/** Opens Google Maps (the app on phones) with directions to the address. A link, not an embedded map, so no third-party cookies. */
export const directionsUrl = (address: string) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

/**
 * Where the shop is and when it opens, as the team wrote them in the back office (in Portuguese).
 * Until they are known, it says so instead of showing empty lines.
 */
export function ShopVisit({ settings }: { settings: ShopSettings }) {
  const { lang, t } = i18n();
  const { address, landmark, hours } = settings;
  const soon = t({ pt: "Em breve dizemos aqui o horário.", en: "We’ll put the opening hours here soon.", es: "Pronto indicaremos aquí el horario.", fr: "Nous indiquerons bientôt les horaires ici." });
  const teamText = lang === "pt" ? undefined : "pt-PT";
  if (!address && !hours) {
    return <p className="shop-visit">{t({ pt: "Estamos a preparar a loja. Em breve dizemos aqui a morada e o horário.", en: "We are getting the shop ready. We’ll put the address and opening hours here soon.", es: "Estamos preparando la tienda. Pronto indicaremos aquí la dirección y el horario.", fr: "Nous préparons la boutique. Nous indiquerons bientôt ici l’adresse et les horaires." })}</p>;
  }
  return (
    <dl className="shop-visit">
      {address ? (
        <div>
          <dt>{t({ pt: "Morada", en: "Address", es: "Dirección", fr: "Adresse" })}</dt>
          <dd className="gn-stack gn-stack--s">
            <span>{address}{landmark ? <><br /><span className="muted" lang={teamText}>{landmark}</span></> : null}</span>
            <span className="action-row"><Button href={directionsUrl(address)} target="_blank" rel="noopener" icon={<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>}>{t({ pt: "Como chegar (Google Maps)", en: "Directions (Google Maps)", es: "Cómo llegar (Google Maps)", fr: "Itinéraire (Google Maps)" })}</Button></span>
          </dd>
        </div>
      ) : null}
      <div>
        <dt>{t({ pt: "Horário", en: "Opening hours", es: "Horario", fr: "Horaires" })}</dt>
        <dd className="shop-visit__hours" lang={hours ? teamText : undefined}>{hours || soon}</dd>
      </div>
    </dl>
  );
}
