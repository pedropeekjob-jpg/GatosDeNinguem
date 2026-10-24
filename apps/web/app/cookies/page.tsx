import { Container } from "@gn/ui";
import { LegalDraftNotice } from "@/components/LegalDraftNotice";
import { PageHero } from "@/components/PageHero";
import { association } from "@/lib/association";
import { getPage } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const page = await getPage("/cookies");
  return buildMetadata({ path: "/cookies", title: page.heading, description: page.intro, overrides: page.seo });
}

/** What the site keeps in the browser. Keep this list in step with the code: a new tracker needs a consent banner first. */
const stored = [
  { name: "gn-sessao", kind: "Cookie", what: "Mantém a sua sessão quando entra na sua conta.", lasts: "180 dias ou até sair da conta" },
  { name: "gn-conta", kind: "Armazenamento local", what: "Lembra o seu nome para o mostrar no menu.", lasts: "Até sair da conta" },
  { name: "gn-cesto", kind: "Armazenamento local", what: "Guarda os artigos que pôs no cesto da loja.", lasts: "Até fazer o pedido ou esvaziar o cesto" },
  { name: "gn-favoritos", kind: "Armazenamento local", what: "Guarda os gatos que marcou com o coração.", lasts: "Até os retirar" },
  { name: "gn-splash", kind: "Armazenamento da sessão", what: "Mostra a animação do logótipo só na primeira página que abre.", lasts: "Até fechar o separador" },
];

export default async function CookiesPage() {
  const page = await getPage("/cookies");
  return (
    <>
      <PageHero heading={page.heading} intro={page.intro} crumbs={[{ href: "/", label: "Início" }, { label: "Política de cookies" }]} />
      <Container narrow>
        <div className="gn-stack gn-stack--m legal-text">
          <LegalDraftNotice />

          <h2>O que são cookies</h2>
          <p>São pequenos ficheiros que um site guarda no seu navegador. Há outras formas parecidas de guardar dados no navegador, como o armazenamento local, e esta política aplica-se a todas.</p>

          <h2>O que este site guarda</h2>
          <p>
            Só guardamos o que é estritamente necessário para o site funcionar ou para fazer o que nos pediu.
            Por isso não precisamos de lhe pedir autorização nem mostramos um aviso de cookies.
          </p>
          <div className="legal-table" role="region" aria-label="Dados guardados no navegador" tabIndex={0}>
            <table>
              <thead>
                <tr><th scope="col">Nome</th><th scope="col">Tipo</th><th scope="col">Para que serve</th><th scope="col">Duração</th></tr>
              </thead>
              <tbody>
                {stored.map((s) => (
                  <tr key={s.name}><td><code>{s.name}</code></td><td>{s.kind}</td><td>{s.what}</td><td>{s.lasts}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2>O que não usamos</h2>
          <p>Não usamos cookies de publicidade, de estatísticas nem de redes sociais. As letras do site estão alojadas connosco e os botões de partilha e as ligações para o Facebook e o Instagram só contactam essas redes se carregar neles.</p>
          <p>Ao abrir a morada do gatil no mapa vai para o Google Maps, que tem a sua própria política de cookies.</p>

          <h2>Como apagar</h2>
          <p>Pode apagar estes dados a qualquer momento nas definições do seu navegador. Se o fizer, sai da sua conta e perde o cesto e os favoritos.</p>

          <h2>Dúvidas</h2>
          <p>Escreva para <a href={`mailto:${association.email}`}>{association.email}</a>. Veja também a <a href="/privacidade">política de privacidade</a>.</p>
        </div>
      </Container>
    </>
  );
}
