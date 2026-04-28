import { ExternalLink, KeyRound, LockKeyhole, Server, Unplug } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { ExportPanel } from "@/components/export-panel";
import { PageHeader } from "@/components/page-header";
import { StatusAlert } from "@/components/status-alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getStravaConnectionStatus } from "@/lib/strava-oauth";
import { getPersonalStravaData } from "@/lib/strava";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const data = await getPersonalStravaData();
  const status = await getStravaConnectionStatus();
  const connected = status.hasStoredTokens || status.hasEnvAccessToken;
  const athleteName = [status.athlete?.firstname, status.athlete?.lastname]
    .filter(Boolean)
    .join(" ");

  return (
    <AppShell>
      <PageHeader
        eyebrow="Private setup"
        title="Settings and exports"
        description="Connect your own Strava account, keep tokens server-side, and export summarized activity data manually."
      />
      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:p-8">
        <div className="space-y-6">
          <StatusAlert data={data} />
          <ExportPanel activities={data.activities} />
        </div>

        <div className="space-y-6">
          <Card className="rounded-lg border border-white/10 bg-card/90 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="size-4 text-primary" />
                Strava connection
              </CardTitle>
              <CardDescription>
                OAuth is used only to connect the single owner of this private dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <span className="text-sm text-muted-foreground">OAuth config</span>
                <Badge
                  variant={status.hasOAuthConfig ? "default" : "secondary"}
                  className="rounded-lg"
                >
                  {status.hasOAuthConfig ? "Ready" : "Missing env"}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <span className="text-sm text-muted-foreground">Connection</span>
                <Badge variant={connected ? "default" : "secondary"} className="rounded-lg">
                  {status.hasStoredTokens
                    ? "OAuth connected"
                    : status.hasEnvAccessToken
                      ? "Env token"
                      : "Mock fallback"}
                </Badge>
              </div>
              {athleteName ? (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-sm text-muted-foreground">Connected athlete</p>
                  <p className="mt-1 text-base font-medium">{athleteName}</p>
                </div>
              ) : null}
              {status.scope ? (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-sm text-muted-foreground">Granted scopes</p>
                  <p className="mt-1 font-mono text-sm text-foreground">{status.scope}</p>
                </div>
              ) : null}
              {status.expiresAt ? (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-sm text-muted-foreground">Access token expires</p>
                  <p className="mt-1 text-base">
                    {new Date(status.expiresAt * 1000).toLocaleString()}
                  </p>
                </div>
              ) : null}
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-sm text-muted-foreground">Token storage</p>
                <p className="mt-1 font-mono text-sm text-foreground">
                  {status.tokenStorage.mode}
                  {status.tokenStorage.encrypted ? " encrypted" : ""}
                </p>
              </div>
              <Separator className="bg-white/10" />
              <div className="space-y-3 text-base text-muted-foreground">
                <p>
                  Add <code>STRAVA_CLIENT_ID</code>, <code>STRAVA_CLIENT_SECRET</code>,
                  and <code>STRAVA_REDIRECT_URI</code> to{" "}
                  <code>.env.development.local</code>, then restart the dev server.
                </p>
                <p>
                  OAuth tokens are stored locally at <code>.data/strava-oauth.json</code>,
                  or encrypted in Netlify Blobs in production. Refresh happens
                  automatically on the server.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                {status.hasOAuthConfig ? (
                  <a
                    href="/api/auth/strava/start"
                    className={buttonVariants({ variant: "default" })}
                  >
                    <ExternalLink className="size-4" />
                    {status.hasStoredTokens ? "Reconnect Strava" : "Connect Strava"}
                  </a>
                ) : (
                  <span className={buttonVariants({ variant: "secondary" })}>
                    <ExternalLink className="size-4" />
                    Add env vars first
                  </span>
                )}
                {status.hasStoredTokens ? (
                  <form action="/api/auth/strava/disconnect" method="post">
                    <Button type="submit" variant="outline">
                      <Unplug className="size-4" />
                      Disconnect
                    </Button>
                  </form>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border border-white/10 bg-card/90 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LockKeyhole className="size-4 text-primary" />
                Compliance guardrails
              </CardTitle>
              <CardDescription>Built for a single private athlete view.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul role="list" className="space-y-3 text-base text-muted-foreground">
                <li>OAuth is scoped to one authenticated Strava user only.</li>
                <li>No social feeds, leaderboards, clubs, segments, competitions, or races.</li>
                <li>No other athletes or public comparison data is requested or displayed.</li>
                <li>No Strava API data is sent to an AI model automatically.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-lg border border-white/10 bg-card/90 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="size-4 text-primary" />
                Server-side only
              </CardTitle>
              <CardDescription>
                Strava calls stay inside server components and utilities.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-base text-muted-foreground">
              Client components receive summarized activity objects for display and manual
              export. The access token is never passed to the browser.
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
