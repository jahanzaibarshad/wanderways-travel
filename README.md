# WanderWays Travel Online Booking Platform

WanderWays is a MERN application for browsing curated tours, reserving tour slots, and managing reservations through a staff dashboard.

## Current milestone

Tasks 1–4 provide tours, authentication, the booking flow and staff reservations:

- npm-workspaces monorepo with separate `client` and `server` applications
- responsive React landing page with a clear tour call-to-action
- Express API foundation with a health endpoint
- integration tests for health, tours, authentication and booking capacity
- shared ESLint and Prettier configuration
- GitHub Actions workflow for formatting, linting, tests, and production build

- MongoDB Tour, Booking and User models with a safe five-tour seed script
- public tours API and transaction-protected customer booking endpoint
- JWT login/register with HttpOnly cookies and customer/staff role checks
- React tours, tour details, login, registration and account pages
- Jest/Supertest schema and API integration tests

Customer booking forms, confirmation screens, My Bookings and the staff reservation dashboard are implemented. Permanent MongoDB/Atlas configuration and deployment are deferred. See [the API and database guide](docs-api.md) for setup, examples and staff-account creation.

## Try Task 4 locally

Run `npm run dev:demo` and open `http://127.0.0.1:5174/tours`. Register a customer, select a journey and scheduled departure, enter guests/contact information, and submit. Your reference and status appear on the confirmation page and in My Bookings. No online payment is taken.

To try staff features, sign out and sign in with this **temporary demo account**:

- Email: `staff@wanderways.example`
- Password: `WanderWays-Staff42!`
- Dashboard: `http://127.0.0.1:5174/staff`

This account exists only in `dev:demo`, which is blocked in production. Staff can search by reference/customer/tour, filter by status, paginate, refresh and confirm/cancel reservations. Cancellation releases seats exactly once; cancelled reservations cannot be reopened. Demo accounts and bookings disappear when the server stops. Permanent database setup remains a later step.

## Website completion and launch checklist

Real destination photography now appears in the hero, tour cards/details, sign-in/register pages and editorial travel sections. Six source photos are stored locally as responsive WebP assets; no external image requests are required. See [PHOTO-CREDITS.md](PHOTO-CREDITS.md) and the footer's Photography Credits page. Destination imagery does not change tour inclusions or database records.

Permanent database ke simple steps: [DATABASE-SETUP.md](DATABASE-SETUP.md). Existing local `.env` overwrite na karo; Atlas use karte waqt `npm run dev`, not `dev:demo`.

Final reliability pass adds a customer bookings refresh, journey retry, 15-second request timeout, readable offline errors, uncertain-booking guidance and staff pagination recovery. Database configuration is unchanged.

The website now includes URL-backed tour search, destination and availability filters, price/duration sorting, real API-powered homepage cards, upcoming departure information, booking FAQs, role-aware sign-in redirects, password visibility controls, printable reservation details, page titles, keyboard skip navigation and reduced-motion support. The existing MERN stack and visual design are preserved. Placeholder agency email and unsupported guest/rating claims have been removed.

Before production launch, the following work remains:

- Configure permanent MongoDB/Atlas, environment secrets, backups and the real staff account (deferred at the user's request).
- Supply verified agency contact details and business-approved privacy, cancellation/refund and travel terms. The help page describes current app behavior; it is not a legal policy.
- Run real-browser/mobile acceptance checks, including a complete customer-to-staff reservation flow.
- Create/push the GitHub repository, choose hosting, configure same-origin API/cookies and trusted proxies, then verify the live deployment.
- Finalize hand-over documentation and rerun checks against the deployment configuration.

Online payments, email delivery and password-reset delivery are not implemented or required by the supplied brief. Add these only if the agency requests them; this demo does not pretend they are connected.

## Tech stack

- React and Vite
- Node.js and Express
- MongoDB and Mongoose
- JWT authentication, bcrypt, Zod, Helmet and rate limiting
- Jest/Supertest and React Testing Library/Vitest

> The original brief mentions Create React App. This repository uses Vite because Create React App is deprecated for new React applications. The client still provides `npm start` for brief compatibility.

## Prerequisites

- Node.js 20.19+ or 22.12+
- npm
- Git

## Local setup

1. Install all workspace dependencies from the repository root:

   ```bash
   npm install
   ```

2. Create local environment files:

   PowerShell:

   ```powershell
   Copy-Item client/.env.example client/.env
   Copy-Item server/.env.example server/.env
   ```

   Bash:

   ```bash
   cp client/.env.example client/.env
   cp server/.env.example server/.env
   ```

3. Start the React client and Express server together:

   ```bash
   npm run dev:demo
   ```

   Demo mode uses temporary MongoDB and seeds five tours. Records disappear when the server stops. For persistent data, configure `MONGODB_URI` and `JWT_SECRET`, run `npm run seed --workspace server`, then use `npm run dev`. See [database setup](docs-api.md).

4. Open the applications:

   - Client: `http://127.0.0.1:5174`
   - API: `http://localhost:5000`
   - Health check: `http://localhost:5000/api/health`

## Scripts

| Command                                   | Purpose                                                      |
| ----------------------------------------- | ------------------------------------------------------------ |
| `npm run dev`                             | Start client and server in development mode                  |
| `npm run dev:demo`                        | Start both with temporary, automatically seeded MongoDB      |
| `npm run seed --workspace server`         | Safely insert five sample tours into the configured database |
| `npm run create-staff --workspace server` | Create a staff account from private environment settings     |
| `npm start`                               | Alias for the development command                            |
| `npm run build`                           | Create the production client build                           |
| `npm run lint`                            | Check client and server source code                          |
| `npm run format`                          | Format the repository with Prettier                          |
| `npm run format:check`                    | Verify repository formatting                                 |
| `npm test`                                | Run tests in workspaces that provide a test script           |

## Project structure

```text
.
|-- client/                 React front end
|   |-- src/
|   |   |-- assets/
|   |   `-- components/
|   `-- .env.example
|-- server/                 Express API
|   |-- src/
|   `-- .env.example
|-- .github/workflows/      Continuous integration
|-- eslint.config.js
`-- package.json            Root workspace scripts
```

## API endpoints

### `GET /api/health`

Returns API availability information.

Example response:

```json
{
  "success": true,
  "message": "WanderWays API is running",
  "timestamp": "2026-10-09T12:00:00.000Z",
  "database": "connected"
}
```

## Roadmap

1. Project scaffold and landing page
2. Tour and booking data models with public tours API
3. Customer/staff authentication and protected routes
4. Customer booking flow and staff reservation dashboard
5. Security hardening, automated testing, deployment, and hand-over

## Security

Environment secrets must stay in local `.env` files or deployment-provider settings. Never commit MongoDB credentials, JWT secrets, or real user passwords.
