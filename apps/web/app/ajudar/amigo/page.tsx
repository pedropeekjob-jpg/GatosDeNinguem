import { redirect } from "next/navigation";
import { Button, Section } from "@gn/ui";
import { PageHero } from "@/components/PageHero";
import { switchedOffRedirect } from "@/lib/features";
import { buildMetadata } from "@/lib/seo";

const intro = "Com uma quota mínima de 24 euros por ano ajuda a manter o gatil e tem 10% a 15% de desconto nos nossos parceiros.";

export async function generateMetadata() {
  return buildMetadata({ path: "/ajudar/amigo", title: "Ser Amigo da associação", description: intro });
}

export default function FriendPage() {
  // Switched off (FEATURES without "amigo"): the middleware already redirects; this covers the static demo.
  const off = switchedOffRedirect("/ajudar/amigo");
  if (off) redirect(off);
  return (
    <>
      <PageHero heading="Ser Amigo da associação" intro={intro} crumbs={[{ href: "/", label: "Início" }, { href: "/ajudar", label: "Ajudar" }, { label: "Ser Amigo" }]}>
        <div className="action-row"><Button href="/parceiros" variant="secondary">Ver parceiros e vantagens</Button></div>
      </PageHero>
      <Section heading="O que ganha">
        <ul className="gn-stack gn-stack--s">
          <li><strong>Ajuda a manter o gatil</strong> durante todo o ano: comida, areia e veterinário.</li>
          <li><strong>Tem 10% a 15% de desconto</strong> nos nossos parceiros.</li>
        </ul>
      </Section>
    </>
  );
}
