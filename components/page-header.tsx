import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-white/10 px-4 py-6 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
      <div className="max-w-[72ch]">
        {eyebrow ? (
          <p className="font-mono text-sm uppercase tracking-wide text-primary">{eyebrow}</p>
        ) : null}
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-base text-muted-foreground text-pretty">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
