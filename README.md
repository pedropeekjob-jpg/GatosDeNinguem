# Gatos de Ninguém

New platform for the Associação Gatos de Ninguém (Viana do Castelo): a public site that guides people to adopt, help and report cats in need, and a back office for the volunteers who run the shelter.

| | What it is | Tech |
|---|---|---|
| `apps/web` | Public site (SEO-first, server-rendered) | Next.js 15, React 19 |
| `apps/backoffice` | Volunteer back office (cats, news, schedules, SEO) | React 19 + Vite SPA |
| `apps/api` | REST API | NestJS 11 on Fastify, Prisma + PostgreSQL |
| `packages/ui` | Content-agnostic, senior-friendly components | React |
| `packages/domain` | Schemas (zod), business rules, demo content | TypeScript |
| `packages/seo` | Titles, canonical, sitemap, robots, JSON-LD, SEO audit | TypeScript |

## Run it

Requires Node 22 and pnpm 10 (`corepack enable`).

Try everything with one command, no database needed:

```bash
pnpm install
pnpm demo
```

| | Address |
|---|---|
| Public site | http://localhost:3000 |
| Back office | http://localhost:5173 (password `demo-gatos-de-ninguem`) |
| API | http://localhost:4000/health |

Demo content lives in memory: back office edits show on the site, and everything resets when you stop.

Full stack with a database:

```bash
cp apps/api/.env.example apps/api/.env          # set DATABASE_URL and ADMIN_TOKEN
cp apps/web/.env.example apps/web/.env.local
cp apps/backoffice/.env.example apps/backoffice/.env
pnpm --filter @gn/api db:migrate && pnpm --filter @gn/api db:seed
pnpm dev                                         # web :3000, api :4000, back office :5173
```

Without `DATABASE_URL` the API runs on in-memory demo content; without `API_URL` the site does too.

## Loja solidária

`/loja` sells the association's articles. Orders reserve the stock and say how to pay (MB WAY, bank transfer or on pickup); nothing is charged on the site yet. The team confirms payments, records sales at stands, adds what the money paid for (shown publicly) and handles offers of donated articles in the back office (Loja). The MB WAY number is set there. Online payment (MB WAY, Multibanco, card) can be added later through a payment provider, at the point where an order is placed.

## Avisos de gatos novos

Visitors ask to be told when a cat is put up for adoption: a window offers it once (never on the first page at once, never on SOS, forms or the shop, and not again for two months after "Agora não"), and Adotar has a button for it. Email needs a click on a confirmation link before anything is sent; unconfirmed sign-ups are dropped after 7 days, and every alert has a one-click unsubscribe. Where the browser allows and the VAPID keys are set, people can choose notifications on their device instead. The alert goes out by itself the first time a cat is saved as "Para adoção"; managers see who asked and what was sent in the back office (Avisos). Uses the same `RESEND_API_KEY` as sign-in codes.

## Online demo (GitHub Pages)

`.github/workflows/pages.yml` publishes a static demo of the public site on every push to `main`. It uses the example content, and forms check what you type but send nothing. Turn it on once in **Settings → Pages → Source: GitHub Actions**. To build it locally: `BASE_PATH=/GatosDeNinguem pnpm --filter @gn/web export:pages` (output in `apps/web/out`).

GitHub Pages only serves files, so the API, the back office, saved forms, redirects and live SEO edits need a Node host.

## Test environment (Render)

`render.yaml` deploys the site, the back office, the API and Postgres on Render's free plan, and redeploys on every merge to `main` once the checks pass. Setup steps and limits: [docs/DEPLOY.md](docs/DEPLOY.md).

## Tests (test-first, mobile-first)

```bash
pnpm typecheck
pnpm test                 # unit + component tests (axe accessibility checks included)
pnpm --filter @gn/web build && pnpm e2e   # Playwright: Android phone, iPhone, desktop
```

API tests against Postgres run when `DATABASE_URL` is set. Every public page is checked on phones for: one `h1`, title, canonical, description, no horizontal scroll, body text ≥ 16px and zero WCAG 2.1 AA violations.

## Environment variables

| Variable | App | Purpose |
|---|---|---|
| `DATABASE_URL` | api | PostgreSQL. Empty → in-memory demo |
| `ADMIN_TOKEN` | api | Back office password (≥ 16 chars). Temporary until accounts exist |
| `CORS_ORIGINS` | api | Back office origin(s), comma-separated |
| `WEB_REVALIDATE_URL`, `REVALIDATE_SECRET` | api, web | API tells the site to refresh pages after edits |
| `API_URL` | web | API base URL. Empty → demo content |
| `ALLOW_INDEXING` | web | `true` only on the production domain |
| `VITE_API_URL` | backoffice | API base URL |
| `UPLOAD_DIR` | api | Folder for uploaded photos (default `./uploads`) |
| `UPLOAD_STORAGE` | api | `database` keeps photos in Postgres instead, for hosts without a persistent disk |
| `PUBLIC_API_URL` | api | Public address used in photo URLs (on Render, `RENDER_EXTERNAL_URL`) |
| `VITE_SITE_URL` | backoffice | Public site address, for links to the site |
| `RESEND_API_KEY`, `LOGIN_EMAIL_FROM` | api | Sends sign-in codes by email (Resend). Without it codes only go to the log |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | api | Optional: "Avisem-me de gatos novos" as notifications on the visitor's device. Make the pair with `npx web-push generate-vapid-keys`. Without them only email is offered |

## Accounts and Patinhas

Helpers sign in with their email or mobile and a 6-digit code (no passwords). The account page (`/conta`) shows their Patinhas, level, badges, the month's community challenge, and lets them swap points for partner perks, getting a code to show at the counter. `/patinhas` explains the rules publicly. In the back office, **Patinhas** confirms actions done off the site, marks perk codes as used (or cancels and refunds them), and edits points per action, badges, monthly challenges and each partner perk's price, minimum level and monthly limit.

Shift points are automatic: marking a volunteer present in Escalas pays the account with the same mobile number, including shifts done before the account existed. Adopting never earns points, levels count everything earned (spending never lowers a level), streaks are counted in months, and the thanks wall only shows people who opted in, by nickname or first name.

Without an API (the GitHub Pages demo and `next start` without `API_URL`) all of this runs in the browser on example data; sign in with `912 000 001` to see an account with history. In `pnpm demo` the code is shown on screen. In production, email codes need `RESEND_API_KEY`; codes for mobile numbers need an SMS or WhatsApp provider, still to be chosen, and until then are only written to the API log.

## Docs

- [docs/DEPLOY.md](docs/DEPLOY.md): the test environment on Render.
- [docs/SEO.md](docs/SEO.md): what the SEO specialist can change in the back office, without a developer.
- [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md): rules that keep the site easy for older visitors.

## Brand

The official logo is in `apps/*/public/logo.svg` (ink) and `logo-branco.svg` (white), traced from the association's artwork. The look is minimal, like the logo: black ink on white, warm greys and generous space, with colour kept for meaning only (red for emergencies, soft tints in badges). Type is Atkinson Hyperlegible Next. All tokens live at the top of `packages/ui/src/styles.css`, and every text colour passes WCAG AA (checked by axe in the tests).
