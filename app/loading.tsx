import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <AppShell>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-28 rounded-lg bg-white/[0.06]" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-36 rounded-lg bg-white/[0.06]" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg bg-white/[0.06]" />
      </div>
    </AppShell>
  );
}
