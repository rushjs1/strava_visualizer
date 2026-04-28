import { AlertCircle, Database, ShieldCheck } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { PersonalDataResult } from "@/lib/types";

export function StatusAlert({ data }: { data: PersonalDataResult }) {
  if (data.error) {
    return (
      <Alert className="rounded-lg border-amber-400/30 bg-amber-400/10 text-amber-100">
        <AlertCircle className="size-4" />
        <AlertTitle>Using mock data fallback</AlertTitle>
        <AlertDescription>
          Strava could not be reached: {data.error}. The UI is still available with sample
          personal activity data.
        </AlertDescription>
      </Alert>
    );
  }

  if (data.source === "mock") {
    return (
      <Alert className="rounded-lg border-primary/25 bg-primary/10 text-foreground">
        <Database className="size-4 text-primary" />
        <AlertTitle>Mock data active</AlertTitle>
        <AlertDescription>
          Add `STRAVA_ACCESS_TOKEN` to your environment to fetch your private Strava
          activities server-side.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="rounded-lg border-emerald-400/25 bg-emerald-400/10 text-foreground">
      <ShieldCheck className="size-4 text-emerald-300" />
      <AlertTitle>Private Strava data loaded</AlertTitle>
      <AlertDescription>
        Displaying activities for the authenticated token owner only.
      </AlertDescription>
    </Alert>
  );
}
