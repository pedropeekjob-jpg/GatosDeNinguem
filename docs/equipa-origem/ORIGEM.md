# Fotos da equipa (Quem somos)

**Estado: de exemplo.** Os seis retratos em `apps/web/public/equipa/` são ilustrações desenhadas por
`apps/web/scripts/draw-team-placeholders.mjs` (não são pessoas reais, sem direitos de terceiros).
Os nomes, funções e frases em `apps/web/lib/equipa.ts` também são inventados.

## Como trocar pelas pessoas reais

1. Pedir à associação uma foto de cada pessoa (de frente, fundo simples, de preferência vertical) e
   autorização escrita para a publicar (RGPD: a imagem é um dado pessoal).
2. Recortar em 4:5 (por exemplo 960×1200), guardar em WebP em `apps/web/public/equipa/`.
3. Atualizar nome, função, frase e `photo` em `apps/web/lib/equipa.ts` e pôr `teamIsPlaceholder = false`
   (deixa de aparecer a nota "Fotos e nomes de exemplo").
