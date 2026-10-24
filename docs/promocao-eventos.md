# Promoção automática de eventos

Quando a equipa publica uma notícia do tipo **Evento** com dia, hora e local, o site prepara sozinho a promoção:

- uma publicação na Página de Facebook e na Instagram, com fotografia e texto;
- uma story na Instagram (e, se quiser, no Facebook);
- uma publicação de fotografia no TikTok, quando a associação tiver conta (até lá fica por ligar);
- um email aos subscritores da newsletter que escolheram "eventos" (ou que não escolheram nenhum tema).

Tudo sai **uma semana antes do evento** (ou logo, se o evento for daqui a menos de uma semana).
Um gestor revê o texto e a fotografia uma vez em **Gestão › Promoção** e carrega em **Aprovar**. A partir daí sai sozinho no dia.
Se o evento mudar de dia ou de local depois de aprovado, a promoção volta a "Por aprovar" com o texto atualizado.
Se algum canal falhar (por exemplo, o token da Meta expirou), os outros saem na mesma e o que falhou fica marcado com o motivo e um botão **Tentar de novo**.

## O que a Meta permite (e não permite)

| Canal | Pela API? | Notas |
| --- | --- | --- |
| Publicação na Página de Facebook | Sim | Com ou sem fotografia. |
| Story na Página de Facebook | Sim | Precisa de fotografia. |
| Publicação na Instagram | Sim | Só **fotografias JPG**. As fotografias carregadas no back office já são JPG. |
| Story na Instagram | Sim | Só a fotografia: a API não põe autocolantes de ligação, texto nem música. Uma imagem vertical (1080×1920) com o texto já escrito fica melhor. |
| Publicação no TikTok | Sim | Fotografia JPG ou WebP, com música automática. Até a app ser aprovada pelo TikTok, só pode publicar como privado. |
| Grupos de Facebook e WhatsApp | Não | A Meta não deixa publicar em grupos por API. |

Outros limites: a Instagram aceita até 100 publicações por API em 24 horas; a conta tem de ser profissional e estar ligada à Página de Facebook; a fotografia tem de estar num endereço público (a Meta vai buscá-la).

## Ligar o Facebook e a Instagram (uma vez)

Feito por quem é administrador da Página de Facebook da associação.

1. **Instagram profissional ligada à Página.** Na app da Instagram: Definições › Tipo de conta › mudar para conta profissional (Empresa). Depois, na Página de Facebook: Definições › Contas ligadas › Instagram.
2. **Criar uma app da Meta.** Em [developers.facebook.com](https://developers.facebook.com/apps) › Criar app › tipo *Empresa*. Juntar os produtos *Facebook Login for Business* e *Instagram* (API com início de sessão no Facebook).
3. **Permissões.** A app precisa de `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `instagram_basic` e `instagram_content_publish`. Enquanto só pessoas com função na app (a equipa) a usarem, chega o acesso normal (*Standard Access*), sem revisão da Meta. Ponha a app em modo **Live** (pede o endereço da política de privacidade do site); em modo de desenvolvimento as publicações podem ficar visíveis só para a equipa.
4. **Token que não expira.** O mais seguro é um *utilizador de sistema* no Gestor de Negócios da Meta (Definições do negócio › Utilizadores de sistema), com a Página e a Instagram atribuídas e as permissões acima: o token gerado não expira.
   Alternativa: no [Graph API Explorer](https://developers.facebook.com/tools/explorer/) gerar um token de utilizador com as permissões, trocá-lo por um de longa duração e pedir `GET /me/accounts`. O token da Página que vem daí não expira enquanto a pessoa continuar administradora.
5. **Os números das contas.** `GET /me/accounts` mostra o `id` da Página. `GET /<id-da-página>?fields=instagram_business_account` mostra o `id` da Instagram.
6. **No servidor (Render › gatosdeninguem-api › Environment):**
   - `META_PAGE_ID`: o id da Página;
   - `META_IG_USER_ID`: o id da Instagram;
   - `META_PAGE_TOKEN`: o token do passo 4.

Basta um dos ids para ligar só esse canal. Em **Gestão › Promoção** aparece o que ainda falta ligar.

> O ambiente de testes no Render publica nas contas verdadeiras se lá puser estes valores. Para experimentar sem publicar, deixe-os vazios: a promoção fica marcada "Com erros: ainda não está ligado" e pode ver tudo o resto a funcionar.

## Ligar o TikTok (quando houver conta)

A associação ainda não tem TikTok. O ícone no rodapé do site aponta para `https://www.tiktok.com/@gatosdeninguem`, um endereço provisório: quando a conta existir, mude `TIKTOK_URL` em `apps/web/components/Footer.tsx` se o nome for outro.

1. Criar a conta TikTok da associação (de preferência conta de empresa).
2. Em [developers.tiktok.com](https://developers.tiktok.com/) criar uma app com os produtos *Login Kit* e *Content Posting API* (com *Direct Post*) e o âmbito `video.publish`.
3. Verificar o domínio de onde vêm as fotografias (o TikTok vai buscá-las). Na prática, o site tem de estar no domínio próprio (ex.: `gatosdeninguem.pt`), verificado por DNS no portal do TikTok.
4. Entrar uma vez com a conta da associação na app para obter o *refresh token* (válido um ano).
5. Pedir a auditoria da app ao TikTok. Até lá as publicações ficam privadas: ponha `TIKTOK_PRIVACY_LEVEL=SELF_ONLY` para testar.
6. No servidor: `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` e `TIKTOK_REFRESH_TOKEN`. A partir daí o TikTok passa a vir marcado nas novas promoções.

## Email aos subscritores

Usa o mesmo `RESEND_API_KEY` dos códigos de entrada. `NEWSLETTER_EMAIL_FROM` muda o remetente (por omissão o de `LOGIN_EMAIL_FROM`); o domínio tem de estar verificado no Resend.
Cada email leva uma ligação pessoal para deixar de receber (e o cabeçalho que o Gmail usa para o botão "Cancelar subscrição"). A ligação é assinada com `UNSUBSCRIBE_SECRET`; se mudar este valor, as ligações de emails antigos deixam de funcionar.

## Sair no dia certo

A API verifica de 10 em 10 minutos se há promoções para sair. No plano gratuito do Render a API adormece quando ninguém a usa, por isso há também uma tarefa no GitHub (`.github/workflows/promocoes.yml`) que de hora a hora a acorda e pede para publicar. Para a ligar, em GitHub › Settings › Secrets and variables › Actions crie:

- `PROMOCOES_API_URL`: `https://gatosdeninguem-api.onrender.com`
- `ADMIN_TOKEN`: o mesmo código de acesso do back office.

Qualquer outro serviço de cron pode fazer o mesmo: `POST /promocoes/correr` com `Authorization: Bearer <ADMIN_TOKEN>`.
