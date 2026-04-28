"use client";

import { AlertTriangle } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppShell>
      <div className="flex min-h-dvh items-center justify-center p-4">
        <div className="max-w-md rounded-lg border border-white/10 bg-card p-6 text-center">
          <AlertTriangle className="mx-auto size-8 text-primary" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Dashboard error</h1>
          <p className="mt-3 text-base text-muted-foreground">{error.message}</p>
          <Button type="button" className="mt-5" onClick={reset}>
            Try again
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
