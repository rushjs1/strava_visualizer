"use client";

import { Download, FileJson, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildExportRows, exportRowsToCsv } from "@/lib/analytics";
import type { ActivitySummary } from "@/lib/types";

function downloadText(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ExportPanel({ activities }: { activities: ActivitySummary[] }) {
  const rows = buildExportRows(activities);

  return (
    <Card className="rounded-lg border border-white/10 bg-card/90 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" />
          Manual export tools
        </CardTitle>
        <CardDescription>
          Exports are scoped to summarized personal activity data for your own review.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          onClick={() =>
            downloadText(
              "personal-strava-summary.json",
              JSON.stringify(rows, null, 2),
              "application/json",
            )
          }
        >
          <FileJson className="size-4" />
          Export JSON
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            downloadText("personal-strava-summary.csv", exportRowsToCsv(rows), "text/csv")
          }
        >
          <Download className="size-4" />
          Export CSV
        </Button>
      </CardContent>
    </Card>
  );
}
