"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Crosshair, Layers, Map, Route, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { decodeRoute, demoRoute } from "@/lib/run-map";
import { formatFeet, formatMiles, getPaceSecondsPerMile, metersToFeet, metersToMiles, secondsToDuration, secondsToPace } from "@/lib/analytics";
import type { ActivitySummary, RunMapPage } from "@/lib/types";
import { cn } from "@/lib/utils";

const RunMapCanvas = dynamic(() => import("@/components/run-map-canvas"), { ssr: false, loading: () => <div className="absolute inset-0 grid place-items-center text-muted-foreground">Preparing map…</div> });
const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export function RunAtlas() {
  const [activities, setActivities] = useState<ActivitySummary[]>([]);
  const [source, setSource] = useState<"strava" | "mock" | null>(null);
  const [loading, setLoading] = useState(true);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const nextPage = useRef<number | null>(1);
  const snapshot = useRef<number | null>(null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [year, setYear] = useState("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [satellite, setSatellite] = useState(false);
  const [viewRequest, setViewRequest] = useState(0);
  const [listLimit, setListLimit] = useState(60);
  const mapSection = useRef<HTMLElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    snapshot.current ??= Math.floor(Date.now() / 1000);
    async function load() {
      try {
        while (nextPage.current !== null && !controller.signal.aborted) {
          const response = await fetch(`/api/map/activities?page=${nextPage.current}&before=${snapshot.current}`, { signal: controller.signal, cache: "no-store" });
          const body = await response.json();
          if (!response.ok) throw new Error(body.error || "Unable to load running history.");
          if (controller.signal.aborted) return;
          const batch = body as RunMapPage;
          setSource(batch.source);
          setActivities((current) => {
            const byId = new globalThis.Map(current.map((activity) => [activity.id, activity]));
            for (const activity of batch.activities) byId.set(activity.id, activity);
            return [...byId.values()].sort((a, b) => b.startDate.localeCompare(a.startDate));
          });
          nextPage.current = batch.nextPage;
        }
        if (!controller.signal.aborted) { setComplete(true); setLoading(false); }
      } catch (error) {
        if (!controller.signal.aborted) { setError(error instanceof Error ? error.message : "Unable to load history."); setLoading(false); }
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt]);

  const runs = useMemo(() => activities.map((activity, index) => ({ ...activity, coordinates: source === "mock" ? demoRoute(index) : decodeRoute(activity.summaryPolyline) })), [activities, source]);
  const years = useMemo(() => [...new Set(activities.map((activity) => activity.startDate.slice(0, 4)))].sort().reverse(), [activities]);
  const filtered = useMemo(() => runs.filter((run) => (year === "all" || run.startDate.startsWith(year)) && run.name.toLowerCase().includes(deferredQuery.toLowerCase())), [runs, year, deferredQuery]);
  const routes = useMemo(() => filtered.filter((run) => run.coordinates.length > 1).map(({ id, coordinates }) => ({ id, coordinates })), [filtered]);
  const selected = filtered.find((run) => run.id === selectedId);
  const miles = filtered.reduce((total, run) => total + metersToMiles(run.distanceMeters), 0);
  const select = useCallback((id: number) => {
    setSelectedId(id);
    setViewRequest((value) => value + 1);
    if (window.matchMedia("(max-width: 1023px)").matches) {
      mapSection.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    }
  }, []);
  function resetView() { setSelectedId(null); setViewRequest((value) => value + 1); }

  return <div className="flex min-h-dvh flex-col">
    <header className="flex flex-wrap items-end justify-between gap-5 border-b px-4 py-6 sm:px-6 lg:px-8">
      <div><p className="font-mono text-xs uppercase tracking-[.2em] text-primary">Your miles, mapped</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Run atlas<span className="text-primary">.</span></h1><p className="mt-2 text-sm text-muted-foreground">A little perspective on everywhere you’ve been.</p></div>
      <div className="flex gap-6 text-right"><div><p className="font-mono text-2xl tabular-nums">{filtered.length.toLocaleString()}</p><p className="text-xs text-muted-foreground">{complete ? "runs" : "runs loaded"}</p></div><div><p className="font-mono text-2xl tabular-nums text-primary">{miles.toLocaleString("en-US", { maximumFractionDigits: 1 })}</p><p className="text-xs text-muted-foreground">miles on foot</p></div></div>
    </header>
    <div className="flex items-center justify-between gap-3 border-b bg-card px-4 py-2.5 text-xs sm:px-6 lg:px-8" role="status">
      <span className="flex items-center gap-2"><span className={cn("size-1.5 rounded-full", source === "strava" ? "bg-emerald-400" : "bg-primary")} />{source === "mock" ? "Demo mode · Sample runs with illustrative routes" : loading ? `Loading your history · ${activities.length} runs so far` : error ? "History incomplete · Loaded runs are still available" : "All available Strava runs loaded"}</span>
      {source === "mock" ? <Link href="/settings" className="shrink-0 text-primary underline-offset-4 hover:underline">Connect Strava ↗</Link> : null}
    </div>
    {error ? <div role="alert" className="flex flex-wrap items-center gap-3 border-b bg-amber-500/10 px-6 py-3 text-sm text-amber-100">{error}<Button size="sm" variant="outline" onClick={() => { setError(""); setLoading(true); setAttempt((value) => value + 1); }}>Continue loading</Button></div> : null}
    <div className="grid flex-1 lg:h-[calc(100dvh-178px)] lg:min-h-[500px] lg:flex-none lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="order-2 flex min-h-0 flex-col border-t bg-sidebar lg:order-1 lg:border-t-0 lg:border-r" aria-label="Run browser">
        <div className="space-y-3 border-b p-4">
          <div className="relative"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><Input aria-label="Search runs" placeholder="Find a run…" value={query} onChange={(event) => { setQuery(event.target.value); setSelectedId(null); setListLimit(60); }} className="h-10 pl-9" /></div>
          <div className="flex items-center justify-between gap-2"><label htmlFor="run-year" className="text-xs text-muted-foreground">Explore history</label><select id="run-year" value={year} onChange={(event) => { setYear(event.target.value); setSelectedId(null); setListLimit(60); }} className="rounded-md border bg-background px-3 py-2 text-xs"><option value="all">All time</option>{years.map((value) => <option key={value}>{value}</option>)}</select></div>
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-xs text-muted-foreground"><span>{filtered.length} runs · newest first</span><span>{routes.length} with GPS</span></div>
        <div className="max-h-[440px] min-h-0 flex-1 overflow-y-auto lg:max-h-none">
          {filtered.slice(0, listLimit).map((run) => <button key={run.id} type="button" aria-pressed={selected?.id === run.id} onClick={() => select(run.id)} className={cn("group flex w-full gap-3 border-l-2 border-transparent px-4 py-4 text-left transition-colors hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2", selected?.id === run.id && "border-primary bg-primary/[0.07]")}>
            <span className={cn("mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border text-muted-foreground", selected?.id === run.id && "border-primary/30 text-primary")}><Route className="size-4" /></span>
            <span className="min-w-0 flex-1"><span className="block text-[11px] text-muted-foreground">{dateFormat.format(new Date(run.startDate))}</span><span className="mt-1 block truncate text-sm font-medium">{run.name}</span><span className="mt-2 flex gap-3 font-mono text-xs"><span>{formatMiles(metersToMiles(run.distanceMeters))}</span><span className="text-muted-foreground">{secondsToPace(getPaceSecondsPerMile(run))}</span></span>{!run.coordinates.length ? <span className="mt-1 block text-[11px] text-muted-foreground">No GPS route</span> : null}</span>
            <ArrowUpRight className={cn("mt-1 size-3.5 shrink-0 text-muted-foreground", selected?.id === run.id && "text-primary")} />
          </button>)}
          {!filtered.length ? <div className="px-6 py-12 text-center text-sm text-muted-foreground">{loading ? "Finding your runs…" : activities.length ? "No runs match these filters." : "No runs yet. Your running history will appear here."}</div> : null}
          {filtered.length > listLimit ? <div className="p-4"><Button variant="outline" className="w-full" onClick={() => setListLimit((limit) => limit + 60)}>Show more runs</Button></div> : null}
        </div>
        <div className="mt-auto border-t p-4 text-xs leading-relaxed text-muted-foreground">Select a run here or click a route on the map.{filtered.length > routes.length ? ` ${filtered.length - routes.length} runs have no available GPS route.` : " Overlapping lines reveal your favorite ground."}</div>
      </aside>
      <section ref={mapSection} className="relative order-1 min-h-[540px] scroll-mt-14 overflow-hidden bg-[#10140f] sm:min-h-[640px] lg:order-2 lg:min-h-0" aria-label="Run map">
        <RunMapCanvas key={satellite ? "satellite" : "dark"} routes={routes} selectedId={selected?.id ?? null} onSelect={select} viewRequest={viewRequest} satellite={satellite} />
        <div className="absolute left-4 top-4 z-20 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="bg-background/90 shadow-lg backdrop-blur" onClick={resetView}><Crosshair className="size-4" /> All routes</Button>
          <Button size="sm" variant="outline" aria-pressed={satellite} className="bg-background/90 shadow-lg backdrop-blur" onClick={() => setSatellite((value) => !value)}><Layers className="size-4" /> {satellite ? "Dark map" : "Satellite"}</Button>
        </div>
        {selected ? <div className="absolute bottom-10 left-4 right-4 z-20 rounded-xl border border-white/15 bg-background/95 p-5 shadow-2xl backdrop-blur sm:left-5 sm:right-auto sm:w-[min(460px,calc(100%-40px))]" aria-live="polite">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#4fe3c1]">{dateFormat.format(new Date(selected.startDate))} · {source === "mock" ? "Sample run" : "Run"}</p><h2 className="mt-1.5 text-lg font-semibold">{selected.name}</h2></div><Button variant="ghost" size="icon" onClick={resetView} aria-label="Close selected run"><X className="size-4" /></Button></div>
          <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">{[
            ["Distance", formatMiles(metersToMiles(selected.distanceMeters))], ["Moving time", secondsToDuration(selected.movingTimeSeconds)], ["Avg. pace", secondsToPace(getPaceSecondsPerMile(selected))], ["Elevation", formatFeet(metersToFeet(selected.totalElevationGainMeters))],
          ].map(([label, value]) => <div key={label}><dt className="text-[10px] text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-nowrap font-mono text-sm">{value}</dd></div>)}</dl>
          {!selected.coordinates.length ? <p className="mt-4 text-xs text-amber-200">No GPS route is available for this run. Indoor or hidden routes can still have activity stats.</p> : <div className="mt-4 flex gap-4 text-[10px] text-muted-foreground"><span><span className="mr-1.5 inline-block size-1.5 rounded-full bg-primary" />Start</span><span><span className="mr-1.5 inline-block size-1.5 rounded-full bg-[#4fe3c1]" />Finish</span><span>{source === "mock" ? "Illustrative route" : "Strava summary route"}</span></div>}
          {source === "strava" ? <a href={`https://www.strava.com/activities/${selected.id}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-xs text-primary hover:underline">View on Strava <ArrowUpRight className="size-3" /></a> : null}
        </div> : <div className="pointer-events-none absolute bottom-10 left-4 right-4 flex justify-between gap-3 text-[11px] sm:left-5"><span className="rounded-full border border-white/10 bg-background/85 px-3 py-2 backdrop-blur"><span className="mr-2 inline-block h-0.5 w-4 align-middle bg-primary" />{routes.length} routes{source === "mock" ? " · illustrative" : ""}</span><span className="hidden items-center gap-2 rounded-full bg-background/85 px-3 py-2 text-muted-foreground sm:flex"><Map className="size-3" /> Pick a run. Go somewhere.</span></div>}
      </section>
    </div>
  </div>;
}
