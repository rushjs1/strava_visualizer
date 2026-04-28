import type {
  ActivitySummary,
  ActivityType,
  ActivityTypePoint,
  DashboardMetrics,
  ExportRow,
  MonthlyDistancePoint,
  PacePoint,
  WeeklyMileagePoint,
} from "@/lib/types";

const METERS_PER_MILE = 1609.344;
const FEET_PER_METER = 3.28084;

export function metersToMiles(meters: number) {
  return meters / METERS_PER_MILE;
}

export function metersToFeet(meters: number) {
  return meters * FEET_PER_METER;
}

export function secondsToPace(seconds: number | null) {
  if (!seconds || !Number.isFinite(seconds)) {
    return "--";
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${remainder}/mi`;
}

export function secondsToDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  }

  return `${minutes}m ${secs.toString().padStart(2, "0")}s`;
}

export function formatMiles(miles: number, digits = 1) {
  return `${miles.toFixed(digits)} mi`;
}

export function formatFeet(feet: number) {
  return `${Math.round(feet).toLocaleString()} ft`;
}

export function getPaceSecondsPerMile(activity: ActivitySummary) {
  const miles = metersToMiles(activity.distanceMeters);

  if (miles <= 0 || activity.type !== "Run") {
    return null;
  }

  return activity.movingTimeSeconds / miles;
}

export function getSortedActivities(activities: ActivitySummary[]) {
  return [...activities].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );
}

export function computeDashboardMetrics(
  activities: ActivitySummary[],
  now = new Date(),
): DashboardMetrics {
  const year = now.getFullYear();
  const rollingWeekStart = new Date(now);
  rollingWeekStart.setDate(now.getDate() - 6);

  const thisYear = activities.filter(
    (activity) => new Date(activity.startDate).getFullYear() === year,
  );
  const runsThisYear = thisYear.filter((activity) => activity.type === "Run");
  const recentRuns = activities.filter((activity) => {
    const start = new Date(activity.startDate);
    const daysAgo = (now.getTime() - start.getTime()) / 86_400_000;
    return activity.type === "Run" && daysAgo >= 0 && daysAgo <= 90;
  });

  const weightedPace =
    runsThisYear.reduce(
      (total, activity) => total + activity.movingTimeSeconds,
      0,
    ) /
    Math.max(
      runsThisYear.reduce(
        (total, activity) => total + metersToMiles(activity.distanceMeters),
        0,
      ),
      1,
    );

  return {
    totalDistanceThisYearMiles: thisYear.reduce(
      (total, activity) => total + metersToMiles(activity.distanceMeters),
      0,
    ),
    totalRuns: runsThisYear.length,
    weeklyMileageMiles: activities
      .filter((activity) => new Date(activity.startDate) >= rollingWeekStart)
      .reduce((total, activity) => total + metersToMiles(activity.distanceMeters), 0),
    averagePaceSecondsPerMile: runsThisYear.length ? weightedPace : null,
    longestRecentRunMiles: Math.max(
      0,
      ...recentRuns.map((activity) => metersToMiles(activity.distanceMeters)),
    ),
    elevationGainThisYearFeet: thisYear.reduce(
      (total, activity) => total + metersToFeet(activity.totalElevationGainMeters),
      0,
    ),
  };
}

export function buildWeeklyMileageTrend(
  activities: ActivitySummary[],
  now = new Date(),
): WeeklyMileagePoint[] {
  return Array.from({ length: 10 }, (_, index) => {
    const end = new Date(now);
    end.setDate(now.getDate() - (9 - index) * 7);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);

    const miles = activities
      .filter((activity) => {
        const date = new Date(activity.startDate);
        return date >= start && date <= end;
      })
      .reduce((total, activity) => total + metersToMiles(activity.distanceMeters), 0);

    return {
      week: `${start.getMonth() + 1}/${start.getDate()}`,
      miles: Number(miles.toFixed(1)),
    };
  });
}

export function buildMonthlyDistanceTrend(
  activities: ActivitySummary[],
  now = new Date(),
): MonthlyDistancePoint[] {
  const year = now.getFullYear();

  return Array.from({ length: 12 }, (_, month) => {
    const miles = activities
      .filter((activity) => {
        const date = new Date(activity.startDate);
        return date.getFullYear() === year && date.getMonth() === month;
      })
      .reduce((total, activity) => total + metersToMiles(activity.distanceMeters), 0);

    return {
      month: new Date(year, month, 1).toLocaleString("en", { month: "short" }),
      miles: Number(miles.toFixed(1)),
    };
  });
}

export function buildPaceTrend(activities: ActivitySummary[]): PacePoint[] {
  return getSortedActivities(activities)
    .filter((activity) => activity.type === "Run")
    .slice(0, 12)
    .reverse()
    .map((activity) => ({
      date: new Date(activity.startDate).toLocaleDateString("en", {
        month: "short",
        day: "numeric",
      }),
      pace: Number(((getPaceSecondsPerMile(activity) ?? 0) / 60).toFixed(2)),
      name: activity.name,
    }));
}

export function buildActivityTypeBreakdown(
  activities: ActivitySummary[],
): ActivityTypePoint[] {
  const byType = new Map<ActivityType, ActivityTypePoint>();

  for (const activity of activities) {
    const existing =
      byType.get(activity.type) ??
      ({ type: activity.type, count: 0, miles: 0 } satisfies ActivityTypePoint);

    existing.count += 1;
    existing.miles += metersToMiles(activity.distanceMeters);
    byType.set(activity.type, existing);
  }

  return [...byType.values()].map((point) => ({
    ...point,
    miles: Number(point.miles.toFixed(1)),
  }));
}

export function buildExportRows(activities: ActivitySummary[]): ExportRow[] {
  // Export rows intentionally contain only summarized personal activity data.
  // This app never sends Strava API data to an AI model automatically.
  return getSortedActivities(activities).map((activity) => ({
    id: activity.id,
    name: activity.name,
    date: activity.startDate,
    type: activity.type,
    distanceMiles: Number(metersToMiles(activity.distanceMeters).toFixed(2)),
    movingTimeMinutes: Number((activity.movingTimeSeconds / 60).toFixed(1)),
    paceMinutesPerMile:
      activity.type === "Run"
        ? Number(((getPaceSecondsPerMile(activity) ?? 0) / 60).toFixed(2))
        : null,
    elevationFeet: Math.round(metersToFeet(activity.totalElevationGainMeters)),
  }));
}

export function exportRowsToCsv(rows: ExportRow[]) {
  const headers = [
    "id",
    "name",
    "date",
    "type",
    "distanceMiles",
    "movingTimeMinutes",
    "paceMinutesPerMile",
    "elevationFeet",
  ];

  const escapeValue = (value: string | number | null) => {
    if (value === null) {
      return "";
    }

    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };

  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeValue(row[header as keyof ExportRow])).join(",")),
  ].join("\n");
}
