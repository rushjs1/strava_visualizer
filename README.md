# Pulse Vault

A private personal Strava analytics dashboard built with Next.js App Router,
TypeScript, Tailwind CSS, shadcn/ui, lucide-react, and Recharts.

## Strava OAuth

Create a Strava API app, then set the callback domain to `localhost` for local
development. Add these values to `.env.development.local`:

```bash
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_REDIRECT_URI=http://localhost:3000/api/auth/strava/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Restart `pnpm dev`, open `/settings`, and click **Connect Strava**. The app
requests `activity:read_all` and `profile:read_all` for the single authenticated
owner of this private dashboard.

OAuth tokens are stored locally in `.data/strava-oauth.json`, which is ignored by
git. Access tokens refresh automatically server-side using the stored refresh
token. All Strava API calls live in `lib/strava.ts` and run server-side only.
The UI falls back to mock personal activity data when no token is configured or
the API request fails.

For quick one-off testing, `STRAVA_ACCESS_TOKEN` is still supported as an
optional fallback, but OAuth storage is preferred.

## Production on Netlify

For production, use durable encrypted token storage instead of the local
filesystem. Set these Netlify environment variables:

```bash
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_REDIRECT_URI=https://your-site.netlify.app/api/auth/strava/callback
NEXT_PUBLIC_APP_URL=https://your-site.netlify.app
STRAVA_TOKEN_STORAGE=netlify-blobs
TOKEN_ENCRYPTION_KEY=your_long_random_secret
```

Generate the encryption key with:

```bash
openssl rand -base64 32
```

When `STRAVA_TOKEN_STORAGE=netlify-blobs`, the app encrypts the Strava OAuth
token JSON with AES-256-GCM before writing it to Netlify Blobs. The deployed
server decrypts it only when it needs to refresh or call Strava. Keep
`TOKEN_ENCRYPTION_KEY` in Netlify environment variables only; do not commit it.

## Compliance scope

This is for one authenticated user's private personal analytics. It does not
include feeds, leaderboards, segments, races, clubs, challenges, comparisons, or
other athletes' data. It also does not send Strava API data to any AI model
automatically; export tools are manual and summarize personal activity data.
