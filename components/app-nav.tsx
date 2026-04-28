"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, Download, Menu, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/activities", label: "Activities", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppNav() {
  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-sidebar/80 p-4 lg:block">
        <div className="flex h-full flex-col gap-8">
          <Link href="/" className="flex items-center gap-3 rounded-lg px-2 py-1">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground metric-glow">
              <Download className="size-4 rotate-180" />
            </span>
            <span>
              <span className="text-base font-semibold tracking-tight">Pulse Vault</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                Private analytics
              </span>
            </span>
          </Link>
          <NavLinks />
          <div className="mt-auto rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-muted-foreground">
            Single-athlete view. No feeds, rankings, or public comparisons.
          </div>
        </div>
      </aside>

      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-background/90 p-3 backdrop-blur lg:hidden">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Download className="size-4 rotate-180" />
          </span>
          Pulse Vault
        </Link>
        <Sheet>
          <SheetTrigger render={<Button variant="outline" size="icon" />}>
            <Menu className="size-4" />
            <span className="sr-only">Open navigation</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 border-white/10 bg-sidebar">
            <SheetHeader>
              <SheetTitle>Pulse Vault</SheetTitle>
            </SheetHeader>
            <div className="px-4">
              <NavLinks />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
