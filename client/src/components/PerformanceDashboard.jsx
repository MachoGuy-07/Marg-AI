import React from "react";
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

  const COLORS = ["#4f46e5", "#22c55e", "#f59e0b"];

  return (
    <div
      style={{
        marginTop: 40,
        padding: 30,
        background: "#ffffff",
        borderRadius: 20,
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
      }}
    >
      <h2 style={{ marginBottom: 30 }}>
        📊 Interview Performance Report
      </h2>

      {/* ================= BAR CHART ================= */}
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar
              dataKey="value"
              fill="#4f46e5"
              radius={[8, 8, 0, 0]}
              barSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ================= DONUT CHART ================= */}
      <div
        style={{
          height: 300,
          marginTop: 50,
          position: "relative",
        }}
      >
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
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Score */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <h1 style={{ margin: 0 }}>{safeScore}</h1>
          <p style={{ margin: 0, color: "#666" }}>Overall Score</p>
        </div>
      </div>

      {/* ================= LINE CHART ================= */}
      <div style={{ height: 320, marginTop: 60 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={timelineData}
            margin={{ top: 20, right: 40, left: 40, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="time"
              label={{
                value: "Time (seconds)",
                position: "outsideBottom",
                offset: 20,
              }}
            />

            <YAxis
              domain={[0, 100]}
              label={{
                value: "Confidence Score (0–100)",
                angle: -90,
                position: "outsideLeft",
                offset: 20,
              }}
            />

            <Tooltip />

            <Legend verticalAlign="top" height={36} />

            <Line
              type="monotone"
              dataKey="value"
              name="Confidence Score"
              stroke="#4f46e5"
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}