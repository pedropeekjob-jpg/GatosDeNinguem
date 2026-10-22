# Test environment (Render)

The whole platform runs on [Render](https://render.com)'s free plan, described in [`render.yaml`](../render.yaml):

| Service | What | Address |
|---|---|---|
| `gatosdeninguem-site` | Public site (Next.js) | https://gatosdeninguem-site.onrender.com |
| `gatosdeninguem-gestao` | Back office (static) | https://gatosdeninguem-gestao.onrender.com |
| `gatosdeninguem-api` | API (NestJS) | https://gatosdeninguem-api.onrender.com/health |
| `gatosdeninguem-db` | PostgreSQL | internal only |

The GitHub Pages demo keeps working as before; it is separate.

## Set it up once

1. Sign in to https://dashboard.render.com with GitHub and allow Render to see the `GatosDeNinguem` repository.
2. **New → Blueprint**, pick the repository, branch `main`. Render reads `render.yaml`.
3. Render asks for the values it cannot make up:
   - `ADMIN_TOKEN`: the back office password, at least 16 characters.
   - `RESEND_API_KEY` and `LOGIN_EMAIL_FROM`: optional. Leave them empty and sign-in codes only show in the API's **Logs**.
4. **Apply**. The first deploy takes about 10 minutes; the site waits for the API to be up before it builds.
5. Check each service's address on its page in Render. If one differs from the table above (Render adds a suffix when a name is taken), change the addresses in `render.yaml` and merge.

## After that

- Every merge to `main` redeploys the services, once the GitHub checks pass.
- Migrations run when the API starts. The demo content is loaded only when the database is empty, so the team's edits are kept.
- Photos uploaded in the back office are stored in Postgres (`UPLOAD_STORAGE=database`), because the free plan's disk is wiped on every deploy.
- The site tells search engines not to index it (`ALLOW_INDEXING=false`), and the back office sends `noindex`.

## Free plan limits

- The site and the API sleep after 15 minutes without visits. The first visit after that takes about a minute; then it is fast again.
- The free database expires 30 days after it is created (Render emails before). To keep the data, upgrade it to a paid plan on the database's page (about $6/month). Otherwise delete it and apply the Blueprint again: the demo content comes back.
- 1 GB of database space, enough for a few thousand resized photos.

To make it always on, change `plan: free` to `plan: starter` on the site and the API (about $7/month each).

## Start again from the demo content

Copy the **External Database URL** from the database's page in Render, then:

```bash
psql "<External Database URL>" -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
```

Restart the API (**Manual Deploy → Restart service**): it recreates the tables and loads the demo content.
