import { Button } from "@gn/ui";
import type { teamPhoto } from "@/lib/equipa";
import { i18n } from "@/lib/i18n/server";

/** "Quem somos": a big group picture with a warm word on a white sheet over its lower edge (like the home hero
 *  on phones). Everyone together, no titles: a family, not a hierarchy. */
export function TeamBanner({ photo }: { photo: typeof teamPhoto }) {
  const { t, l } = i18n();
  return (
    <section className="team-banner" aria-labelledby="somos-familia">
      <img className="team-banner__photo" src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} />
      <div className="team-banner__sheet">
        <h2 id="somos-familia">{t({ pt: "Somos uma família", en: "We are a family", es: "Somos una familia", fr: "Nous sommes une famille" })}</h2>
        <p>{t({
          pt: "Amigos, vizinhos, pais e filhos que dão o seu tempo aos gatos. Aqui ninguém é chefe: quem pode, ajuda, e há sempre lugar para mais um.",
          en: "Friends, neighbours, parents and children who give their time to the cats. Nobody is the boss here: whoever can, helps, and there is always room for one more.",
          es: "Amigos, vecinos, padres e hijos que dedican su tiempo a los gatos. Aquí nadie es jefe: quien puede, ayuda, y siempre hay sitio para uno más.",
          fr: "Des amis, des voisins, des parents et des enfants qui donnent de leur temps aux chats. Ici, personne n’est le chef : qui peut aide, et il y a toujours de la place pour un de plus.",
        })}</p>
        <div><Button href={l("/ajudar/voluntariado")} variant="secondary">{t({ pt: "Venha conhecer-nos", en: "Come and meet us", es: "Venga a conocernos", fr: "Venez nous rencontrer" })}</Button></div>
        {photo.placeholder ? <p className="team-banner__placeholder">{t({ pt: "Imagem de exemplo, a substituir por uma foto da equipa.", en: "Example picture, to be replaced by a photo of the team.", es: "Imagen de ejemplo, a sustituir por una foto del equipo.", fr: "Image d’exemple, à remplacer par une photo de l’équipe." })}</p> : null}
      </div>
    </section>
  );
}
