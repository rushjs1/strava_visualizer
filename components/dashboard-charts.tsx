"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  ActivityTypePoint,
  MonthlyDistancePoint,
  PacePoint,
  WeeklyMileagePoint,
} from "@/lib/types";

const chartColors = ["#cefb09", "#4fe3c1", "#8b7cf6", "#f2a65a", "#f85f93"];

function ChartShell({
  title,
  description,
  children,
  empty,
}: {
  title: string;
  description: string;
  children: ReactNode;
  empty?: boolean;
}) {
  return (
    <Card className="rounded-lg border border-white/10 bg-card/90 shadow-none">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {empty ? (
          <div className="flex h-80 items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.02] text-base text-muted-foreground">
            No personal activity data available yet.
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

function MeasuredChart({
  children,
}: {
  children: (size: { width: number; height: number }) => ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const width = Math.floor(entry.contentRect.width);
      const height = Math.floor(entry.contentRect.height);

      if (width > 0 && height > 0) {
        requestAnimationFrame(() => setSize({ width, height }));
      }
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="h-80 min-w-0">
      {size.width > 0 && size.height > 0 ? (
        children(size)
      ) : (
        <div className="h-full rounded-lg border border-white/10 bg-white/[0.03]" />
      )}
    </div>
  );
}

const tooltipStyle = {
  background: "#10120d",
  border: "1px solid rgb(255 255 255 / 0.12)",
  borderRadius: "8px",
  color: "#f4f7ef",
};

export function DashboardCharts({
  weeklyMileage,
  monthlyDistance,
  paceTrend,
  typeBreakdown,
}: {
  weeklyMileage: WeeklyMileagePoint[];
  monthlyDistance: MonthlyDistancePoint[];
  paceTrend: PacePoint[];
  typeBreakdown: ActivityTypePoint[];
}) {
  const [mounted, setMounted] = useState(false);
  const [activeChart, setActiveChart] = useState("weekly");
  const hasWeeklyData = weeklyMileage.some((point) => point.miles > 0);
  const hasMonthlyData = monthlyDistance.some((point) => point.miles > 0);
  const hasPaceData = paceTrend.some((point) => point.pace > 0);
  const hasTypeData = typeBreakdown.length > 0;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));

    return () => cancelAnimationFrame(frame);
  }, []);

  if (!mounted) {
    return (
      <Card className="rounded-lg border border-white/10 bg-card/90 shadow-none">
        <CardHeader>
          <CardTitle>Training trends</CardTitle>
          <CardDescription>Preparing your private analytics charts.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 rounded-lg border border-white/10 bg-white/[0.03]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs value={activeChart} onValueChange={setActiveChart} className="space-y-4">
      <TabsList className="!grid !h-auto w-full grid-cols-2 rounded-lg bg-white/[0.04] p-1 lg:w-fit lg:grid-cols-4">
        <TabsTrigger value="weekly">Weekly mileage</TabsTrigger>
        <TabsTrigger value="monthly">Monthly distance</TabsTrigger>
        <TabsTrigger value="pace">Pace trend</TabsTrigger>
        <TabsTrigger value="types">Type breakdown</TabsTrigger>
      </TabsList>

      <TabsContent value="weekly">
        {activeChart === "weekly" ? (
          <ChartShell
            title="Weekly mileage trend"
            description="Rolling weekly totals for your private activity log."
            empty={!hasWeeklyData}
          >
            <MeasuredChart>
              {({ width, height }) => (
                <AreaChart width={width} height={height} data={weeklyMileage}>
                <defs>
                  <linearGradient id="weeklyMiles" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#cefb09" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#cefb09" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgb(255 255 255 / 0.08)" vertical={false} />
                <XAxis dataKey="week" stroke="#99a091" tickLine={false} axisLine={false} />
                <YAxis stroke="#99a091" tickLine={false} axisLine={false} width={36} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#f4f7ef" }} />
                <Area
                  type="monotone"
                  dataKey="miles"
                  stroke="#cefb09"
                  strokeWidth={2}
                  fill="url(#weeklyMiles)"
                />
              </AreaChart>
              )}
            </MeasuredChart>
          </ChartShell>
        ) : null}
      </TabsContent>

      <TabsContent value="monthly">
        {activeChart === "monthly" ? (
          <ChartShell
            title="Monthly distance trend"
            description="Year-to-date personal distance volume by month."
            empty={!hasMonthlyData}
          >
            <MeasuredChart>
              {({ width, height }) => (
                <BarChart width={width} height={height} data={monthlyDistance}>
                <CartesianGrid stroke="rgb(255 255 255 / 0.08)" vertical={false} />
                <XAxis dataKey="month" stroke="#99a091" tickLine={false} axisLine={false} />
                <YAxis stroke="#99a091" tickLine={false} axisLine={false} width={36} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#f4f7ef" }} />
                <Bar dataKey="miles" radius={[8, 8, 0, 0]} fill="#4fe3c1" />
              </BarChart>
              )}
            </MeasuredChart>
          </ChartShell>
        ) : null}
      </TabsContent>

      <TabsContent value="pace">
        {activeChart === "pace" ? (
          <ChartShell
            title="Pace trend over time"
            description="Recent run pace in minutes per mile. Lower is faster."
            empty={!hasPaceData}
          >
            <MeasuredChart>
              {({ width, height }) => (
                <LineChart width={width} height={height} data={paceTrend}>
                <CartesianGrid stroke="rgb(255 255 255 / 0.08)" vertical={false} />
                <XAxis dataKey="date" stroke="#99a091" tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#99a091"
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  domain={["dataMin - 0.2", "dataMax + 0.2"]}
                />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#f4f7ef" }} />
                <Line
                  type="monotone"
                  dataKey="pace"
                  stroke="#cefb09"
                  strokeWidth={2}
                  dot={{ fill: "#070806", stroke: "#cefb09", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: "#cefb09", stroke: "#070806" }}
                />
              </LineChart>
              )}
            </MeasuredChart>
          </ChartShell>
        ) : null}
      </TabsContent>

      <TabsContent value="types">
        {activeChart === "types" ? (
          <ChartShell
            title="Activity type breakdown"
            description="Counts and mileage by private activity type."
            empty={!hasTypeData}
          >
            <MeasuredChart>
              {({ width, height }) => (
                <PieChart width={width} height={height}>
                <Pie
                  data={typeBreakdown}
                  dataKey="miles"
                  nameKey="type"
                  innerRadius={72}
                  outerRadius={116}
                  paddingAngle={4}
                >
                  {typeBreakdown.map((entry, index) => (
                    <Cell key={entry.type} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#f4f7ef" }} />
              </PieChart>
              )}
            </MeasuredChart>
          </ChartShell>
        ) : null}
      </TabsContent>
    </Tabs>
  );
}
