import { redirect } from "next/navigation";
import { monthLabel } from "@gn/domain";
import { Button, Container, ProgressMeter, Section } from "@gn/ui";
import { PageHero } from "@/components/PageHero";
import { getPage, getPatinhasSummary, listPartners } from "@/lib/content";
import { features, switchedOffRedirect } from "@/lib/features";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const page = await getPage("/patinhas");
  return buildMetadata({ path: "/patinhas", title: page.heading, description: page.intro, overrides: page.seo });
}

const n = new Intl.NumberFormat("pt-PT");

export default async function PatinhasPage() {
  // Switched off (FEATURES without "patinhas"): the middleware already redirects; this covers the static demo.
  const off = switchedOffRedirect("/patinhas");
  if (off) redirect(off);
  const [page, summary, partners] = await Promise.all([getPage("/patinhas"), getPatinhasSummary(), listPartners()]);
  const perks = !features.trocas ? [] : partners.flatMap((p) => p.perks.filter((perk) => perk.patinhasCost).map((perk) => ({ partner: p, perk })));
  return (
    <>
      <PageHero heading={page.heading} intro={page.intro} crumbs={[{ href: "/", label: "Início" }, { href: "/ajudar", label: "Ajudar" }, { label: "Patinhas" }]}>
        <div className="action-row">
          <Button href="/conta">Criar conta ou entrar</Button>
        </div>
      </PageHero>

      {summary.challenges.map(({ challenge, progress }) => (
        <Section key={challenge.id} tone="soft">
          <p className="gn-eyebrow">Desafio de {monthLabel(challenge.month)}</p>
          <h2>{challenge.title}</h2>
          {challenge.description ? <p>{challenge.description}</p> : null}
          <ProgressMeter label="Todos juntos" value={progress} max={challenge.goal} valueText={`${progress} de ${challenge.goal}`} />
        </Section>
      ))}

      <Section heading="Como ganhar Patinhas" intro="Cada ajuda verdadeira conta. A equipa confirma as que acontecem fora do site.">
        <ul className="painel__lista">
          {summary.waysToEarn.map((r) => (
            <li key={r.action} className="painel__linha">
              <div>
                <p>{r.label}</p>
                {r.verifiedBy || r.weeklyLimit ? (
                  <p className="small muted">{[r.verifiedBy, r.weeklyLimit ? `até ${r.weeklyLimit} por semana` : null].filter(Boolean).join(" · ")}</p>
                ) : null}
              </div>
              <strong className="painel__pontos">{r.points}{r.perUnit ? ` por ${r.perUnit}` : ""}</strong>
            </li>
          ))}
        </ul>
        <p>Adotar não dá Patinhas: queremos que cada gato seja adotado por amor. As fotos que nos manda depois já dão.</p>
      </Section>

      <Section heading="Níveis" intro={features.trocas ? "Os níveis contam tudo o que já ganhou. Trocar Patinhas nos parceiros nunca o faz descer de nível." : "Os níveis contam tudo o que já ganhou."}>
        <ol className="niveis">
          {summary.levels.map((l) => (
            <li key={l.level} className="nivel">
              <span className="nivel__num">Nível {l.level}</span>
              <strong className="nivel__nome">{l.name}</strong>
              <span className="nivel__pontos">{l.min === 0 ? "Ao criar a conta" : `A partir de ${n.format(l.min)} Patinhas`}</span>
              <span>{l.reward}</span>
            </li>
          ))}
        </ol>
      </Section>

      {perks.length > 0 ? (
        <Section heading="Trocar nos parceiros" intro="Use as suas Patinhas em descontos nos negócios amigos da associação.">
          <ul className="painel__lista">
            {perks.map(({ partner, perk }) => (
              <li key={`${partner.id}-${perk.id}`} className="painel__linha">
                <div>
                  <p><strong>{partner.name}</strong> · {partner.town}</p>
                  <p>{perk.description}</p>
                  {perk.minLevel || perk.monthlyLimitPerPerson ? (
                    <p className="small muted">{[perk.minLevel ? `A partir do nível ${perk.minLevel}` : null, perk.monthlyLimitPerPerson ? `${perk.monthlyLimitPerPerson} por mês` : null].filter(Boolean).join(" · ")}</p>
                  ) : null}
                </div>
                <strong className="painel__pontos">{perk.patinhasCost} Patinhas</strong>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section heading="Medalhas" intro="Pequenas conquistas pelo caminho.">
        <ul className="medalhas">
          {summary.badges.map((b) => (
            <li key={b.id} className="medalha medalha--ganha">
              <span className="medalha__icone" aria-hidden="true">{b.icon}</span>
              <span className="medalha__nome">{b.name}</span>
              <span className="medalha__texto">{b.description}</span>
            </li>
          ))}
        </ul>
      </Section>

      {summary.wall.length > 0 ? (
        <Section heading="Mural de agradecimentos" intro="Quem chegou ao nível 2 e quis aparecer aqui. Obrigado!">
          <ul className="mural">
            {summary.wall.map((w) => <li key={w.name}><strong>{w.name}</strong> <span className="muted">· {w.levelName}</span></li>)}
          </ul>
        </Section>
      ) : null}

      <section className="gn-section gn-section--soft">
        <Container narrow>
          <div className="gn-stack gn-stack--m">
            <h2>Comece hoje</h2>
            <p>Criar conta demora um minuto e não precisa de palavra-passe: entra com o email ou o telemóvel e um código que lhe enviamos. Ganha logo 10 Patinhas.</p>
            <div className="action-row">
              <Button href="/conta">Criar a minha conta</Button>
              <Button href="/ajudar" variant="secondary">Formas de ajudar</Button>
            </div>
            <p className="small muted">Pode apagar a conta e os seus dados quando quiser. O nome só aparece no mural se escolher.</p>
          </div>
        </Container>
      </section>
    </>
  );
}
