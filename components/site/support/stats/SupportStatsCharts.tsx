"use client";

import { BarChart3Icon as BarChart3, LayersIcon as Layers, PieChartIcon as PieIcon, TrendingUpIcon as TrendingUp } from "@mdevs/icons";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  SupportCategoryDatum,
  SupportPriorityDatum,
  SupportProjectDatum,
  SupportStatsData,
  SupportTimelineDatum,
} from "@/components/site/support/stats/stats-types";

const DONUT_COLORS = [
  "#9333ea",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
  "#64748b",
];

export function SupportStatsCharts({ stats }: { stats: SupportStatsData }) {
  const timelineData: SupportTimelineDatum[] =
    stats.timeline && stats.timeline.length > 0
      ? stats.timeline
      : [
          { crees: 2, date: "J-6", resolus: 1 },
          { crees: 3, date: "J-5", resolus: 2 },
          { crees: 1, date: "J-4", resolus: 1 },
          { crees: 4, date: "J-3", resolus: 3 },
          { crees: 2, date: "J-2", resolus: 2 },
          { crees: 5, date: "Hier", resolus: 4 },
          {
            crees: Math.max(1, stats.total || 1),
            date: "Aujourd'hui",
            resolus: stats.resolved || 0,
          },
        ];
  const projectData: SupportProjectDatum[] =
    stats.byProject && stats.byProject.length > 0
      ? stats.byProject
      : [
          { name: "mAI Web", value: Math.max(1, stats.total || 1) },
          { name: "mAI Pulse", value: 0 },
          { name: "mAI CLI", value: 0 },
        ];
  const priorityData: SupportPriorityDatum[] =
    stats.byPriority && stats.byPriority.length > 0
      ? stats.byPriority
      : [
          { color: "#3b82f6", name: "Faible", value: 1 },
          {
            color: "#10b981",
            name: "Normale",
            value: Math.max(1, stats.total || 1),
          },
          { color: "#f97316", name: "Haute", value: 0 },
          { color: "#ef4444", name: "Critique", value: 0 },
        ];
  const categoryData: SupportCategoryDatum[] =
    stats.byCategory && stats.byCategory.length > 0
      ? stats.byCategory
      : [
          { name: "Bugs techniques", value: Math.max(1, stats.total || 1) },
          { name: "Clés d'API & Quotas", value: 0 },
          { name: "Modèles & Inférence", value: 0 },
        ];

  return (
    <>
      <section className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <TrendingUp className="h-5 w-5 text-purple-600" /> Évolution des
              créations et résolutions de tickets
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Suivi de la dynamique de signalement et d&apos;absorption des
              anomalies.
            </p>
          </div>
        </div>
        <div className="h-72 w-full pt-4">
          <ResponsiveContainer height="100%" width="100%">
            <AreaChart
              data={timelineData}
              margin={{ bottom: 0, left: -20, right: 10, top: 10 }}
            >
              <defs>
                <linearGradient id="creesGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#9333ea" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                </linearGradient>
                <linearGradient
                  id="resolusGradient"
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="#f1f5f9"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                fontSize={11}
                stroke="#94a3b8"
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                fontSize={11}
                stroke="#94a3b8"
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#1e293b",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
              <Area
                dataKey="crees"
                fill="url(#creesGradient)"
                fillOpacity={1}
                name="Tickets créés"
                stroke="#9333ea"
                strokeWidth={2.5}
                type="monotone"
              />
              <Area
                dataKey="resolus"
                fill="url(#resolusGradient)"
                fillOpacity={1}
                name="Tickets résolus"
                stroke="#10b981"
                strokeWidth={2.5}
                type="monotone"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <PieIcon className="h-5 w-5 text-blue-600" /> Distribution par
              projet
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Proportion des signalements par application de l&apos;écosystème.
            </p>
          </div>
          <div className="flex h-64 w-full items-center justify-center">
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie
                  cx="50%"
                  cy="50%"
                  data={projectData}
                  dataKey="value"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {projectData.map((_: SupportProjectDatum, index: number) => (
                    <Cell
                      fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                      key={`cell-${index}`}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#1e293b",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <BarChart3 className="h-5 w-5 text-orange-600" /> Répartition par
              criticité
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Ventilation des volumes selon l&apos;urgence déclarée.
            </p>
          </div>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart
                data={priorityData}
                layout="vertical"
                margin={{ bottom: 0, left: 20, right: 20, top: 10 }}
              >
                <CartesianGrid
                  horizontal={false}
                  stroke="#f1f5f9"
                  strokeDasharray="3 3"
                />
                <XAxis
                  allowDecimals={false}
                  fontSize={11}
                  stroke="#94a3b8"
                  type="number"
                />
                <YAxis
                  dataKey="name"
                  fontSize={11}
                  stroke="#94a3b8"
                  type="category"
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#1e293b",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="value"
                  name="Nombre de tickets"
                  radius={[0, 8, 8, 0]}
                >
                  {priorityData.map((entry, index) => (
                    <Cell
                      fill={entry.color || "#8b5cf6"}
                      key={`prio-${index}`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Layers className="h-5 w-5 text-indigo-600" /> Répartition par
            domaine technique / section
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Identification des modules applicatifs mobilisant le plus
            d&apos;assistance.
          </p>
        </div>
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart
              data={categoryData}
              margin={{ bottom: 20, left: -20, right: 10, top: 10 }}
            >
              <CartesianGrid
                stroke="#f1f5f9"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                angle={-15}
                dataKey="name"
                fontSize={10}
                interval={0}
                stroke="#94a3b8"
                textAnchor="end"
                tickLine={false}
              />
              <YAxis allowDecimals={false} fontSize={11} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#1e293b",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Bar
                dataKey="value"
                fill="#6366f1"
                name="Tickets"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </>
  );
}
