# SEO guide

Everything below is changed in the back office under **SEO**, with no developer and no deploy. Changes reach the live site within seconds (the API asks the site to refresh).

## Per page, cat and news item ("Páginas e gatos")

The list shows each page with its problems in plain Portuguese (e.g. "Título demasiado curto"). Open one to edit:

| Field | Effect | Default when empty |
|---|---|---|
| Título no Google | `<title>`, `og:title`. Used **exactly** as written | Generated: `{heading} \| Gatos de Ninguém` |
| Descrição no Google | `meta description`, `og:description` | Page intro / cat summary |
| URL canónico | `<link rel="canonical">` | The page's own address |
| Imagem para partilhas | `og:image` (1200×630) | Cat photo or site default |
| Esconder do Google | `noindex` + removed from sitemap | Indexed |
| Dados estruturados extra | Extra JSON-LD merged with the automatic data | — |

A live Google preview and character counters (title 30–60, description 70–160) show as you type.

The web address (slug) of cats and news is edited in their own forms; changing it creates nothing automatically, so add a redirect from the old address.

## Redirects ("Redirecionamentos")

301 (permanent) or 302 redirects from any old path. The old Wix addresses (`/gatos`, `/gatos/como-ajudar`, …) are already mapped. Duplicates are refused.

## General settings ("Definições gerais")

Site name, title template, default description, default share image, site URL, and the organisation details used in JSON-LD (address, phone, social profiles).

## Generated automatically

- `sitemap.xml`: every page, adoptable cat and news item, with `lastmod`; hidden pages left out.
- `robots.txt`: allows crawling and points to the sitemap **only when `ALLOW_INDEXING=true`** (production). Staging and previews are never indexed.
- JSON-LD: `AnimalShelter` + `NGO` on every page, `BreadcrumbList` on inner pages, `NewsArticle` on news.
- All public pages are server-rendered HTML; no content depends on JavaScript to be indexed.
