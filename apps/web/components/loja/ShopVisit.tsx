import type { ShopSettings } from "@gn/domain";
import { Button } from "@gn/ui";

/** Opens Google Maps (the app on phones) with directions to the address. A link, not an embedded map, so no third-party cookies. */
export const directionsUrl = (address: string) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

/**
 * Where the shop is and when it opens, as the team wrote them in the back office.
 * Until they are known, it says so instead of showing empty lines.
 */
export function ShopVisit({ settings }: { settings: ShopSettings }) {
  const { address, landmark, hours } = settings;
  if (!address && !hours) {
    return <p className="shop-visit">Estamos a preparar a loja. Em breve dizemos aqui a morada e o horário.</p>;
  }
  return (
    <dl className="shop-visit">
      {address ? (
        <div>
          <dt>Morada</dt>
          <dd className="gn-stack gn-stack--s">
            <span>{address}{landmark ? <><br /><span className="muted">{landmark}</span></> : null}</span>
            <span className="action-row"><Button href={directionsUrl(address)} target="_blank" rel="noopener" icon={<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>}>Como chegar (Google Maps)</Button></span>
          </dd>
        </div>
      ) : null}
      <div>
        <dt>Horário</dt>
        <dd className="shop-visit__hours">{hours || "Em breve dizemos aqui o horário."}</dd>
      </div>
    </dl>
  );
}
