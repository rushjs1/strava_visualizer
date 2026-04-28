import { NextRequest, NextResponse } from "next/server";

import { clearStoredStravaTokens } from "@/lib/strava-oauth";

export async function POST(request: NextRequest) {
  await clearStoredStravaTokens();
  return NextResponse.redirect(new URL("/settings?disconnected=1", request.url));
}
