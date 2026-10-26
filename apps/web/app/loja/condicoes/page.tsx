import { COMPLAINTS_BOOK_URL, DONATE_BUTTON_LABEL } from "@gn/domain";
import { Container } from "@gn/ui";
import { LegalDraftNotice } from "@/components/LegalDraftNotice";
import { PageHero } from "@/components/PageHero";
import { association, contactHref } from "@/lib/association";
import { getShopSummary } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildMetadata({
    path: "/loja/condicoes",
    title: "Condições da loja solidária",
    description: "A associação não vende: cada artigo é uma oferta de agradecimento por um donativo. Como funciona, como pagar e receber.",
  });
}

/**
 * How the shop works: the association is a non-profit and does not sell, so each article is a symbolic
 * thank-you for a donation of at least a minimum amount. Linked from the donation window, the gift pages
 * and the footer. Text to be confirmed by the association and its accountant.
 */
export default async function ShopConditionsPage() {
  const { settings } = await getShopSummary();
  return (
    <>
      <PageHero
        heading="Condições da loja solidária"
        intro="Como funcionam os donativos com oferta. Escrevemos de forma simples; se tiver dúvidas, pergunte-nos."
        crumbs={[{ href: "/", label: "Início" }, { href: "/loja", label: "Loja solidária" }, { label: "Condições" }]}
      />
      <Container narrow>
        <div className="gn-stack gn-stack--m legal-text">
          <LegalDraftNotice />
          <h2 id="quem-recebe">Quem recebe o seu donativo</h2>
          <p>
            {association.name}, NIF {association.nif}, associação sem fins lucrativos de Viana do Castelo.
            Morada: {association.gatil.lines.join(", ")}.
            Contacto: <a href={contactHref("loja")}>formulário de contacto</a>, com o assunto «Loja solidária».
          </p>

          <h2 id="nao-vendemos">Não vendemos: agradecemos</h2>
          <p>
            A associação não tem fins lucrativos e não vende artigos. Quem faz um donativo pode escolher uma oferta,
            como agradecimento. Cada oferta indica o donativo mínimo para a receber. Pode dar mais: tudo o que der a mais vai para os gatos.
            Mostramos quanto cada oferta nos custou, para saber para onde vai o seu dinheiro.
          </p>

          <h2 id="como-doar">Como fazer o donativo</h2>
          <ol className="gn-stack gn-stack--s">
            <li>Escolhe a oferta, diz quanto quer doar e deixa o seu nome e telemóvel. O botão «{DONATE_BUTTON_LABEL}» confirma que vai fazer o donativo.</li>
            <li>Guardamos a oferta para si e mostramos-lhe o código do donativo e como pagar: MB WAY, transferência bancária ou, se levantar, no momento.</li>
            <li>Quando o donativo chegar, avisamos e entregamos ou enviamos a oferta. Se mudar de ideias antes de pagar, avise-nos e cancelamos, sem custos.</li>
          </ol>
          <p>{settings.pickup}</p>
          <p>
            {settings.shipping} Os portes não fazem parte do donativo: pagam-se à parte e dizemos-lhe o valor antes de pagar.
            Levantar no gatil ou numa banca não tem custos.
          </p>

          <h2 id="problemas">Se a oferta chegar com um problema</h2>
          <p>Se a oferta chegar estragada ou não for a que escolheu, fale connosco e trocamos, sem custos para si.</p>

          <h2 id="reclamacoes">Sugestões e reclamações</h2>
          <p>
            Fale connosco pelo <a href={contactHref("reclamacao")}>formulário de contacto</a>, com o assunto «Reclamação».
            Também pode usar o <a href={COMPLAINTS_BOOK_URL} rel="noopener">Livro de Reclamações Eletrónico</a>.
          </p>
          <p className="small muted">Os seus dados são tratados como explicamos na <a href="/privacidade">política de privacidade</a>.</p>
        </div>
      </Container>
    </>
  );
}
