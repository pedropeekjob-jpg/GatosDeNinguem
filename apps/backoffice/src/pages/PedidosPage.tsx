import { useQuery } from "@tanstack/react-query";
import { fosterApplicationStatusLabel, fosterCanHostLabel, fosterHowLongLabel } from "@gn/domain";
import { Notice } from "@gn/ui";
import { errorMessage, useApi } from "../lib/api";

const when = (iso: string) => new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Lisbon" }).format(new Date(iso));

export function PedidosPage() {
  const api = useApi();
  const adoptions = useQuery({ queryKey: ["interests"], queryFn: () => api.adoptionInterests() });
  const sponsors = useQuery({ queryKey: ["sponsors"], queryFn: () => api.sponsorships() });
  const fosters = useQuery({ queryKey: ["foster-applications"], queryFn: () => api.fosterApplications() });
  const partners = useQuery({ queryKey: ["partner-applications"], queryFn: () => api.partnerApplications() });
  return (
    <div className="gn-stack gn-stack--l">
      <h1>Pedidos recebidos</h1>
      <section className="gn-stack gn-stack--s">
        <h2>Querem conhecer um gato</h2>
        {adoptions.isError ? <Notice tone="error" title="Erro">{errorMessage(adoptions.error)}</Notice> : null}
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th scope="col">Quando</th><th scope="col">Pessoa</th><th scope="col">Gato</th><th scope="col">Mensagem</th></tr></thead>
            <tbody>
              {adoptions.data?.map((i) => (
                <tr key={i.id}><td>{when(i.receivedAt)}</td><td><strong>{i.name}</strong><br />{i.phone}<br /><span className="small muted">{i.town}</span></td><td>{i.catSlug ?? "—"}</td><td>{i.message ?? "—"}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="gn-stack gn-stack--s">
        <h2>Querem apadrinhar um gato</h2>
        <p className="small muted">Depois de combinar com a pessoa, confirme em <a href="/escalas">Escalas</a>, separador Padrinhos.</p>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th scope="col">Pedido a</th><th scope="col">Pessoa</th><th scope="col">Gato</th><th scope="col">Por mês</th><th scope="col">Mensagem</th></tr></thead>
            <tbody>
              {sponsors.data?.filter((s) => s.pending).map((s) => (
                <tr key={s.id}><td>{s.startDate}</td><td><strong>{s.sponsorName}</strong><br />{s.email}{s.phone ? <><br />{s.phone}</> : null}</td><td>{s.catSlug}</td><td>{s.monthlyAmount.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}</td><td>{s.message ?? "—"}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="gn-stack gn-stack--s">
        <h2>Querem ser família temporária</h2>
        <p className="small muted">Marque como correu em <a href="/escalas">Escalas</a>, separador Famílias temporárias.</p>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th scope="col">Quando</th><th scope="col">Pessoa</th><th scope="col">Pode acolher</th><th scope="col">Estado</th></tr></thead>
            <tbody>
              {fosters.data?.filter((f) => f.status !== "arquivada").map((f) => (
                <tr key={f.id}><td>{when(f.receivedAt)}</td><td><strong>{f.name}</strong><br />{f.phone}<br /><span className="small muted">{f.town}</span></td><td>{fosterCanHostLabel[f.canHost]}<br /><span className="small muted">{fosterHowLongLabel[f.howLong]}</span></td><td>{fosterApplicationStatusLabel[f.status]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="gn-stack gn-stack--s">
        <h2>Querem ser parceiros</h2>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th scope="col">Quando</th><th scope="col">Negócio</th><th scope="col">Contacto</th><th scope="col">Oferta</th></tr></thead>
            <tbody>
              {partners.data?.map((p) => (
                <tr key={p.id}><td>{when(p.receivedAt)}</td><td><strong>{p.businessName}</strong><br /><span className="small muted">{p.town}</span></td><td>{p.contactName}<br />{p.email}{p.phone ? <><br />{p.phone}</> : null}</td><td>{p.offer ?? "—"}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
