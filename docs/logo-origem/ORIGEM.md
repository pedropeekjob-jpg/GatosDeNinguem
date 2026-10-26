# Origem do logótipo

Logótipo atualizado enviado pela associação a 26/10/2026 (PNG 3508 px, fundo transparente):

| Ficheiro | Versão |
|---|---|
| `LogotipoGatosNinguem-01.png` | Horizontal, preto |
| `LogotipoGatosNinguem-02.png` | Vertical (o gato com a cauda à volta do nome), preto |
| `LogotipoGatosNinguem-03.png` | Horizontal, branco |
| `LogotipoGatosNinguem-04.png` | Vertical, branco |

**Onde está no site** (os mesmos ficheiros na `apps/web/public/` e na `apps/backoffice/public/`):

- `logo.svg` e `logo-branco.svg`: o logótipo vertical vetorizado (cabeçalho, gestão).
- `logo-horizontal.svg` e `logo-horizontal-branco.svg`: o horizontal vetorizado.
- `icon.svg`, `favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`: só o gato, para o separador do navegador, o ecrã inicial do telemóvel e as notificações.
- `partilha.png` (só no site): o logótipo horizontal em fundo branco, 1200×630, para as pré-visualizações de links sem foto (Facebook, WhatsApp).
- `packages/ui/src/components/logoPaths.ts`: o vertical partido em peças (silhueta, olhos, boca, patas, perna, "O" e restantes letras) para a animação (`logoRig.ts`). Depois de o mudar: `pnpm --filter @gn/ui logo:svg`.

**Como foi vetorizado:** `scripts/` (Python, `pip install opencv-python-headless potracer pillow`): `python3 prep.py && python3 build.py && python3 horiz.py && python3 write.py`, dentro de `scripts/`. O vertical é colocado nas mesmas coordenadas do logótipo anterior (o gato é praticamente igual), para a animação continuar a encaixar. Os PNG dos ícones foram gerados a partir dos SVG no Chromium.
