# WanderWays Travel

A MERN tour-booking application with customer reservations and role-protected staff management.

## Features

- Tour search, destination/availability filters and price/duration sorting.
- Real destination photography with responsive images and local fallbacks.
- JWT authentication using HttpOnly cookies and database-checked customer/staff roles.
- Booking forms, server-calculated prices, confirmation references and printable reservation details.
- Customer-owned booking history and staff reservation search, filtering and pagination.
- Transactional seat allocation, confirmation and cancellation without overselling or duplicate seat release.
- Responsive layouts, keyboard navigation and automated component/API/deployment tests.

Online payments, email delivery and password recovery are not implemented. This application reserves seats and does not collect card details.

## Requirements

Node.js 20.19+ or 22.12+, npm and MongoDB Atlas or a MongoDB replica set. Standalone MongoDB cannot execute booking transactions.

## Development setup

1. Run `npm ci` from the repository root.
2. On first setup only, copy `server/.env.example` to `server/.env`. Do not overwrite an existing environment file.
3. Configure `MONGODB_URI`, a unique `JWT_SECRET` of at least 32 characters and `CLIENT_URL=http://127.0.0.1:5174`. The frontend defaults to the same-origin `/api` proxy.
4. Run `npm run dev` and open http://127.0.0.1:5174.
5. API readiness: http://127.0.0.1:5000/api/health.

Generate a JWT secret locally; keep its output private:

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

There are no built-in staff accounts, public passwords or automatically created customer accounts.

## Staff provisioning

Provide `STAFF_NAME`, `STAFF_EMAIL` and a unique `STAFF_PASSWORD` (12–72 UTF-8 bytes) through private environment settings, then run:

```sh
npm run create-staff --workspace server
```

Existing accounts are never overwritten or promoted. Remove `STAFF_PASSWORD` from the provisioning environment after success; retain credentials in a password manager. Staff use the normal login form and access `/staff`.

## Optional sample tour data

For a new development database only:

```sh
npm run seed --workspace server
```

The explicit seed inserts missing sample tours by slug without deleting records, resetting capacity or altering bookings. It never runs at startup or deployment. Replace sample itineraries with agency-approved data before accepting real customers.

## Production startup

```sh
npm ci --include=dev
npm run build
npm prune --omit=dev
npm start
```

Configure `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL` as the exact public HTTPS origin and the appropriate numeric `TRUST_PROXY` hop count. The hosting provider supplies `PORT`. Express serves the built React website and API on one origin; Vite is not a production server.

The optional `render.yaml` does not create a hosting service or configure Atlas access by itself. On Render, `RENDER_EXTERNAL_URL` supplies the allowed origin when `CLIENT_URL` is unset. See [deployment and operations](DEPLOYMENT.md).

## Verification

```sh
npm run format:check
npm run lint
npm test
npm run build
npm audit --omit=dev
```

Database integration tests use an isolated temporary replica set and never connect to the application's configured database. A MongoDB test binary is downloaded on the first run. Component/API tests do not replace real-browser, mobile or hosted acceptance testing.

## Commands

| Command                                   | Purpose                                               |
| ----------------------------------------- | ----------------------------------------------------- |
| `npm run dev`                             | Run the development frontend and API                  |
| `npm start`                               | Start the API; serve the frontend build in production |
| `npm run build`                           | Build the React frontend                              |
| `npm run create-staff --workspace server` | Provision staff from private environment settings     |
| `npm run seed --workspace server`         | Explicitly insert optional sample tours               |
| `npm test`                                | Run frontend and backend tests                        |
| `npm run lint`                            | Check source code                                     |
| `npm run format:check`                    | Verify formatting                                     |

## Structure

```text
client/                 React/Vite frontend and component tests
client/public/images/   Optimized destination photographs
server/src/             Express API, models, authentication and production hosting
server/scripts/         Explicit provisioning and sample-data commands
server/test/            Isolated integration and deployment tests
.github/workflows/      Continuous integration
render.yaml             Optional hosting configuration
```

## Security and launch requirements

- Keep database credentials, JWT secrets, staff passwords and tokens out of Git. Local environment files are ignored.
- Public registration cannot grant staff access; roles are checked against MongoDB.
- Production cookies are HttpOnly, Secure and SameSite=Lax. Browser writes reject foreign origins.
- The trusted proxy hop count must match the actual network topology for correct per-client rate limiting.
- Seat changes and reservation statuses are protected by MongoDB transactions.
- `/api/health` returns 200 when connected and 503 when the database is unavailable.
- Before business launch: supply verified contacts and approved policies, replace test access/data deliberately, configure backups/recovery and complete hosted/mobile acceptance tests.
- Source preparation is not a claim of a deployed or fully audited production service. No verified live URL is currently recorded.

## Documentation

- [API reference](docs-api.md)
- [Deployment and operations](DEPLOYMENT.md)
- [Photo sources and licenses](PHOTO-CREDITS.md)

Photography illustrates destinations, not guaranteed weather, accommodation or itinerary inclusions.
