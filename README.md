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

```bash
pnpm install
pnpm --filter @gn/web dev          # http://localhost:3000, demo content, no backend needed
```

Full stack with a database:

```bash
cp apps/api/.env.example apps/api/.env          # set DATABASE_URL and ADMIN_TOKEN
cp apps/web/.env.example apps/web/.env.local
cp apps/backoffice/.env.example apps/backoffice/.env
pnpm --filter @gn/api db:migrate && pnpm --filter @gn/api db:seed
pnpm dev                                         # web :3000, api :4000, back office :5173
```

Without `DATABASE_URL` the API runs on in-memory demo content; without `API_URL` the site does too.

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

The logo and name are kept. `apps/*/public/logo.svg` is a placeholder until the official files arrive; brand colour is `--gn-brand` in `packages/ui/src/styles.css`.
