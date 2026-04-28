import {
  Activity,
  Footprints,
  Gauge,
  Mountain,
  Route,
  TrendingUp,
} from "lucide-react";

import { ActivityTable } from "@/components/activity-table";
import { AppShell } from "@/components/app-shell";
import { DashboardCharts } from "@/components/dashboard-charts";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusAlert } from "@/components/status-alert";
import {
  buildActivityTypeBreakdown,
  buildMonthlyDistanceTrend,
  buildPaceTrend,
  buildWeeklyMileageTrend,
  computeDashboardMetrics,
  formatFeet,
  formatMiles,
  secondsToPace,
} from "@/lib/analytics";
import { getPersonalStravaData } from "@/lib/strava";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getPersonalStravaData();
  const metrics = computeDashboardMetrics(data.activities);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Private personal analytics"
        title="Your training signal, cleaned up and charged."
        description="A dark, single-athlete dashboard for reviewing your own Strava activity data. No feeds, competitions, clubs, leaderboards, segments, or other athletes."
      />
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <StatusAlert data={data} />

        <section className="grid gap-3 @container sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            label="Total distance this year"
            value={formatMiles(metrics.totalDistanceThisYearMiles)}
            detail="All personal activity types"
            icon={Route}
            accent
          />
          <MetricCard
            label="Total runs"
            value={metrics.totalRuns.toLocaleString()}
            detail="Runs only, year to date"
            icon={Footprints}
          />
          <MetricCard
            label="Weekly mileage"
            value={formatMiles(metrics.weeklyMileageMiles)}
            detail="Rolling 7-day personal volume"
            icon={TrendingUp}
          />
          <MetricCard
            label="Average pace"
            value={secondsToPace(metrics.averagePaceSecondsPerMile)}
            detail="Weighted by distance for runs"
            icon={Gauge}
          />
          <MetricCard
            label="Longest recent run"
            value={formatMiles(metrics.longestRecentRunMiles)}
            detail="Longest run in the past 90 days"
            icon={Activity}
          />
          <MetricCard
            label="Elevation gain"
            value={formatFeet(metrics.elevationGainThisYearFeet)}
            detail="Year-to-date climbing"
            icon={Mountain}
          />
        </section>

        <DashboardCharts
          weeklyMileage={buildWeeklyMileageTrend(data.activities)}
          monthlyDistance={buildMonthlyDistanceTrend(data.activities)}
          paceTrend={buildPaceTrend(data.activities)}
          typeBreakdown={buildActivityTypeBreakdown(data.activities)}
        />

        <section className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Recent activities
            </h2>
            <p className="mt-1 text-base text-muted-foreground">
              Click an activity to inspect the private detail view.
            </p>
          </div>
          <ActivityTable activities={data.activities} compact />
        </section>
      </div>
    </AppShell>
  );
}
