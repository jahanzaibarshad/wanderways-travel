# Tasks 2–4: database, API, authentication and booking dashboard

Development base URL: `http://127.0.0.1:5000/api`. React uses `/api` through the Vite proxy so its HttpOnly cookie stays on the same origin.

## Local database

Run `npm run dev:demo` from the root for a quick preview. It downloads a real MongoDB binary and starts an isolated, temporary replica set with five seeded tours. Accounts and bookings disappear when the server stops. Demo mode is blocked in production.

For persistent data, copy `server/.env.example` to `server/.env`, configure `MONGODB_URI` for Atlas or a local replica set, and set a unique `JWT_SECRET` of at least 32 characters. Standalone MongoDB cannot run the booking transaction. Restart the server after changing environment variables.

```powershell
npm run seed --workspace server
npm run dev
```

Seeding inserts missing tours by slug without deleting records or resetting booked seats. Departures start 14, 28 and 42 days after the initial seed date at 08:00 UTC, with 12 seats each. Prices are whole PKR amounts per guest.

## Routes

| Method | Route                        | Access    | Result                                        |
| ------ | ---------------------------- | --------- | --------------------------------------------- |
| GET    | `/health`                    | Public    | Liveness and database connectivity            |
| GET    | `/tours`                     | Public    | Array of active tours                         |
| GET    | `/tours/:id`                 | Public    | Tour with departure slots                     |
| POST   | `/auth/register`             | Public    | Create customer and set JWT cookie, 201       |
| POST   | `/auth/login`                | Public    | Authenticate customer or staff and set cookie |
| GET    | `/auth/me`                   | Signed in | Current public user profile                   |
| POST   | `/auth/logout`               | Public    | Clear JWT cookie                              |
| POST   | `/bookings`                  | Customer  | Reserve seats and create booking, 201         |
| GET    | `/bookings/mine`             | Signed in | Current user's bookings                       |
| GET    | `/staff/session`             | Staff     | Verify staff authorization                    |
| GET    | `/bookings/:id`              | Owner     | Booking confirmation with tour details        |
| GET    | `/staff/bookings`            | Staff     | Searchable, paginated reservations and totals |
| PATCH  | `/staff/bookings/:id/status` | Staff     | Confirm or cancel a reservation               |

## Authentication

Registration body:

```json
{ "name": "Your Name", "email": "you@example.com", "password": "a-unique-password" }
```

Login uses `email` and `password`. Emails are normalized to lowercase. Passwords require 8–72 characters and at most 72 UTF-8 bytes, and are hashed with bcrypt cost 12. Public registration always creates a customer; input `role` is ignored. Responses include a `user` with `id`, `name`, `email`, `role`, never password hashes.

JWTs are stored in the `wanderways_token` HttpOnly cookie, with a 1-day expiry, SameSite=Lax and Secure in production. They are not exposed to React or localStorage. API clients may also use a signed JWT with `Authorization: Bearer <token>`. Roles are checked from MongoDB on every authenticated request. Logout clears the browser cookie; a separately copied JWT remains valid until expiry.

Browser mutations reject foreign Origins. Production needs a same-origin `/api` proxy or an equivalent trusted same-site configuration; cross-site cookies are not enabled by default. Auth endpoints allow 30 attempts per 15 minutes per IP; API endpoints allow 300 requests. Configure trusted proxies for the actual deployment topology before hosting.

## Staff account

Set `STAFF_NAME`, `STAFF_EMAIL`, and `STAFF_PASSWORD` privately in your environment, then run:

```powershell
npm run create-staff --workspace server
```

Staff passwords require 12–72 bytes. Existing accounts are never overwritten or promoted. Remove `STAFF_PASSWORD` afterwards. Staff log in using the same React form and open the Dashboard link; `/staff/session` also verifies staff-only access.

The React staff dashboard is available at `/staff`. Demo mode creates `staff@wanderways.example` with password `WanderWays-Staff42!`; this account is never seeded in production. Use the private account creation command above for persistent environments.

## Booking

Fetch `/tours` and select a tour `_id` and a slot `_id`:

```json
{
  "tourId": "<tour _id>",
  "slotId": "<departure _id>",
  "guests": 2,
  "contactName": "Your Name",
  "contactEmail": "you@example.com",
  "phone": "+92 300 1234567"
}
```

The server uses the authenticated customer's ID and calculates total price from MongoDB. Guests must be an integer from 1 to 12. The departure must belong to an active tour, be in the future and have sufficient capacity. Seat reservation and booking creation run in a MongoDB transaction. The 201 response contains `_id`, a unique `WW-...` reference, `date`, `status: pending` and `totalPrice`.

PowerShell example:

```powershell
$base = 'http://127.0.0.1:5000/api'
$loginBody = @{ email = 'you@example.com'; password = 'a-unique-password' } | ConvertTo-Json
Invoke-RestMethod "$base/auth/login" -Method Post -ContentType 'application/json' -Body $loginBody -SessionVariable travellerSession
$tours = Invoke-RestMethod "$base/tours"
$bookingBody = @{
  tourId = $tours[0]._id
  slotId = $tours[0].slots[0]._id
  guests = 2
  contactName = 'Your Name'
  contactEmail = 'you@example.com'
  phone = '+92 300 1234567'
} | ConvertTo-Json
Invoke-RestMethod "$base/bookings" -Method Post -ContentType 'application/json' -Body $bookingBody -WebSession $travellerSession
```

## Task 4: booking flow and staff management

Customers select an upcoming departure, enter guest/contact details and review the server-calculated price. Confirmation is available at `/bookings/:id/confirmation`; `/bookings` shows only that customer's reservations. No payment is collected by this flow. Pending and confirmed reservations both hold seats.

`GET /staff/bookings` accepts `status` (`pending`, `confirmed`, `cancelled`), `search` (up to 100 characters) and `page` (starting at 1). Pages contain 20 results. Search covers booking reference, contact name/email and tour title/destination. The response includes `bookings`, `pagination` and global status counts in `summary`.

`PATCH /staff/bookings/:id/status` accepts `{ "status": "confirmed" }` or `{ "status": "cancelled" }`. Cancellation releases seats in the same transaction as the status change. Repeating a completed transition is safe; cancelled bookings cannot be reopened. Customers cannot call these endpoints. Cancellation asks for confirmation in the dashboard.

Task 4 uses the existing models and temporary demo database. Permanent MongoDB/Atlas configuration and production deployment remain deferred.

## Errors and tests

The production dependency audit is clean. The full audit currently reports 19 moderate advisories through Jest's development-only `sprintf-js` dependency chain. The proposed automatic fix downgrades Jest across major versions; it has not been applied. Recheck this chain before final hand-over.

JSON errors include `message`; validation errors also include `errors` by field. Status codes: 400 invalid input, 401 missing/invalid/expired session, 403 role/origin rejected, 404 missing tour, 409 duplicate email or unavailable departure, 429 rate limit. Unexpected errors do not expose server details.

`npm test` runs 39 React Testing Library/Vitest tests for the customer flow, validation, ownership guards, staff actions, tour discovery, homepage data, FAQs, sign-in redirects, printing, route accessibility, network timeouts, retries, pagination recovery and destination photography, plus 29 Jest/Supertest tests against a separate temporary MongoDB replica set. Backend coverage includes JWT cookies, roles, booking ownership, concurrent reservations, idempotent confirmation, concurrent cancellation and rollback. These are component/API integration tests, not browser end-to-end tests. Tests never connect to `MONGODB_URI`. The first backend run requires a MongoDB binary download. Set `MONGOMS_DOWNLOAD_DIR` to move its cache to another drive and `DEMO_DB_ROOT` for demo database storage (the directory must exist). Tests use the shell's `TEMP` and `TMP` for temporary files on Windows. Demo mode uses a regular Node process; restart manually after server-code edits.
