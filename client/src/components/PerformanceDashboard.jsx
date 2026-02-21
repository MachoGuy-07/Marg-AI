import React from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import GlassCard from "./layout/GlassCard";

export default function PerformanceDashboard({ score }) {
  const safeScore = score || 0;

  const barData = [
    { name: "Confidence", value: safeScore },
    { name: "Pace", value: Math.max(0, Math.min(safeScore - 10, 100)) },
    { name: "Engagement", value: Math.max(0, Math.min(safeScore - 5, 100)) },
  ];

  const pieData = [
    { name: "Voice", value: 40 },
    { name: "Pace", value: 30 },
    { name: "Posture", value: 30 },
  ];

  const timelineData = [
    { time: "0s", value: 40 },
    { time: "15s", value: 55 },
    { time: "30s", value: 65 },
    { time: "45s", value: safeScore },
  ];

  const COLORS = ["#8b5cf6", "#22d3ee", "#f59e0b"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mt-16"
    >
      <GlassCard>
        <h2 className="text-2xl font-semibold mb-10 text-white">
          📊 Interview Performance Report
        </h2>

        {/* ================= BAR CHART ================= */}
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#aaa" />
              <YAxis domain={[0, 100]} stroke="#aaa" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111827",
                  border: "none",
                  borderRadius: 10,
                }}
              />
              <Bar
                dataKey="value"
                fill="#8b5cf6"
                radius={[10, 10, 0, 0]}
                barSize={45}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ================= DONUT CHART ================= */}
        <div className="h-80 mt-14 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                innerRadius={80}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111827",
                  border: "none",
                  borderRadius: 10,
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Score */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold text-white">
              {safeScore}
            </h1>
            <p className="text-gray-400 text-sm">Overall Score</p>
          </div>
        </div>

        {/* ================= LINE CHART ================= */}
        <div className="h-80 mt-16">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={timelineData}
              margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
            >
              <CartesianGrid stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" stroke="#aaa" />
              <YAxis domain={[0, 100]} stroke="#aaa" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111827",
                  border: "none",
                  borderRadius: 10,
                }}
              />
              <Legend />

              <Line
                type="monotone"
                dataKey="value"
                name="Confidence Score"
                stroke="#22d3ee"
                strokeWidth={3}
                dot={{ r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </motion.div>
  );
}