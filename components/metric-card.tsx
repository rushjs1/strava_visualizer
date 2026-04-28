import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  accent?: boolean;
}) {
  return (
    <Card
      className={cn(
        "rounded-lg border border-white/10 bg-card/90 py-0 shadow-none",
        accent && "metric-glow border-primary/25 bg-[#14190d]",
      )}
    >
      <CardContent className="@container p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm text-muted-foreground">{label}</p>
            <p className="mt-3 font-mono text-3xl font-semibold tracking-tight tabular-nums text-foreground @[18rem]:text-4xl">
              {value}
            </p>
          </div>
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-muted-foreground",
              accent && "border-primary/30 bg-primary/10 text-primary",
            )}
          >
            <Icon className="size-4" />
          </span>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
