"use client";
import { ToggleButton } from "@gn/ui";
import { useFavorites } from "./favorites";

export function FavoriteButton({ slug, name }: { slug: string; name: string }) {
  const { isFavorite, toggle } = useFavorites();
  const saved = isFavorite(slug);
  return (
    <ToggleButton pressed={saved} onToggle={() => toggle(slug)} icon={saved ? "♥" : "♡"} pressedChildren={`${name} está nos favoritos`}>
      Guardar {name}
    </ToggleButton>
  );
}
