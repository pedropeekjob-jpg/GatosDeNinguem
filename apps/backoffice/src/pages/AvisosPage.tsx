import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { defaultStrollingCatSettings, type StrollingCatSettings } from "@gn/domain";
import { Badge, Button, Checkbox, Notice, TextField } from "@gn/ui";
import { errorMessage, useApi } from "../lib/api";

const when = (iso: string) => new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Lisbon" }).format(new Date(iso));
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * "Avisem-me quando chegarem gatos": visitors sign up on the site; when a cat is saved as "Para adoção"
 * for the first time, they get an email or a notification on their device. Nothing to approve here.
 */
export function AvisosPage() {
  const api = useApi();
  const client = useQueryClient();
  const overview = useQuery({ queryKey: ["alerts"], queryFn: () => api.alertsOverview() });
  const refresh = () => client.invalidateQueries({ queryKey: ["alerts"] });
  const remove = useMutation({ mutationFn: (id: string) => api.removeAlertSubscriber(id), onSuccess: refresh });
  const resend = useMutation({ mutationFn: (catId: string) => api.resendCatAlert(catId), onSuccess: refresh });

  const data = overview.data;
  const active = data?.subscribers.filter((s) => s.status === "ativo") ?? [];
  const pending = data?.subscribers.filter((s) => s.status === "pendente") ?? [];
  const byEmail = active.filter((s) => s.channel === "email").length;

  return (
    <div className="gn-stack gn-stack--l">
      <div className="gn-stack gn-stack--s">
        <h1>Avisos de gatos novos</h1>
        <p className="muted">
          No site, as pessoas pedem para ser avisadas quando chegam gatos para adoção. Quando grava um gato como <strong>Para adoção</strong> pela
          primeira vez, o aviso sai sozinho para quem o pediu (e para quem escolheu esse tipo de gato). Não precisa de fazer mais nada.
        </p>
      </div>
      {overview.isError ? <Notice tone="error" title="Erro">{errorMessage(overview.error)}</Notice> : null}
      {data && !data.setup.email ? (
        <Notice tone="warning" title="Os emails ainda não estão ligados">
          As inscrições ficam guardadas, mas os emails de confirmação e os avisos só saem quando o servidor tiver a chave do Resend (RESEND_API_KEY).
        </Notice>
      ) : null}
      {data ? (
        <p className="bo-alert-stats">
          <strong>{plural(active.length, "pessoa recebe", "pessoas recebem")} avisos</strong>
          {active.length > 0 ? <span className="muted"> ({byEmail} por email, {active.length - byEmail} por notificação)</span> : null}
          {pending.length > 0 ? <span className="muted"> · {plural(pending.length, "ainda não confirmou", "ainda não confirmaram")} o email</span> : null}
        </p>
      ) : null}

      <StrollingCatSettingsForm />

      <section className="gn-stack gn-stack--s">
        <h2>Avisos enviados</h2>
        {data && data.sent.length === 0 ? <p className="muted">Ainda não saiu nenhum aviso. O primeiro sai quando gravar um gato como “Para adoção”.</p> : null}
        {resend.isError ? <Notice tone="error" title="Não foi possível enviar">{errorMessage(resend.error)}</Notice> : null}
        {data && data.sent.length > 0 ? (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th scope="col">Gato</th><th scope="col">Quando</th><th scope="col">Chegou a</th><th scope="col"><span className="gn-sr-only">Ações</span></th></tr></thead>
              <tbody>
                {data.sent.map((a) => (
                  <tr key={a.catId}>
                    <td><strong>{a.catName}</strong></td>
                    <td>{when(a.sentAt)}</td>
                    <td>
                      {plural(a.emails, "email", "emails")}, {plural(a.pushes, "notificação", "notificações")}
                      {a.problem ? <><br /><span className="small bo-alert-problem">{a.problem}</span></> : null}
                    </td>
                    <td>{a.problem ? <Button variant="secondary" disabled={resend.isPending} onClick={() => resend.mutate(a.catId)}>Enviar outra vez</Button> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="gn-stack gn-stack--s">
        <h2>Quem pediu avisos</h2>
        <p className="small muted">Por email, só conta depois de a pessoa carregar na ligação de confirmação. Quem não confirma em 7 dias sai da lista. Cada email tem uma ligação para deixar de receber.</p>
        {remove.isError ? <Notice tone="error" title="Não foi possível remover">{errorMessage(remove.error)}</Notice> : null}
        {data && data.subscribers.length === 0 ? <p className="muted">Ainda ninguém pediu avisos.</p> : null}
        {data && data.subscribers.length > 0 ? (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th scope="col">Quem</th><th scope="col">Quer saber de</th><th scope="col">Estado</th><th scope="col">Avisos recebidos</th><th scope="col"><span className="gn-sr-only">Ações</span></th></tr></thead>
              <tbody>
                {data.subscribers.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.email ?? "Notificações"}</strong>
                      {s.device ? <><br /><span className="small muted">{s.device}</span></> : null}
                      <br /><span className="small muted">Desde {when(s.confirmedAt ?? s.createdAt)}</span>
                    </td>
                    <td>{s.preferences}</td>
                    <td>{s.status === "ativo" ? <Badge tone="success">Confirmado</Badge> : <Badge tone="warning">Por confirmar</Badge>}</td>
                    <td>{s.alertsSent}{s.lastAlertAt ? <><br /><span className="small muted">último a {when(s.lastAlertAt)}</span></> : null}</td>
                    <td>
                      <Button variant="quiet" disabled={remove.isPending} onClick={() => { if (window.confirm(`Deixar de enviar avisos a ${s.email ?? "este aparelho"}?`)) remove.mutate(s.id); }}>
                        Remover
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}

/**
 * The strolling cat on the site: now and then the logo's cat walks into a corner of the screen with the name of a cat
 * up for adoption. Here: on or off, and how long between one cat leaving and the next coming in.
 */
function StrollingCatSettingsForm() {
  const api = useApi();
  const qc = useQueryClient();
  const pages = useQuery({ queryKey: ["pages"], queryFn: () => api.pages() });
  const home = pages.data?.find((p) => p.path === "/");
  const [settings, setSettings] = useState<StrollingCatSettings>();
  useEffect(() => { if (home && !settings) setSettings(home.strollingCat ?? defaultStrollingCatSettings); }, [home, settings]);
  const save = useMutation({
    mutationFn: (s: StrollingCatSettings) => {
      if (!(s.everySeconds >= 30 && s.everySeconds <= 3600)) throw new Error("O intervalo deve ser entre 30 e 3600 segundos.");
      return api.updatePage(home!.id, { strollingCat: s });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pages"] }),
  });
  if (!settings) return null;
  const change = (s: StrollingCatSettings) => { save.reset(); setSettings(s); };
  return (
    <form className="gn-stack gn-stack--s" aria-labelledby="gato-passeio" onSubmit={(e) => { e.preventDefault(); save.mutate(settings); }}>
      <h2 id="gato-passeio">Gato que passeia no site</h2>
      <p className="small muted">
        O gato do logótipo entra no canto do ecrã com o nome de um gato para adoção, 8 segundos depois de a pessoa chegar ao site.
        Quem carrega em “Agora não” deixa de o ver até fechar o site.
      </p>
      <Checkbox id="gato-passeio-on" label="Mostrar o gato que passeia" checked={settings.on} onChange={(on) => change({ ...settings, on })} />
      {settings.on ? (
        <TextField id="gato-passeio-intervalo" label="Segundos até voltar" hint="Depois de um gato sair, quanto tempo até entrar o seguinte. Entre 30 e 3600 (60 = um minuto)." type="number" inputMode="numeric"
          value={String(settings.everySeconds)} onChange={(e) => change({ ...settings, everySeconds: Number(e.target.value) })} />
      ) : null}
      {save.isError ? <Notice tone="error" title="Não foi guardado">{errorMessage(save.error)}</Notice> : null}
      {save.isSuccess ? <Notice tone="success" title="Guardado">O site é atualizado em poucos segundos.</Notice> : null}
      <div><Button type="submit" variant="secondary" disabled={save.isPending}>{save.isPending ? "A guardar…" : "Guardar"}</Button></div>
    </form>
  );
}
