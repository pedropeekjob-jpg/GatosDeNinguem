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

## Online demo (GitHub Pages)

`.github/workflows/pages.yml` publishes a static demo of the public site on every push to `main`. It uses the example content, and forms check what you type but send nothing. Turn it on once in **Settings → Pages → Source: GitHub Actions**. To build it locally: `BASE_PATH=/GatosDeNinguem pnpm --filter @gn/web export:pages` (output in `apps/web/out`).

GitHub Pages only serves files, so the API, the back office, saved forms, redirects and live SEO edits need a Node host for production (for example Vercel for the site plus Render or Railway for the API and Postgres).

## Tests (test-first, mobile-first)

```bash
pnpm typecheck
pnpm test                 # unit + component tests (axe accessibility checks included)
pnpm --filter @gn/web build && pnpm e2e   # Playwright: Android phone, iPhone, desktop
```

API tests against Postgres run when `DATABASE_URL` is set. Every public page is checked on phones for: one `h1`, title, canonical, description, no horizontal scroll, body text ≥ 18px and zero WCAG 2.1 AA violations.

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

## Docs

- [docs/SEO.md](docs/SEO.md): what the SEO specialist can change in the back office, without a developer.
- [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md): rules that keep the site easy for older visitors.

## Brand

The official logo is in `apps/*/public/logo.svg` (ink) and `logo-branco.svg` (white), traced from the association's artwork. The look is minimal, like the logo: black ink on white, warm greys and generous space, with colour kept for meaning only (red for emergencies, soft tints in badges). Type is Atkinson Hyperlegible Next. All tokens live at the top of `packages/ui/src/styles.css`, and every text colour passes WCAG AA (checked by axe in the tests).
