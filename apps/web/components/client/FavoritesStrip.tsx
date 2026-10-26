"use client";
import { Notice } from "@gn/ui";
import { useI18n } from "@/lib/i18n/client";
import { useFavorites } from "./favorites";

/** Reminds returning visitors of the cats they saved. Renders nothing until they save one. */
export function FavoritesStrip({ cats }: { cats: { slug: string; name: string }[] }) {
  const { t, l } = useI18n();
  const { favorites } = useFavorites();
  const saved = cats.filter((c) => favorites.includes(c.slug));
  if (saved.length === 0) return null;
  return (
    <Notice tone="info" title={saved.length === 1
      ? t({ pt: "Tem 1 gato guardado", en: "You have saved 1 cat", es: "Tiene 1 gato guardado", fr: "Vous avez gardé 1 chat" })
      : t({ pt: `Tem ${saved.length} gatos guardados`, en: `You have saved ${saved.length} cats`, es: `Tiene ${saved.length} gatos guardados`, fr: `Vous avez gardé ${saved.length} chats` })}>
      <p>
        {saved.map((c, i) => (
          <span key={c.slug}>
            {i > 0 ? ", " : ""}
            <a href={l(`/adotar/${c.slug}`)}>{c.name}</a>
          </span>
        ))}
        {t({ pt: ". Quando estiver pronto, carregue em “Quero conhecer” na página do gato.", en: ". When you are ready, press “I’d like to meet…” on the cat’s page.", es: ". Cuando esté listo, pulse “Quiero conocer a…” en la página del gato.", fr: ". Quand vous êtes prêt, appuyez sur « Je veux rencontrer… » sur la page du chat." })}
      </p>
    </Notice>
  );
}
