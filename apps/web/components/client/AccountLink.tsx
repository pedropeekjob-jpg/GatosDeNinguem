"use client";
import { useEffect, useState } from "react";
import { firstName } from "@gn/domain";
import { IconPaw } from "@gn/ui";
import { readSignedIn, SIGNED_IN_EVENT } from "@/lib/conta";

/** "Entrar" in the header, or the person's first name once signed in. */
export function AccountLink() {
  const [who, setWho] = useState<{ name: string } | null>(null);
  useEffect(() => {
    const sync = () => setWho(readSignedIn());
    sync();
    window.addEventListener(SIGNED_IN_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SIGNED_IN_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return (
    <a className="gn-btn gn-btn--quiet account-link" href="/conta" aria-label={who ? `A minha conta (${firstName(who.name)})` : "Entrar na minha conta"}>
      <span className="account-link__icon" aria-hidden="true"><IconPaw /></span>
      <span>{who ? firstName(who.name) : "Entrar"}</span>
    </a>
  );
}
