"use client";
import { useEffect, useState } from "react";
import { firstName } from "@gn/domain";
import { IconPaw } from "@gn/ui";
import { readSignedIn, SIGNED_IN_EVENT } from "@/lib/conta";
import { CUIDADOS_EVENT, cuidadosClient } from "@/lib/cuidados";
import { useI18n } from "@/lib/i18n/client";

/** "Entrar" in the header, or the person's first name once signed in, with new gatil notifications. */
export function AccountLink() {
  const { t } = useI18n();
  const [who, setWho] = useState<{ name: string } | null>(null);
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    const sync = () => {
      const signedIn = readSignedIn();
      setWho(signedIn);
      if (!signedIn) { setUnread(0); return; }
      cuidadosClient().summary().then((s) => setUnread(s?.volunteer ? s.unread : 0)).catch(() => setUnread(0));
    };
    sync();
    const events = [SIGNED_IN_EVENT, CUIDADOS_EVENT, "storage"];
    events.forEach((e) => window.addEventListener(e, sync));
    const timer = window.setInterval(sync, 120_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, sync));
      window.clearInterval(timer);
    };
  }, []);
  const news = unread === 1 ? ", 1 notificação nova do gatil" : unread > 1 ? `, ${unread} notificações novas do gatil` : "";
  // The personal area is only in Portuguese (volunteers and members are local); the button says so in the other languages.
  const signIn = t({ pt: "Entrar na minha conta", en: "Sign in (in Portuguese)", es: "Entrar en mi cuenta (en portugués)", fr: "Se connecter (en portugais)" });
  return (
    <a className="gn-btn gn-btn--quiet account-link" href="/conta" hrefLang="pt-PT" aria-label={who ? `A minha conta (${firstName(who.name)})${news}` : signIn}>
      <span className="account-link__icon" aria-hidden="true"><IconPaw /></span>
      <span>{who ? firstName(who.name) : t({ pt: "Entrar", en: "Sign in", es: "Entrar", fr: "Connexion" })}</span>
      {unread > 0 ? <span className="account-link__count" aria-hidden="true">{unread > 9 ? "9+" : unread}</span> : null}
    </a>
  );
}
