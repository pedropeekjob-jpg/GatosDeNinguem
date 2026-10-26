# Foto da equipa (Quem somos)

**Estado: de exemplo.** `apps/web/public/equipa/grupo.webp` é uma ilustração desenhada por
`apps/web/scripts/draw-team-banner.mjs` (não são pessoas reais, sem direitos de terceiros).
Sem nomes nem cargos de propósito: é uma associação familiar, sem hierarquia.

## Como trocar por uma foto real

1. Pedir à associação uma foto de grupo (horizontal, de preferência com gatos) e a autorização de
   cada pessoa para a publicar (RGPD: a imagem é um dado pessoal; para crianças, dos pais).
2. Guardar em WebP, com pelo menos 1600 px de largura, como `apps/web/public/equipa/grupo.webp`.
   No telemóvel a foto é cortada em 4:3 ao centro, por isso convém que as caras fiquem no meio.
3. Em `apps/web/lib/equipa.ts`, atualizar o texto alternativo e pôr `placeholder: false`
   (deixa de aparecer a nota "Imagem de exemplo").
