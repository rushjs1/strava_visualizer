export type ActivityType = "Run" | "Ride" | "Walk" | "Hike" | "Workout" | "Other";

export type AthleteProfile = {
  id: number;
  firstname?: string;
  lastname?: string;
  city?: string;
  country?: string;
  profile?: string;
};

export type ActivitySummary = {
  id: number;
  name: string;
  type: ActivityType;
  startDate: string;
  distanceMeters: number;
  movingTimeSeconds: number;
  elapsedTimeSeconds: number;
  averageSpeedMetersPerSecond: number | null;
  totalElevationGainMeters: number;
  description?: string | null;
};

export type PersonalDataResult = {
  athlete: AthleteProfile | null;
  activities: ActivitySummary[];
  source: "strava" | "mock";
  error?: string;
};

export type DashboardMetrics = {
  totalDistanceThisYearMiles: number;
  totalRuns: number;
  weeklyMileageMiles: number;
  averagePaceSecondsPerMile: number | null;
  longestRecentRunMiles: number;
  elevationGainThisYearFeet: number;
};

export type WeeklyMileagePoint = {
  week: string;
  miles: number;
};

export type MonthlyDistancePoint = {
  month: string;
  miles: number;
};

export type PacePoint = {
  date: string;
  pace: number;
  name: string;
};

export type ActivityTypePoint = {
  type: ActivityType;
  count: number;
  miles: number;
};

export type ExportRow = {
  id: number;
  name: string;
  date: string;
  type: ActivityType;
  distanceMiles: number;
  movingTimeMinutes: number;
  paceMinutesPerMile: number | null;
  elevationFeet: number;
};
