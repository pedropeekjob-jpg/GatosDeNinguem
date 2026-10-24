import { Container } from "@gn/ui";
import { LegalDraftNotice } from "@/components/LegalDraftNotice";
import { PageHero } from "@/components/PageHero";
import { association } from "@/lib/association";
import { getPage } from "@/lib/content";
import { features } from "@/lib/features";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const page = await getPage("/privacidade");
  return buildMetadata({ path: "/privacidade", title: page.heading, description: page.intro, overrides: page.seo });
}

/** Who processes personal data for the association. Keep in step with the services the code uses (art. 13.º RGPD). */
const processors = [
  { name: "Render", where: "alojamento na UE, empresa dos EUA", what: "aloja o site, a API e a base de dados." },
  { name: "Resend", where: "EUA", what: "envia os emails: códigos de entrada, newsletter e novidades dos afilhados." },
  { name: "Stripe", where: "Irlanda e EUA", what: "recebe o IBAN e trata o mandato e os débitos diretos do apadrinhamento." },
];

export default async function PrivacyPage() {
  const page = await getPage("/privacidade");
  const mail = `mailto:${association.email}`;
  return (
    <>
      <PageHero heading={page.heading} intro={page.intro} crumbs={[{ href: "/", label: "Início" }, { label: "Política de privacidade" }]} />
      <Container narrow>
        <div className="gn-stack gn-stack--m legal-text">
          <LegalDraftNotice />

          <h2>Quem trata os seus dados</h2>
          <p>
            A {association.name}, com o NIF {association.nif}, é a responsável pelo tratamento dos dados pessoais recolhidos neste site.
            Para qualquer questão sobre os seus dados escreva para <a href={mail}>{association.email}</a>.
          </p>

          <h2>Que dados recolhemos e para quê</h2>
          <p>Só pedimos os dados de que precisamos para o ajudar a ajudar os gatos. Nunca vendemos os seus dados.</p>
          <ul className="gn-stack gn-stack--s">
            <li><strong>Pedidos de adoção, apadrinhamento e família temporária:</strong> nome, contactos, localidade e o que nos conta sobre a sua casa, para avaliarmos o pedido e falarmos consigo.</li>
            <li><strong>Turnos de voluntariado:</strong> nome e telemóvel, para organizarmos os turnos no gatil e o avisarmos de alterações.</li>
            {features.patinhas ? (
              <li><strong>Conta e Patinhas:</strong> nome, email ou telemóvel e as ajudas que regista, para mostrar as suas Patinhas e vantagens. O seu nome só aparece no mural se o autorizar.</li>
            ) : (
              <li><strong>Conta:</strong> nome e email ou telemóvel, para entrar na sua área pessoal, ver os turnos no gatil e receber as notificações.</li>
            )}
            <li><strong>Loja solidária e oferta de artigos:</strong> nome, contactos e o pedido, para combinarmos o pagamento e a entrega.</li>
            <li><strong>Pedidos de parceria:</strong> nome da empresa, pessoa de contacto e contactos.</li>
            <li><strong>Débito direto do apadrinhamento:</strong> nome, email e o estado de cada débito. O IBAN é escrito na página segura do prestador de pagamentos e não fica no nosso site.</li>
            <li><strong>Newsletter:</strong> o seu email, para enviarmos novidades. Pode cancelar em qualquer email.</li>
            <li><strong>Avisos de gatos novos:</strong> o seu email (que confirma numa ligação que lhe enviamos) ou a autorização de notificações deste aparelho, e os gatos que escolheu, para o avisarmos quando chega um gato para adoção. Pode cancelar em qualquer aviso.</li>
            <li><strong>Finais felizes:</strong> o nome e a localidade de quem adotou só são publicados com autorização expressa.</li>
          </ul>

          <h2>Com que fundamento</h2>
          <p>
            Tratamos os seus dados com o seu consentimento, que dá ao enviar cada formulário, e para executar o que nos pediu (por exemplo, uma adoção ou uma encomenda).
            Guardamos ainda os dados que a lei nos obriga a guardar, como os recibos de donativos.
          </p>

          <h2>Durante quanto tempo</h2>
          <ul className="gn-stack gn-stack--s">
            <li>Pedidos que não avançam: até 1 ano depois do último contacto.</li>
            <li>Adoções: enquanto for preciso acompanhar o gato e cumprir as regras de registo de animais.</li>
            <li>Conta, newsletter e avisos de gatos novos: até a apagar ou cancelar. Pedidos de aviso por email que não são confirmados são apagados ao fim de 7 dias.</li>
            <li>Donativos e vendas: o prazo exigido pela lei fiscal (10 anos).</li>
          </ul>

          <h2>Quem mais tem acesso</h2>
          <p>
            Apenas os gestores e voluntários da associação que precisam dos dados para o seu pedido.
            Usamos alguns prestadores de serviços que tratam dados por nossa conta, com contrato e as garantias do RGPD:
          </p>
          <ul className="gn-stack gn-stack--s">
            {processors.map((p) => (
              <li key={p.name}><strong>{p.name}</strong> ({p.where}): {p.what}</li>
            ))}
          </ul>
          <p>
            Quando um prestador trata dados fora da União Europeia, a transferência está protegida pelo Quadro de Privacidade de Dados UE-EUA
            ou pelas cláusulas contratuais-tipo aprovadas pela Comissão Europeia.
            Se nos indicar o NIF para recibo, este é comunicado à Autoridade Tributária, como manda a lei.
          </p>

          <h2>Os seus direitos</h2>
          <p>
            Pode pedir-nos a qualquer momento para ver, corrigir, apagar ou levar consigo os seus dados, limitar ou opor-se ao seu tratamento e retirar o consentimento.
            Basta escrever para <a href={mail}>{association.email}</a>. Respondemos no prazo de um mês.
          </p>
          <p>
            Se achar que não tratámos bem os seus dados, pode apresentar queixa à Comissão Nacional de Proteção de Dados (<a href="https://www.cnpd.pt" rel="noopener">www.cnpd.pt</a>).
          </p>

          <h2>Segurança</h2>
          <p>
            O site usa ligações cifradas (HTTPS), a entrada na conta faz-se com um código enviado para o seu email ou telemóvel, sem palavras-passe, e o acesso à gestão está limitado aos gestores da associação.
          </p>

          <h2>Cookies</h2>
          <p>Saiba que dados guardamos no seu navegador na <a href="/cookies">política de cookies</a>.</p>
        </div>
      </Container>
    </>
  );
}
