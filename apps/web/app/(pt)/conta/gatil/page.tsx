import { Container } from "@gn/ui";
import { NoGatil } from "@/components/client/conta/NoGatil";
import { PageHero } from "@/components/PageHero";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildMetadata({ path: "/conta/gatil", title: "O meu turno no gatil", overrides: { noindex: true } });
}

/** Volunteers only: their gatil shift, the cats to look after and the notifications that concern them. */
export default function GatilPage() {
  return (
    <>
      <PageHero
        heading="O meu turno no gatil"
        intro="Que gatos medicar, onde estão e como tratar de cada um. Sempre atualizado."
        crumbs={[{ href: "/", label: "Início" }, { href: "/conta", label: "A minha conta" }, { label: "No gatil" }]}
      />
      <Container narrow>
        <NoGatil />
      </Container>
    </>
  );
}
