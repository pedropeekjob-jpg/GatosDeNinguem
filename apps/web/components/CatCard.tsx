import { ageLabel, isSenior, statusLabel } from "@gn/domain";
import { Badge, Card } from "@gn/ui";
import type { PublicCat } from "@/lib/content";
import { FavoriteButton } from "./client/FavoriteButton";

export function CatCard({ cat, titleAs = "h3" }: { cat: PublicCat; titleAs?: "h2" | "h3" }) {
  const photo = cat.photos[0]!;
  return (
    <Card
      titleAs={titleAs}
      title={cat.name}
      href={`/adotar/${cat.slug}`}
      media={{ src: photo.url, alt: photo.alt }}
      badges={
        <>
          <Badge tone={cat.status === "para-adocao" ? "success" : "neutral"}>{statusLabel[cat.status]}</Badge>
          {isSenior(cat) ? <Badge tone="info">Sénior</Badge> : null}
          {cat.specialNeeds ? <Badge tone="warning">Cuidados especiais</Badge> : null}
        </>
      }
      meta={[
        { label: "Idade", value: ageLabel(cat.ageYears) },
        { label: "Sexo", value: cat.sex === "femea" ? "Fêmea" : "Macho" },
      ]}
      actions={cat.status === "para-adocao" ? <FavoriteButton slug={cat.slug} name={cat.name} /> : undefined}
    >
      <p>{cat.summary}</p>
    </Card>
  );
}
