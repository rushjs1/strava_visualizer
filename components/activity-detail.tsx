"use client";

import { CalendarDays, Clock, Mountain, NotebookText, Route, Zap } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  formatFeet,
  formatMiles,
  getPaceSecondsPerMile,
  metersToFeet,
  metersToMiles,
  secondsToDuration,
  secondsToPace,
} from "@/lib/analytics";
import type { ActivitySummary } from "@/lib/types";

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Route;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-mono text-base tabular-nums text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function ActivityDetailSheet({
  activity,
  onOpenChange,
}: {
  activity: ActivitySummary | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={Boolean(activity)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full border-white/10 bg-popover sm:max-w-xl">
        {activity ? (
          <>
            <SheetHeader className="border-b border-white/10 p-5">
              <SheetTitle className="pr-8 text-xl tracking-tight">{activity.name}</SheetTitle>
              <SheetDescription>
                {activity.type} on{" "}
                {new Date(activity.startDate).toLocaleDateString("en", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-3 overflow-y-auto p-5 sm:grid-cols-2">
              <DetailRow
                icon={Route}
                label="Distance"
                value={formatMiles(metersToMiles(activity.distanceMeters), 2)}
              />
              <DetailRow
                icon={Zap}
                label="Average pace"
                value={secondsToPace(getPaceSecondsPerMile(activity))}
              />
              <DetailRow
                icon={Clock}
                label="Moving time"
                value={secondsToDuration(activity.movingTimeSeconds)}
              />
              <DetailRow
                icon={Mountain}
                label="Elevation"
                value={formatFeet(metersToFeet(activity.totalElevationGainMeters))}
              />
              <DetailRow
                icon={CalendarDays}
                label="Start date"
                value={new Date(activity.startDate).toLocaleString("en", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              />
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 sm:col-span-2">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <NotebookText className="size-4" />
                  </span>
                  <p className="text-sm">Notes</p>
                </div>
                <p className="mt-3 text-base text-pretty">
                  {activity.description || "No notes or description were provided for this activity."}
                </p>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
