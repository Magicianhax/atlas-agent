"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { cn, formatUsd } from "@/lib/utils";

interface DrawdownSnapshot {
  timestamp: string;
  totalValueUsd: number;
}

interface DrawdownChartProps {
  snapshots: DrawdownSnapshot[];
}

interface DrawdownPoint {
  time: string;
  drawdown: number;
  value: number;
  peak: number;
}

export function DrawdownChart({ snapshots }: DrawdownChartProps) {
  const drawdownData = useMemo(() => {
    if (snapshots.length === 0) return [];

    const sorted = [...snapshots].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let peak = -Infinity;
    const points: DrawdownPoint[] = [];

    for (const s of sorted) {
      if (s.totalValueUsd > peak) {
        peak = s.totalValueUsd;
      }
      const drawdown = peak > 0 ? ((s.totalValueUsd - peak) / peak) * 100 : 0;
      points.push({
        time: new Date(s.timestamp).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        drawdown: Math.round(drawdown * 100) / 100,
        value: s.totalValueUsd,
        peak,
      });
    }

    return points;
  }, [snapshots]);

  const hasData = drawdownData.length > 0;

  const minDrawdown = useMemo(() => {
    if (!hasData) return -30;
    const min = Math.min(...drawdownData.map((d) => d.drawdown));
    return Math.min(min * 1.2, -5);
  }, [drawdownData, hasData]);

  return (
    <div className="border-2 border-border bg-surface/60">
      <div className="border-b-2 border-crimson/30 px-4 py-3 p5-stripes">
        <h3
          className="text-xs font-black uppercase tracking-[0.2em] text-crimson"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Drawdown Monitor
        </h3>
      </div>
      <div className="p-4">
        {hasData ? (
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={drawdownData}>
                <defs>
                  <linearGradient
                    id="drawdownGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#e63946"
                      stopOpacity={0.05}
                    />
                    <stop
                      offset="40%"
                      stopColor="#e63946"
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="100%"
                      stopColor="#e63946"
                      stopOpacity={0.6}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#2a2a2a"
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  tick={{
                    fill: "#8a8578",
                    fontSize: 10,
                    fontFamily: "var(--font-mono)",
                  }}
                  tickLine={false}
                  axisLine={{ stroke: "#2a2a2a" }}
                />
                <YAxis
                  domain={[minDrawdown, 2]}
                  tick={{
                    fill: "#8a8578",
                    fontSize: 10,
                    fontFamily: "var(--font-mono)",
                  }}
                  tickLine={false}
                  axisLine={{ stroke: "#2a2a2a" }}
                  tickFormatter={(v: number) => `${v.toFixed(0)}%`}
                  width={45}
                />
                <ReferenceLine
                  y={0}
                  stroke="#8a8578"
                  strokeWidth={1}
                />
                <ReferenceLine
                  y={-10}
                  stroke="#ffd700"
                  strokeDasharray="6 4"
                  strokeWidth={1.5}
                  label={{
                    value: "-10% WARNING",
                    position: "right",
                    fill: "#ffd700",
                    fontSize: 9,
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                  }}
                />
                <ReferenceLine
                  y={-25}
                  stroke="#e63946"
                  strokeDasharray="6 4"
                  strokeWidth={1.5}
                  label={{
                    value: "EMERGENCY HALT",
                    position: "right",
                    fill: "#e63946",
                    fontSize: 9,
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#141414",
                    border: "2px solid #e63946",
                    borderRadius: "0",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color: "#f5f0e8",
                  }}
                  labelStyle={{ color: "#8a8578", marginBottom: "4px" }}
                  itemStyle={{ color: "#f5f0e8" }}
                  formatter={(value: number, name: string) => {
                    if (name === "drawdown") {
                      return [`${value.toFixed(2)}%`, "Drawdown"];
                    }
                    return [value, name];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="drawdown"
                  stroke="#e63946"
                  strokeWidth={2}
                  fill="url(#drawdownGradient)"
                  activeDot={{
                    r: 4,
                    fill: "#ffd700",
                    stroke: "#e63946",
                    strokeWidth: 1,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[320px] items-center justify-center">
            <p
              className="text-xs font-bold uppercase tracking-[0.15em] text-text-muted"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              No snapshot data for drawdown analysis
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
