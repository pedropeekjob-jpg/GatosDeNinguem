import { Container } from "@gn/ui";
import { Afilhados } from "@/components/client/conta/Afilhados";
import { PageHero } from "@/components/PageHero";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildMetadata({ path: "/conta/afilhados", title: "Os meus afilhados", overrides: { noindex: true } });
}

/** Godparents only: the cats they sponsor, the monthly debit and everything that happens to each cat. */
export default function AfilhadosPage() {
  return (
    <>
      <PageHero
        heading="Os meus afilhados"
        intro="Tudo o que acontece ao gato que apadrinha: onde está, o veterinário, a medicação e as cartas da equipa."
        crumbs={[{ href: "/", label: "Início" }, { href: "/conta", label: "A minha conta" }, { label: "Afilhados" }]}
      />
      <Container narrow>
        <Afilhados />
      </Container>
    </>
  );
}
