"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Search } from "lucide-react";

import { ActivityDetailSheet } from "@/components/activity-detail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatFeet,
  formatMiles,
  getPaceSecondsPerMile,
  metersToFeet,
  metersToMiles,
  secondsToDuration,
  secondsToPace,
} from "@/lib/analytics";
import type { ActivitySummary, ActivityType } from "@/lib/types";

const typeFilters: Array<ActivityType | "All"> = ["All", "Run", "Ride", "Walk", "Hike", "Workout", "Other"];

export function ActivityTable({
  activities,
  compact = false,
}: {
  activities: ActivitySummary[];
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<ActivityType | "All">("All");
  const [selectedActivity, setSelectedActivity] = useState<ActivitySummary | null>(null);
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");

  const filteredActivities = useMemo(() => {
    return [...activities]
      .filter((activity) => (type === "All" ? true : activity.type === type))
      .filter((activity) => {
        const haystack = `${activity.name} ${activity.type}`.toLowerCase();
        return haystack.includes(query.toLowerCase());
      })
      .sort((a, b) => {
        const direction = sortDirection === "desc" ? -1 : 1;
        return (new Date(a.startDate).getTime() - new Date(b.startDate).getTime()) * direction;
      });
  }, [activities, query, sortDirection, type]);

  const visibleActivities = compact ? filteredActivities.slice(0, 7) : filteredActivities;

  return (
    <div className="space-y-4">
      {!compact ? (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search personal activities"
              className="h-10 rounded-lg border-white/10 bg-white/[0.04] pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {typeFilters.map((filter) => (
              <Button
                key={filter}
                type="button"
                variant={type === filter ? "default" : "outline"}
                size="sm"
                onClick={() => setType(filter)}
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="-mx-4 -my-2 overflow-x-auto whitespace-nowrap sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full px-4 py-2 align-middle sm:px-6 lg:px-8">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="whitespace-nowrap">Activity name</TableHead>
                <TableHead className="whitespace-nowrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-2"
                    onClick={() => setSortDirection(sortDirection === "desc" ? "asc" : "desc")}
                  >
                    Date
                    <ArrowUpDown className="size-3.5" />
                  </Button>
                </TableHead>
                <TableHead className="whitespace-nowrap text-right">Distance</TableHead>
                <TableHead className="whitespace-nowrap text-right">Moving time</TableHead>
                <TableHead className="whitespace-nowrap text-right">Average pace</TableHead>
                <TableHead className="whitespace-nowrap text-right">Elevation gain</TableHead>
                <TableHead className="whitespace-nowrap">Activity type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleActivities.length ? (
                visibleActivities.map((activity) => (
                  <TableRow
                    key={activity.id}
                    className="cursor-pointer border-white/10 hover:bg-white/[0.04]"
                    onClick={() => setSelectedActivity(activity)}
                  >
                    <TableCell className="font-medium text-foreground">{activity.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(activity.startDate).toLocaleDateString("en", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatMiles(metersToMiles(activity.distanceMeters), 2)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {secondsToDuration(activity.movingTimeSeconds)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {secondsToPace(getPaceSecondsPerMile(activity))}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatFeet(metersToFeet(activity.totalElevationGainMeters))}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={activity.type === "Run" ? "default" : "secondary"}
                        className="rounded-lg"
                      >
                        {activity.type}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="border-white/10">
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No personal activities match this view.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ActivityDetailSheet
        activity={selectedActivity}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedActivity(null);
          }
        }}
      />
    </div>
  );
}
