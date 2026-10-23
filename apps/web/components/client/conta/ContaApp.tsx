"use client";
import { useCallback, useEffect, useState } from "react";
import { Notice } from "@gn/ui";
import { contaClient, type MeuPainel } from "@/lib/conta";
import { Painel } from "./Painel";
import { SignIn } from "./SignIn";

/** /conta: sign in when needed, otherwise the helper's own page. */
export function ContaApp() {
  const [state, setState] = useState<{ kind: "a-carregar" } | { kind: "entrar" } | { kind: "erro" } | { kind: "painel"; painel: MeuPainel }>({ kind: "a-carregar" });
  const [welcome, setWelcome] = useState(false);

  const load = useCallback(async () => {
    try {
      const painel = await contaClient().painel();
      setState(painel ? { kind: "painel", painel } : { kind: "entrar" });
    } catch {
      setState({ kind: "erro" });
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  // After signing in, start the account page from the top: the gatil card and the greeting come first.
  useEffect(() => { if (state.kind === "painel") window.scrollTo(0, 0); }, [state.kind]);

  if (state.kind === "a-carregar") return <p role="status">A abrir a sua conta…</p>;
  if (state.kind === "erro") {
    return <Notice tone="error" title="Não foi possível abrir a sua conta">Verifique a ligação à internet e recarregue a página.</Notice>;
  }
  if (state.kind === "entrar") {
    return <SignIn onSignedIn={(isNew) => { setWelcome(isNew); void load(); }} />;
  }
  return <Painel painel={state.painel} welcome={welcome} onChange={load} onSignedOut={() => { setWelcome(false); setState({ kind: "entrar" }); }} />;
}
