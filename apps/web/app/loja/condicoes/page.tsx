import { COMPLAINTS_BOOK_URL, disputeBodies, REFUND_DAYS, WITHDRAWAL_DAYS } from "@gn/domain";
import { Container, Notice } from "@gn/ui";
import { LegalDraftNotice } from "@/components/LegalDraftNotice";
import { PageHero } from "@/components/PageHero";
import { association, contactHref } from "@/lib/association";
import { getShopSummary } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildMetadata({
    path: "/loja/condicoes",
    title: "Condições da loja solidária",
    description: "Quem vende, preços, pagamento, entrega, como desistir em 14 dias, garantia e reclamações.",
  });
}

/**
 * Pre-contract information for distance sales (DL 24/2014, artigo 4.º), in plain words.
 * Shown before the order is sent and linked from the order window, the product pages and the footer.
 */
export default async function ShopConditionsPage() {
  const { settings } = await getShopSummary();
  return (
    <>
      <PageHero
        heading="Condições da loja solidária"
        intro="O que precisa de saber antes de encomendar. Escrevemos de forma simples; se tiver dúvidas, pergunte-nos."
        crumbs={[{ href: "/", label: "Início" }, { href: "/loja", label: "Loja solidária" }, { label: "Condições" }]}
      />
      <Container narrow>
        <div className="gn-stack gn-stack--m legal-text">
          <LegalDraftNotice />
          <h2 id="quem-vende">Quem vende</h2>
          <p>
            {association.name}, NIF {association.nif}, associação sem fins lucrativos de Viana do Castelo.
            Morada: {association.gatil.lines.join(", ")}.
            Contacto: <a href={contactHref("loja")}>formulário de contacto</a> (assunto «Loja solidária») ou {association.shopLegalEmail}.
          </p>

          <h2 id="precos">Preços</h2>
          <p>
            Os preços estão em euros e são o preço final de cada artigo{settings.vatNote ? ` (${settings.vatNote})` : ""}.
            Se pedir envio pelo correio, os portes pagam-se à parte: dependem do peso e dizemos-lhe o valor antes de pagar.
            Levantar no gatil ou numa banca não tem custos.
          </p>

          <h2 id="encomendar">Como encomendar e pagar</h2>
          <ol className="gn-stack gn-stack--s">
            <li>Escolhe os artigos e envia o pedido com o seu nome e telemóvel. O botão «Encomendar com obrigação de pagar» confirma a compra.</li>
            <li>Guardamos os artigos para si e mostramos-lhe o código do pedido e como pagar: MB WAY, transferência bancária ou, se levantar, no momento.</li>
            <li>Quando o pagamento chegar, avisamos e entregamos ou enviamos. Se mudar de ideias antes de pagar, avise-nos e cancelamos o pedido, sem custos.</li>
          </ol>
          <p>{settings.pickup}</p>
          <p>{settings.shipping}</p>

          <h2 id="desistir">Pode desistir em {WITHDRAWAL_DAYS} dias</h2>
          <p>
            Tem {WITHDRAWAL_DAYS} dias para desistir da compra, sem dar razões, contados a partir do dia em que recebe ou levanta os artigos.
            Basta dizer-nos pelo <a href={contactHref("loja")}>formulário de contacto</a> ou por email, ou enviar-nos a declaração abaixo.
            Devolvemos o dinheiro que pagou, incluindo os portes de envio normais, no prazo de {REFUND_DAYS} dias depois de nos avisar,
            pelo mesmo meio que usou para pagar. Podemos esperar até recebermos os artigos de volta.
            Tem de devolver os artigos em {WITHDRAWAL_DAYS} dias, no gatil, numa banca ou pelo correio; neste caso os portes da devolução são por sua conta.
          </p>
          <p><strong>Não pode desistir</strong> de artigos feitos ou personalizados a seu pedido (por exemplo, com o nome do seu gato), nem de artigos selados de higiene que tenham sido abertos.</p>
          <Notice tone="info" title="Declaração de desistência">
            <p className="small">Copie, preencha e envie-nos, se quiser usar este modelo:</p>
            <p className="small">
              Para {association.name}, {association.gatil.lines.join(", ")}, {association.shopLegalEmail}:<br />
              Comunico que desisto do contrato de compra dos seguintes bens: …<br />
              Pedido n.º … , recebido em … .<br />
              Nome: … · Morada: … · Data: … · Assinatura (só se for em papel): …
            </p>
          </Notice>

          <h2 id="garantia">Garantia</h2>
          <p>
            Todos os artigos têm a garantia legal de 3 anos (Decreto-Lei 84/2021). Se algum tiver um defeito, fale connosco:
            reparamos, trocamos ou devolvemos o dinheiro, sem custos para si.
          </p>

          <h2 id="reclamacoes">Reclamações</h2>
          <p>
            Fale primeiro connosco pelo <a href={contactHref("reclamacao")}>formulário de contacto</a>, com o assunto «Reclamação».
            Também pode usar o <a href={COMPLAINTS_BOOK_URL} rel="noopener">Livro de Reclamações Eletrónico</a>.
          </p>
          <p>Se não chegarmos a acordo, pode recorrer a uma entidade de resolução alternativa de litígios de consumo:</p>
          <ul className="gn-stack gn-stack--s">
            {disputeBodies.map((b) => (
              <li key={b.url}><a href={b.url} rel="noopener">{b.name}</a> ({b.area})</li>
            ))}
          </ul>
          <p className="small muted">Mais informação em <a href="https://www.consumidor.gov.pt" rel="noopener">consumidor.gov.pt</a>. Os seus dados são tratados como explicamos na <a href="/privacidade">política de privacidade</a>.</p>
        </div>
      </Container>
    </>
  );
}
