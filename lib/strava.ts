import "server-only";

import { mockActivities, mockAthlete } from "@/lib/mock-data";
import { getValidStoredAccessToken } from "@/lib/strava-oauth";
import type {
  ActivitySummary,
  ActivityType,
  AthleteProfile,
  PersonalDataResult,
} from "@/lib/types";

type StravaSummaryActivity = {
  id: number;
  name: string;
  type?: string;
  sport_type?: string;
  start_date: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  average_speed?: number;
  total_elevation_gain?: number;
  description?: string | null;
};

type StravaAthlete = {
  id: number;
  firstname?: string;
  lastname?: string;
  city?: string;
  country?: string;
  profile?: string;
};

const STRAVA_API_BASE = "https://www.strava.com/api/v3";

async function getConfiguredAccessToken(accessToken?: string) {
  // OAuth token storage is server-side only. The access token is never passed
  // to client components, route props, exports, or browser-visible state.
  if (accessToken) {
    return accessToken;
  }

  try {
    const storedAccessToken = await getValidStoredAccessToken();

    if (storedAccessToken) {
      return storedAccessToken;
    }
  } catch (error) {
    if (!process.env.STRAVA_ACCESS_TOKEN) {
      throw error;
    }
  }

  return process.env.STRAVA_ACCESS_TOKEN ?? "";
}

function normalizeActivityType(type?: string): ActivityType {
  if (
    type === "Run" ||
    type === "Ride" ||
    type === "Walk" ||
    type === "Hike" ||
    type === "Workout"
  ) {
    return type;
  }

  return "Other";
}

function mapActivity(activity: StravaSummaryActivity): ActivitySummary {
  return {
    id: activity.id,
    name: activity.name,
    type: normalizeActivityType(activity.sport_type ?? activity.type),
    startDate: activity.start_date,
    distanceMeters: activity.distance,
    movingTimeSeconds: activity.moving_time,
    elapsedTimeSeconds: activity.elapsed_time,
    averageSpeedMetersPerSecond: activity.average_speed ?? null,
    totalElevationGainMeters: activity.total_elevation_gain ?? 0,
    description: activity.description ?? null,
  };
}

async function fetchStrava<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${STRAVA_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Strava ${path} failed with ${response.status}: ${body.slice(0, 240)}`,
    );
  }

  return response.json() as Promise<T>;
}

export async function fetchAthleteProfile(
  accessToken?: string,
): Promise<AthleteProfile | null> {
  const token = await getConfiguredAccessToken(accessToken);

  if (!token) {
    return null;
  }

  return fetchStrava<StravaAthlete>("/athlete", token);
}

export async function fetchActivities(
  accessToken?: string,
): Promise<ActivitySummary[]> {
  const token = await getConfiguredAccessToken(accessToken);

  if (!token) {
    return [];
  }

  const activities = await fetchStrava<StravaSummaryActivity[]>(
    "/athlete/activities?per_page=100",
    token,
  );
  return activities.map(mapActivity);
}

export async function getPersonalStravaData(): Promise<PersonalDataResult> {
  // Private personal analytics only: this utility fetches data for the single
  // authenticated token owner and does not request feeds, segments, clubs,
  // competitions, routes, leaderboards, or other athletes' data.
  try {
    const token = await getConfiguredAccessToken();

    if (!token) {
      return {
        athlete: mockAthlete,
        activities: mockActivities,
        source: "mock",
      };
    }

    const [athlete, activities] = await Promise.all([
      fetchAthleteProfile(token),
      fetchActivities(token),
    ]);

    return {
      athlete,
      activities,
      source: "strava",
    };
  } catch (error) {
    return {
      athlete: mockAthlete,
      activities: mockActivities,
      source: "mock",
      error:
        error instanceof Error ? error.message : "Unable to fetch Strava data.",
    };
  }
}
