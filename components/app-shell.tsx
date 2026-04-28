import type { ReactNode } from "react";

import { AppNav } from "@/components/app-nav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="isolate flex min-h-dvh flex-col bg-background text-foreground lg:flex-row">
      <AppNav />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
