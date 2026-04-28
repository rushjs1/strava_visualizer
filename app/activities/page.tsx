import { ActivityTable } from "@/components/activity-table";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusAlert } from "@/components/status-alert";
import { getPersonalStravaData } from "@/lib/strava";

export const dynamic = "force-dynamic";

export default async function ActivitiesPage() {
  const data = await getPersonalStravaData();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Personal log"
        title="Activities"
        description="Filter and inspect only the activities belonging to the authenticated Strava token owner."
      />
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <StatusAlert data={data} />
        <ActivityTable activities={data.activities} />
      </div>
    </AppShell>
  );
}
