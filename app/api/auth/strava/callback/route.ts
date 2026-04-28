import { NextRequest, NextResponse } from "next/server";

import { exchangeCodeForTokens } from "@/lib/strava-oauth";

function settingsRedirect(request: NextRequest, search: string) {
  return new URL(`/settings${search}`, request.url);
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const expectedState = request.cookies.get("strava_oauth_state")?.value;

  if (error) {
    return NextResponse.redirect(
      settingsRedirect(request, `?auth_error=${encodeURIComponent(error)}`),
    );
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(settingsRedirect(request, "?auth_error=invalid_state"));
  }

  try {
    await exchangeCodeForTokens(code);
    const response = NextResponse.redirect(settingsRedirect(request, "?connected=1"));
    response.cookies.delete("strava_oauth_state");
    return response;
  } catch (oauthError) {
    return NextResponse.redirect(
      settingsRedirect(
        request,
        `?auth_error=${encodeURIComponent(
          oauthError instanceof Error ? oauthError.message : "OAuth exchange failed",
        )}`,
      ),
    );
  }
}
