"use client";
import { Notice } from "@gn/ui";
import { useFavorites } from "./favorites";

/** Reminds returning visitors of the cats they saved. Renders nothing until they save one. */
export function FavoritesStrip({ cats }: { cats: { slug: string; name: string }[] }) {
  const { favorites } = useFavorites();
  const saved = cats.filter((c) => favorites.includes(c.slug));
  if (saved.length === 0) return null;
  return (
    <Notice tone="info" title={saved.length === 1 ? "Tem 1 gato guardado" : `Tem ${saved.length} gatos guardados`}>
      <p>
        {saved.map((c, i) => (
          <span key={c.slug}>
            {i > 0 ? ", " : ""}
            <a href={`/adotar/${c.slug}`}>{c.name}</a>
          </span>
        ))}
        . Quando estiver pronto, carregue em “Quero conhecer” na página do gato.
      </p>
    </Notice>
  );
}
