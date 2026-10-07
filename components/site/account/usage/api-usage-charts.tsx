"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface UsageChartPoint {
  date?: string;
  errors?: number;
  latency?: number;
  requests?: number;
  time?: string;
}

const tooltipStyle = {
  border: "none",
  borderRadius: "16px",
  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
  fontWeight: "bold",
} as const;

export default function ApiUsageCharts({
  variant,
  data,
}: {
  variant: "requests" | "latency";
  data: UsageChartPoint[];
}) {
  if (variant === "latency") {
    return (
      <div className="h-[250px] w-full">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart
            data={data}
            margin={{ bottom: 0, left: -20, right: 10, top: 10 }}
          >
            <CartesianGrid
              stroke="#e2e8f0"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              axisLine={false}
              dataKey="time"
              dy={10}
              minTickGap={20}
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              activeDot={{
                fill: "#10b981",
                r: 6,
                stroke: "#fff",
                strokeWidth: 2,
              }}
              dataKey="latency"
              dot={false}
              name="Latence (ms)"
              stroke="#10b981"
              strokeWidth={3}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer height="100%" width="100%">
        <AreaChart
          data={data}
          margin={{ bottom: 0, left: -20, right: 10, top: 10 }}
        >
          <defs>
            <linearGradient id="colorRequests" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorErrors" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="#e2e8f0"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            axisLine={false}
            dataKey="date"
            dy={10}
            tick={{ fill: "#64748b", fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            axisLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            tickLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Area
            dataKey="requests"
            fill="url(#colorRequests)"
            fillOpacity={1}
            name="Requêtes"
            stroke="#3b82f6"
            strokeWidth={3}
            type="monotone"
          />
          <Area
            dataKey="errors"
            fill="url(#colorErrors)"
            fillOpacity={1}
            name="Erreurs"
            stroke="#ef4444"
            strokeWidth={3}
            type="monotone"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
