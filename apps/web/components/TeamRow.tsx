import type { TeamMember } from "@/lib/equipa";

/** "As caras por trás dos gatos" on Quem somos. Phones: a row to swipe, with the next face peeking in
 *  (same pattern as CatRail). Wide screens: a grid. It never moves by itself. */
export function TeamRow({ members, placeholder }: { members: TeamMember[]; placeholder?: boolean }) {
  if (members.length === 0) return null;
  return (
    <section className="team" aria-labelledby="a-equipa">
      <div className="team__head">
        <h2 id="a-equipa">As caras por trás dos gatos</h2>
        <p>Somos todos voluntários. Se vier ao gatil, é a nós que vai conhecer.</p>
        {placeholder ? <p className="team__placeholder">Fotos e nomes de exemplo, a substituir pelos da equipa.</p> : null}
      </div>
      {/* Focusable so keyboard users can scroll the row on phones (it has no links inside). */}
      <ul className="team__track" role="list" tabIndex={0} aria-label="A equipa">
        {members.map((m) => (
          <li key={m.name} className="team__person">
            <img className="team__photo" src={m.photo} alt={`Fotografia de ${m.name}`} width={480} height={600} loading="lazy" decoding="async" />
            <div className="team__text">
              <h3 className="team__name">{m.name}</h3>
              <p className="team__role">{m.role}</p>
              <p className="team__quote">«{m.quote}»</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
