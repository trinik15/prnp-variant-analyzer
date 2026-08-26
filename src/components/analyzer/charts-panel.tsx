"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart as BarChartIcon, CalendarClock, PieChart as PieIcon } from "./icons";
import { classificationStyle, type StatsDTO } from "./types";

interface ChartsPanelProps {
  stats: StatsDTO;
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; payload?: Record<string, unknown> }[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-sm border border-zinc-700 bg-zinc-900/95 px-3 py-2 text-xs shadow-xl">
      <p className="font-mono font-semibold text-zinc-100">{label ?? String(payload[0]?.payload?.notation ?? "")}</p>
      <p className="mt-0.5 text-zinc-400">
        {payload[0]?.name}: <span className="font-mono text-emerald-300">{payload[0]?.value}</span>
      </p>
      {payload[0]?.payload?.classification ? (
        <p className="mt-0.5 text-zinc-500">{String(payload[0].payload.classification)}</p>
      ) : null}
    </div>
  );
}

export function ChartsPanel({ stats }: ChartsPanelProps) {
  const pieData = useMemo(
    () =>
      stats.classificationBreakdown.map((c) => ({
        ...c,
        fill: classificationStyle(c.name).chart,
      })),
    [stats.classificationBreakdown],
  );

  const totalClassified = pieData.reduce((a, b) => a + b.value, 0);

  if (stats.totalVariants === 0) return null;

  return (
    <section aria-label="Data visualizations" className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      {/* Top variants */}
      <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5 lg:col-span-3">
        <div className="mb-4 flex items-center gap-2">
          <BarChartIcon className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-zinc-200">
            Most reported variants
          </h3>
          <span className="ml-auto text-xs text-zinc-500">papers citing variant</span>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stats.topVariants}
              layout="vertical"
              margin={{ top: 0, right: 12, bottom: 0, left: 8 }}
              barCategoryGap={6}
            >
              <CartesianGrid horizontal={false} stroke="#27272a" strokeDasharray="3 3" />
              <XAxis type="number" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="notation"
                width={62}
                stroke="#a1a1aa"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                interval={0}
                tick={{ fontFamily: "var(--font-plex-mono), monospace" }}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="count" name="Papers" radius={[0, 2, 2, 0]}>
                {stats.topVariants.map((v) => (
                  <Cell key={v.notation} fill={classificationStyle(v.classification).chart} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:col-span-2">
        {/* Publications by year */}
        <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-teal-400" />
            <h3 className="text-sm font-semibold text-zinc-200">Publications by year</h3>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.papersByYear} margin={{ top: 0, right: 4, bottom: 0, left: -18 }}>
                <CartesianGrid vertical={false} stroke="#27272a" strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  stroke="#52525b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="count" name="Papers" fill="#2dd4bf" radius={[1, 1, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Classification donut */}
        <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5">
          <div className="mb-2 flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-zinc-200">Reported association (curated)</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative h-32 w-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={36}
                    outerRadius={58}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {pieData.map((d) => (
                      <Cell key={d.name} fill={d.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-lg font-bold text-zinc-100">{totalClassified}</span>
                <span className="text-[10px] uppercase tracking-wider text-zinc-500">variants</span>
              </div>
            </div>
            <ul className="min-w-0 flex-1 space-y-1.5">
              {pieData.map((d) => (
                <li key={d.name} className="flex items-center gap-2 text-xs">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: d.fill }}
                  />
                  <span className="truncate text-zinc-400">{d.name}</span>
                  <span className="ml-auto font-mono text-zinc-300">{d.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
