# The real site (Render + gatosdeninguem.pt)

The whole platform runs on [Render](https://render.com), described in [`render.yaml`](../render.yaml):

| Service | What | Plan | Address |
|---|---|---|---|
| `gatosdeninguem-site` | Public site (Next.js) | Starter, about $7/month | https://gatosdeninguem.pt (www redirects to it) |
| `gatosdeninguem-gestao` | Back office (static) | free | https://gestao.gatosdeninguem.pt |
| `gatosdeninguem-api` | API (NestJS) | Starter, about $7/month | https://api.gatosdeninguem.pt/health |
| `gatosdeninguem-db` | PostgreSQL, daily backups | Basic 256 MB, about $6/month | internal only |

Each service also keeps its `https://gatosdeninguem-….onrender.com` address, so everything can be tried before the domain points here. The GitHub Pages demo keeps working as before; it is separate.

The domain and the association's email stay at Hostinger. Only the website records change; the email records are never touched.

## 1. Create the services

1. Sign in to https://dashboard.render.com with GitHub and allow Render to see the `GatosDeNinguem` repository. Add the association's card under **Billing**.
2. **New → Blueprint**, pick the repository, branch `main`. Render reads `render.yaml`.
3. Render asks for the values it cannot make up. Type them in Render's form, never in a chat or in the repository:
   - `ADMIN_TOKEN`: the back office password, at least 16 characters.
   - `RESEND_API_KEY` and `LOGIN_EMAIL_FROM`: sign-in codes, newsletter and alerts by email (step 4). Can be left empty at first: codes then only show in the API's **Logs**.
   - `META_…`, `TIKTOK_…`, `STRIPE_…`, `VAPID_…`: optional, see [promocao-eventos.md](promocao-eventos.md) and [debito-direto.md](debito-direto.md). With real values they publish and charge for real.
4. **Apply**. The first deploy takes about 10 minutes. The database starts with the pages, SEO settings and shop settings, but no example cats, people, shifts or orders.
5. Check each service's `.onrender.com` address on its page. If one differs from the ones in `render.yaml` (Render adds a suffix when a name is taken), change them there and merge.
6. In the back office (`https://gatosdeninguem-gestao.onrender.com` until the domain points here): add the real cats and photos, check the numbers on **Sobre nós**, the shop's IBAN and the pages.

## 2. Point the domain (Hostinger hPanel → Domínios → gatosdeninguem.pt → DNS)

1. On each Render service, **Settings → Custom Domains** lists the domains from `render.yaml` and the DNS record each one needs. Use the values Render shows there.
2. In hPanel, turn off the Hostinger CDN for the domain, and the day before lower the TTL of the `@` and `www` records to 300.
3. Change the website records:

   | Type | Name | Value |
   |---|---|---|
   | A | `@` | the IP Render shows for the bare domain (replace both Hostinger IPs) |
   | CNAME | `www` | `gatosdeninguem-site.onrender.com` (replace the `cdn.hstgr.net` one) |
   | CNAME | `api` | `gatosdeninguem-api.onrender.com` |
   | CNAME | `gestao` | `gatosdeninguem-gestao.onrender.com` |

   Leave the `MX` records (`mx1/mx2.hostinger.pt`), the `TXT` SPF record and `_dmarc` as they are: they keep the @gatosdeninguem.pt mailboxes working. If there is a `CAA` record, it must allow `letsencrypt.org`.
4. Press **Verify** on each domain in Render. The certificates (https) are issued by themselves, usually within minutes.
5. Check: https://gatosdeninguem.pt opens with the padlock, `www.` goes to it, the back office signs in at https://gestao.gatosdeninguem.pt, and an email sent to and from a @gatosdeninguem.pt mailbox still arrives.

The WordPress at Hostinger is no longer used. Download a backup first (hPanel → Ficheiros → Cópias de segurança). Before cancelling the hosting plan, check whether the mailboxes come with it; if they do, move them to an email-only plan first.

## 3. Emails from the site (Resend)

1. Create an account at https://resend.com and add the domain `gatosdeninguem.pt`.
2. Resend shows two or three DNS records (DKIM, and SPF/MX on a `send` subdomain). Add them in hPanel as they are, next to the existing ones; they do not touch the mailboxes.
3. Create an API key and put it in Render as `RESEND_API_KEY`, with `LOGIN_EMAIL_FROM` such as `Gatos de Ninguém <nao-responder@gatosdeninguem.pt>`.

## 4. After the launch

- Add the domain to Google Search Console and send `https://gatosdeninguem.pt/sitemap.xml`.
- Change the website link on Facebook, Instagram, TikTok and Google Maps.
- The old Wix site (gatosdeninguem.wixsite.com) cannot redirect: replace its home page with a note and a link to gatosdeninguem.pt.

## Every day

- Every merge to `main` redeploys the services, once the GitHub checks pass. Migrations run before each deploy (`preDeployCommand`).
- Photos uploaded in the back office are stored in Postgres (`UPLOAD_STORAGE=database`), so the daily database backups include them.
- The back office sends `noindex`; the site may be indexed (`ALLOW_INDEXING=true`).

## A test copy with the example content

On a local copy: `pnpm install && pnpm demo` (see the README), or the GitHub Pages demo. To load the example cats and people into an empty database: `pnpm --filter @gn/api db:seed`. Never run that against the real database.
