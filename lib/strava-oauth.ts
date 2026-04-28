import "server-only";

import {
  deleteTokenState,
  getTokenStorageMetadata,
  readTokenState,
  writeTokenState,
} from "@/lib/secure-token-storage";
import type { AthleteProfile } from "@/lib/types";

export type StoredStravaTokens = {
  tokenType: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
  athlete: AthleteProfile | null;
  updatedAt: string;
};

type StravaTokenResponse = {
  token_type: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  scope?: string;
  athlete?: AthleteProfile;
};

const STRAVA_OAUTH_ENDPOINT = "https://www.strava.com/api/v3/oauth/token";

export function getStravaOAuthConfig() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return {
    clientId: process.env.STRAVA_CLIENT_ID ?? "",
    clientSecret: process.env.STRAVA_CLIENT_SECRET ?? "",
    redirectUri:
      process.env.STRAVA_REDIRECT_URI ??
      `${appUrl}/api/auth/strava/callback`,
  };
}

export function hasStravaOAuthConfig() {
  const config = getStravaOAuthConfig();
  return Boolean(config.clientId && config.clientSecret && config.redirectUri);
}

function mapTokenResponse(response: StravaTokenResponse): StoredStravaTokens {
  return {
    tokenType: response.token_type,
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    expiresAt: response.expires_at,
    scope: response.scope ?? "",
    athlete: response.athlete ?? null,
    updatedAt: new Date().toISOString(),
  };
}

async function persistTokens(tokens: StoredStravaTokens) {
  await writeTokenState(tokens);
}

async function postTokenRequest(body: URLSearchParams) {
  const response = await fetch(STRAVA_OAUTH_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  const payload = await response.text();

  if (!response.ok) {
    throw new Error(
      `Strava OAuth failed with ${response.status}: ${payload.slice(0, 240)}`,
    );
  }

  return JSON.parse(payload) as StravaTokenResponse;
}

export async function exchangeCodeForTokens(code: string) {
  const config = getStravaOAuthConfig();

  if (!hasStravaOAuthConfig()) {
    throw new Error(
      "Missing STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, or redirect URI.",
    );
  }

  const tokens = mapTokenResponse(
    await postTokenRequest(
      new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: "authorization_code",
      }),
    ),
  );

  await persistTokens(tokens);
  return tokens;
}

export async function readStoredStravaTokens() {
  return readTokenState<StoredStravaTokens>();
}

export async function refreshStoredStravaTokens(tokens: StoredStravaTokens) {
  const config = getStravaOAuthConfig();

  if (!hasStravaOAuthConfig()) {
    throw new Error(
      "Missing STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, or redirect URI.",
    );
  }

  const refreshedTokens = mapTokenResponse(
    await postTokenRequest(
      new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: "refresh_token",
        refresh_token: tokens.refreshToken,
      }),
    ),
  );

  await persistTokens(refreshedTokens);
  return refreshedTokens;
}

export async function getValidStoredAccessToken() {
  const tokens = await readStoredStravaTokens();

  if (!tokens) {
    return "";
  }

  const expiresInSeconds = tokens.expiresAt - Math.floor(Date.now() / 1000);

  if (expiresInSeconds > 300) {
    return tokens.accessToken;
  }

  return (await refreshStoredStravaTokens(tokens)).accessToken;
}

export async function clearStoredStravaTokens() {
  await deleteTokenState();
}

export async function getStravaConnectionStatus() {
  const tokens = await readStoredStravaTokens();

  return {
    hasOAuthConfig: hasStravaOAuthConfig(),
    hasStoredTokens: Boolean(tokens),
    hasEnvAccessToken: Boolean(process.env.STRAVA_ACCESS_TOKEN),
    tokenStorage: getTokenStorageMetadata(),
    athlete: tokens?.athlete ?? null,
    scope: tokens?.scope ?? "",
    expiresAt: tokens?.expiresAt ?? null,
  };
}
