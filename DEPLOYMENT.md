# WanderWays: Render deployment

This deployment keeps the existing MERN app: one Express service serves the built React website and `/api`; MongoDB remains in Atlas. Cookies stay on the same HTTPS origin. Hosting configuration is ready in `render.yaml`; this file alone does not create a deployment.

## 1. Connect your account and repository

Sign in to [Render](https://dashboard.render.com/) using GitHub and authorize access to the project repository.

Keep hosting API keys, database credentials and staff passwords private. Configure only the documented hosting environment values rather than importing all local development settings.

## 2. Create one free web service

Use New → Blueprint with the repository's `render.yaml`, or create New → Web Service manually:

| Setting        | Value                                                           |
| -------------- | --------------------------------------------------------------- |
| Repository     | `jahanzaibarshad/wanderways-travel`                             |
| Branch         | `main`                                                          |
| Root Directory | Leave empty (repository root)                                   |
| Runtime        | Node                                                            |
| Compute plan   | Free                                                            |
| Build command  | `npm ci --include=dev && npm run build && npm prune --omit=dev` |
| Start command  | `npm start`                                                     |
| Health check   | `/api/health`                                                   |

Do not create a Render Postgres database, disk, paid service or separate static frontend for this setup.

## 3. Set server environment variables privately

- `NODE_ENV=production`
- `NODE_VERSION=22`
- `TRUST_PROXY=1` for this single Render reverse-proxy deployment. Reassess the hop count if the network topology changes; never use `true` to trust arbitrary forwarded addresses.
- `VITE_API_URL=/api` for the client build.
- `MONGODB_URI`: copy your existing working Atlas URI from the ignored local `server/.env` into Render's secret environment field.
- `JWT_SECRET`: generate a fresh random secret of at least 32 characters; the Blueprint can generate it. Do not reuse a published example value.

Render supplies `RENDER_EXTERNAL_URL`; the app uses it as its allowed client origin when `CLIENT_URL` is unset. For a custom domain or a non-Render host, set `CLIENT_URL` to the exact public HTTPS origin with no trailing slash, e.g. `https://your-domain.example`. Do not leave it pointing to localhost.

Render supplies `PORT`; do not copy the local `PORT=5000`. Do not add `STAFF_PASSWORD`, test database cache settings, `TEMP` or Windows cache paths to production. Database/account seeding is never run on startup.

## 4. Allow the service to connect to Atlas

Open the Render service → Connect → Outbound, copy **all** outbound IP ranges and add them to Atlas Network Access. Preserve any current developer IP entry. Do not open Atlas to `0.0.0.0/0` as a shortcut. Initial startup may fail until these ranges have been added; redeploy once access is active.

The existing `wanderways` database and tours are used; do not seed/reset it on every deployment. No automatic customer or booking migration is needed. This database currently contains test records and a test staff account: review them before making the service public for real customers. Replacing/removing test records is a separate deliberate step.

## 5. Verify the live URL

After the deploy reports Live, verify:

- `/api/health` returns HTTP 200 and `database: connected`; disconnected database returns 503.
- `/`, `/tours`, `/login`, `/staff` and `/bookings` load or show the intended sign-in guard when opened directly/refreshed.
- Local WebP photos and Vite assets load without mixed-content/CSP errors.
- Register/login/logout and staff-only access work; session cookies are HttpOnly, Secure and SameSite=Lax.
- Check the recorded client IP behind the proxy so rate limiting is not accidentally global. Never log credentials/cookies while debugging.
- With an explicitly designated test booking, verify confirm/cancel and released seats. Do not cancel real reservations as a deployment probe.
- Test phone/tablet layouts and verify data survives a restart.

## Limits and remaining launch work

Render Free is for demos/hobby evaluation, not a production availability guarantee. It sleeps after 15 minutes without requests and can take about a minute to wake. Usage limits apply; review billing/spend controls before adding a payment method. Do not enable a paid upgrade without approval. Atlas Free also requires a separate backup/recovery plan before real business use.

Remaining business hand-over items: real agency contacts, approved privacy/cancellation/travel policies, replacement of the test staff login, backup/recovery procedures and a verified live URL recorded in the README. Payments and email delivery are not implemented.

Sources: [Node/Express on Render](https://render.com/docs/deploy-node-express-app), [Free limits](https://render.com/docs/free), [Outbound IP ranges](https://render.com/docs/outbound-ip-addresses), [Blueprint specification](https://render.com/docs/blueprint-spec).
