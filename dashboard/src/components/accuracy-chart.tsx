"use client";

import { useMemo } from "react";
import type { Prediction } from "@/components/prediction-card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const GRID_COLOR = "#2a2a2a";
const TEXT_COLOR = "#f5f0e8";
const MUTED_COLOR = "#8a8578";
const ACCENT_GREEN = "#22c55e";
const ACCENT_AMBER = "#ffd700";

interface AccuracyPoint {
  date: string;
  accuracy: number;
  total: number;
}

interface CalibrationBucket {
  range: string;
  statedConfidence: number;
  actualAccuracy: number;
  count: number;
}

function computeAccuracyOverTime(predictions: Prediction[]): AccuracyPoint[] {
  const resolved = predictions.filter(
    (p) => p.status === "correct" || p.status === "incorrect" || p.status === "partially_correct"
  );

  if (resolved.length === 0) return [];

  // Group by day (using resolvedAt if available, else createdAt)
  const byDay = new Map<string, { correct: number; total: number }>();

  for (const p of resolved) {
    const dateStr = (p.resolvedAt ?? p.createdAt).slice(0, 10);
    const entry = byDay.get(dateStr) ?? { correct: 0, total: 0 };
    entry.total++;
    if (p.status === "correct") entry.correct++;
    if (p.status === "partially_correct") entry.correct += 0.5;
    byDay.set(dateStr, entry);
  }

  // Sort by date and compute rolling accuracy
  const sorted = Array.from(byDay.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  let runningCorrect = 0;
  let runningTotal = 0;

  return sorted.map(([date, { correct, total }]) => {
    runningCorrect += correct;
    runningTotal += total;
    return {
      date,
      accuracy: Math.round((runningCorrect / runningTotal) * 100),
      total: runningTotal,
    };
  });
}

function computeCalibration(predictions: Prediction[]): CalibrationBucket[] {
  const resolved = predictions.filter(
    (p) => p.status === "correct" || p.status === "incorrect" || p.status === "partially_correct"
  );

  const buckets = [
    { min: 0, max: 25, label: "0-25%" },
    { min: 25, max: 50, label: "25-50%" },
    { min: 50, max: 75, label: "50-75%" },
    { min: 75, max: 100, label: "75-100%" },
  ];

  return buckets.map(({ min, max, label }) => {
    const inBucket = resolved.filter(
      (p) => p.confidence >= min && p.confidence < (max === 100 ? 101 : max)
    );

    const correctCount = inBucket.reduce((acc, p) => {
      if (p.status === "correct") return acc + 1;
      if (p.status === "partially_correct") return acc + 0.5;
      return acc;
    }, 0);

    const actualAccuracy =
      inBucket.length > 0 ? Math.round((correctCount / inBucket.length) * 100) : 0;
    const statedConfidence =
      inBucket.length > 0
        ? Math.round(inBucket.reduce((acc, p) => acc + p.confidence, 0) / inBucket.length)
        : 0;

    return {
      range: label,
      statedConfidence,
      actualAccuracy,
      count: inBucket.length,
    };
  });
}

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "#141414",
    border: "2px solid #e63946",
    borderRadius: "0",
    fontSize: "11px",
    fontFamily: "monospace",
    color: TEXT_COLOR,
  },
  itemStyle: { color: TEXT_COLOR },
  labelStyle: { color: MUTED_COLOR, marginBottom: "4px" },
};

export function AccuracyChart({ predictions }: { predictions: Prediction[] }) {
  const accuracyData = useMemo(
    () => computeAccuracyOverTime(predictions),
    [predictions]
  );

  const calibrationData = useMemo(
    () => computeCalibration(predictions),
    [predictions]
  );

  const hasAccuracyData = accuracyData.length > 0;
  const hasCalibrationData = calibrationData.some((b) => b.count > 0);

  if (!hasAccuracyData && !hasCalibrationData) {
    return (
      <div className="border-2 border-dashed border-crimson/20 bg-surface/80 p-6 text-center text-sm text-text-muted font-bold">
        No resolved predictions yet. Charts will appear once predictions are resolved.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Accuracy Over Time */}
      <div className="border-2 border-border bg-surface/80 p-4">
        <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-crimson">
          Accuracy Over Time
        </h3>
        {hasAccuracyData ? (
          <>
            {/* Summary stats above chart */}
            <div className="mb-3 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-text-muted uppercase tracking-wider">Current:</span>
                <span className={`text-sm font-bold ${accuracyData[accuracyData.length - 1].accuracy >= 50 ? "text-status-correct" : "text-crimson"}`}>
                  {accuracyData[accuracyData.length - 1].accuracy}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-text-muted uppercase tracking-wider">Resolved:</span>
                <span className="text-sm font-bold text-text">
                  {accuracyData[accuracyData.length - 1].total}
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={accuracyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={GRID_COLOR}
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: MUTED_COLOR, fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: GRID_COLOR }}
                  tickFormatter={(val: string) => val.slice(5)}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: MUTED_COLOR, fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: GRID_COLOR }}
                  tickFormatter={(val: number) => `${val}%`}
                  width={40}
                />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(value: number) => [`${value}%`, "Accuracy"]}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke={ACCENT_GREEN}
                  strokeWidth={2}
                  dot={{ fill: ACCENT_GREEN, r: 5, strokeWidth: 2, stroke: "#141414" }}
                  activeDot={{ r: 7, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </>
        ) : (
          <div className="flex h-[240px] items-center justify-center text-xs text-text-muted">
            Waiting for resolved predictions...
          </div>
        )}
      </div>

      {/* Calibration Chart */}
      <div className="border-2 border-border bg-surface/80 p-4">
        <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-crimson">
          Calibration (Confidence vs Reality)
        </h3>
        {hasCalibrationData ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={calibrationData} barGap={4}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={GRID_COLOR}
                vertical={false}
              />
              <XAxis
                dataKey="range"
                tick={{ fill: MUTED_COLOR, fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: GRID_COLOR }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: MUTED_COLOR, fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: GRID_COLOR }}
                tickFormatter={(val: number) => `${val}%`}
                width={40}
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(value: number, name: string) => [
                  `${value}%`,
                  name === "statedConfidence" ? "Stated Confidence" : "Actual Accuracy",
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px", color: MUTED_COLOR }}
                formatter={(value: string) =>
                  value === "statedConfidence"
                    ? "Stated Confidence"
                    : "Actual Accuracy"
                }
              />
              <Bar
                dataKey="statedConfidence"
                fill={ACCENT_AMBER}
                radius={[3, 3, 0, 0]}
                opacity={0.7}
              />
              <Bar
                dataKey="actualAccuracy"
                fill={ACCENT_GREEN}
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[240px] items-center justify-center text-xs text-text-muted">
            Waiting for resolved predictions...
          </div>
        )}
      </div>
    </div>
  );
}
