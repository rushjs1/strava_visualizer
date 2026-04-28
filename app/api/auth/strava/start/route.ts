import { NextResponse } from "next/server";

import { getStravaOAuthConfig, hasStravaOAuthConfig } from "@/lib/strava-oauth";

export async function GET(request: Request) {
  if (!hasStravaOAuthConfig()) {
    return NextResponse.redirect(
      new URL("/settings?auth_error=missing_config", request.url),
    );
  }

  const state = crypto.randomUUID();
  const config = getStravaOAuthConfig();
  const authorizeUrl = new URL("https://www.strava.com/oauth/authorize");

  authorizeUrl.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    approval_prompt: "force",
    scope: "activity:read_all,profile:read_all",
    state,
  }).toString();

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set("strava_oauth_state", state, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
