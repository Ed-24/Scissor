# Scissor

Scissor is a production-minded URL shortener with branded slugs, QR code generation, realtime analytics, and authenticated link management.

The stack is intentionally simple and scalable:

- Frontend: React + TypeScript + Vite
- Styling: Tailwind CSS
- Backend: Convex
- Authentication: Clerk
- Charts: Recharts
- QR codes: `qrcode.react`
- Validation and slug generation: `nanoid` plus Convex server-side checks

## What It Does

- Create short links in under a second
- Support custom slugs with server-side collision checks
- Generate downloadable QR codes with foreground/background colors, error correction levels, and logo overlays
- Track clicks, referrers, countries, devices, and timestamps
- Show live dashboards that update as data changes in Convex
- Enforce phishing blocklist checks and link expiry
- Support authenticated user dashboards with Clerk + Convex

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Convex
- Clerk
- Recharts
- `qrcode.react`
- Playwright
- Vitest
- `convex-test`

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables in `.env.local`:

```bash
VITE_CONVEX_URL=https://your-convex-deployment.convex.cloud
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key
```

3. Start the frontend:

```bash
npm run dev
```

4. Run Convex locally or deploy the Convex backend, then point `VITE_CONVEX_URL` at the active deployment.

## Convex Setup

The backend lives in `convex/` and includes:

- `schema.ts` for links and click records
- `links.ts` for slug generation, validation, creation, deletion, expiry, and dashboard queries
- `clicks.ts` for click tracking and analytics aggregation
- `http.ts` for branded short-link redirects and 404/410 pages
- `auth.config.ts` for Clerk JWT validation against your Convex deployment

Recommended Convex workflow:

```bash
npx convex dev
```

If you use Clerk, make sure the Convex deployment has `CLERK_JWT_ISSUER_DOMAIN` set to your Clerk Frontend API URL and that the Clerk integration is enabled for the app instance you are using.

Or deploy directly:

```bash
npx convex deploy
```

## Clerk Setup

1. Create a Clerk application.
2. Copy the publishable key into `VITE_CLERK_PUBLISHABLE_KEY`.
3. Ensure your Clerk instance allows the local origin and the production domain.
4. Use the Clerk dashboard to configure sign-in and sign-up experience as needed.

The app is wired for real Clerk auth and Convex auth integration. Signed-in users land directly in the shorten flow, while signed-out users see the public landing page.

## Deployment

### Vercel

1. Import the repository into Vercel.
2. Set `VITE_CONVEX_URL` and `VITE_CLERK_PUBLISHABLE_KEY` in the project environment variables.
3. Build command: `npm run build`
4. Output directory: `dist`

### Convex

1. Connect the repo to your Convex project.
2. Run `npx convex deploy`.
3. Make sure the production deployment is the one referenced by `VITE_CONVEX_URL`.

### Custom Domain

Scissor is structured to support a dedicated short domain such as `scissor.link`.

- Point the short domain to the redirect endpoint
- Keep the app shell on your primary app domain
- Use the Convex HTTP action route for `302` redirects

## Testing

Run the full unit/component suite:

```bash
npm test
```

Run the production build check:

```bash
npm run build
```

Run Playwright E2E tests:

```bash
npx playwright test
```

The repo includes:

- Vitest coverage for slug generation, validation, collision handling, and expiry logic
- Component tests for ShortenForm, Dashboard, AnalyticsDashboard, and QRCodeDisplay
- Playwright coverage for shortening, custom slugs, QR downloads, redirect/click tracking, dashboard delete, and analytics

## Screenshots

Add live screenshots from a running deployment at these paths:

- `public/screenshots/hero.png`
- `public/screenshots/shorten.png`
- `public/screenshots/dashboard.png`
- `public/screenshots/analytics.png`

Then embed them here:

```md
![Hero](public/screenshots/hero.png)
![Shorten](public/screenshots/shorten.png)
![Dashboard](public/screenshots/dashboard.png)
![Analytics](public/screenshots/analytics.png)
```

## Notes

- Redirects use `302` to keep analytics accurate.
- Expired links return a branded `410 Gone` page.
- Phishing blocklist checks are enforced server-side.
- The dashboard and analytics use reactive Convex queries, so they update live as data changes.
