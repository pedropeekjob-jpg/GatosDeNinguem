"use client";
import { ToggleButton } from "@gn/ui";
import { useFavorites } from "./favorites";

/** compact: a round heart laid over a photo, named for screen readers like the full button. */
export function FavoriteButton({ slug, name, compact }: { slug: string; name: string; compact?: boolean }) {
  const { isFavorite, toggle } = useFavorites();
  const saved = isFavorite(slug);
  if (compact) {
    return (
      <button type="button" className="gn-fav" aria-pressed={saved} aria-label={saved ? `${name} está nos favoritos` : `Guardar ${name}`} onClick={() => toggle(slug)}>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z" />
        </svg>
      </button>
    );
  }
  return (
    <ToggleButton pressed={saved} onToggle={() => toggle(slug)} icon={saved ? "♥" : "♡"} pressedChildren={`${name} está nos favoritos`}>
      Guardar {name}
    </ToggleButton>
  );
}
