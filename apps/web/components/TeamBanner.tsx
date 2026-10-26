import { Button } from "@gn/ui";
import type { teamPhoto } from "@/lib/equipa";

/** "Quem somos": a big group picture with a warm word on a white sheet over its lower edge (like the home hero
 *  on phones). Everyone together, no titles: a family, not a hierarchy. */
export function TeamBanner({ photo }: { photo: typeof teamPhoto }) {
  return (
    <section className="team-banner" aria-labelledby="somos-familia">
      <img className="team-banner__photo" src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} />
      <div className="team-banner__sheet">
        <h2 id="somos-familia">Somos uma família</h2>
        <p>Amigos, vizinhos, pais e filhos que dão o seu tempo aos gatos. Aqui ninguém é chefe: quem pode, ajuda, e há sempre lugar para mais um.</p>
        <div><Button href="/ajudar/voluntariado" variant="secondary">Venha conhecer-nos</Button></div>
        {photo.placeholder ? <p className="team-banner__placeholder">Imagem de exemplo, a substituir por uma foto da equipa.</p> : null}
      </div>
    </section>
  );
}
