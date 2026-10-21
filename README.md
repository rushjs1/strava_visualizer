# Strava Visualizer

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

## Compliance scope

This is for one authenticated user's private personal analytics. It does not
include feeds, leaderboards, segments, races, clubs, challenges, comparisons, or
other athletes' data. It also does not send Strava API data to any AI model
automatically; export tools are manual and summarize personal activity data.

## Run atlas

Open `/map` (Run atlas in the navigation) to explore running routes. Add a
**public** Mapbox token to `.env.local`, then restart the dev server:

```bash
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_public_token
```

The map supports all-time and year views, run-name search, dark/satellite maps,
clickable routes, and animated flights to a selected run with its stats. The
Mapbox token is intentionally browser-visible; never use a secret `sk.` token.
If your token has URL restrictions, allow your local development origin too.

On Netlify, set `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` in the site's environment
variables with the Builds scope for Production and Deploy Previews. Use the same
public `pk.` token, and trigger a new build after adding or changing it: Next.js
embeds public variables at build time. Allow the deployed site's URLs in Mapbox
if the token is URL-restricted. The local `.env.local` file is not committed.

Connect Strava in Settings using the OAuth setup above. For local development,
leave `STRAVA_TOKEN_STORAGE` unset (or set it to `local-file`); the Netlify storage
setting in `.env.example` is for deployment. Without a Strava connection the atlas
shows **labeled sample activities and illustrative routes**, not your actual GPS.

The atlas loads Strava history progressively in pages of 200 activities, including
trail and virtual runs. It keeps loaded data visible on errors and lets you resume
from the failed page. Reopening the page loads history again; it is not a persistent
sync. Existing dashboard/activities views still use the latest 100 activities.
Routes use Strava's summary polylines; indoor or hidden routes may have no GPS and
remain selectable for stats. The site must remain private, as with the existing
single-owner dashboard.

Validation: `pnpm test`, `pnpm lint`, and `pnpm build`. The geometry/pagination tests
use Node 22.6+ with TypeScript stripping. Development: `pnpm dev`.
