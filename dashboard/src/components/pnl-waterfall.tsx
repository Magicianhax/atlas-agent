"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { cn, formatUsd } from "@/lib/utils";

interface Position {
  protocol: string;
  tokenSymbol: string;
  apy?: number;
  currentValueUsd?: number;
  entryValueUsd?: number;
  pnlUsd?: number;
}

interface PnlWaterfallProps {
  positions: Position[];
}

interface WaterfallBar {
  name: string;
  pnl: number;
  isTotal?: boolean;
}

const COLOR_PROFIT = "#22c55e";
const COLOR_LOSS = "#e63946";
const COLOR_TOTAL_POS = "#ffd700";
const COLOR_TOTAL_NEG = "#ff4757";

export function PnlWaterfall({ positions }: PnlWaterfallProps) {
  const waterfallData = useMemo(() => {
    const bars: WaterfallBar[] = positions
      .map((p) => {
        const pnl =
          p.pnlUsd ??
          (p.currentValueUsd != null && p.entryValueUsd != null
            ? p.currentValueUsd - p.entryValueUsd
            : 0);
        return {
          name: p.tokenSymbol,
          pnl,
        };
      })
      .filter((b) => b.pnl !== 0)
      .sort((a, b) => b.pnl - a.pnl);

    if (bars.length === 0) return [];

    const total = bars.reduce((sum, b) => sum + b.pnl, 0);
    bars.push({ name: "NET", pnl: total, isTotal: true });

    return bars;
  }, [positions]);

  const hasData = waterfallData.length > 0;

  return (
    <div className="border-2 border-border bg-surface/60">
      <div className="border-b-2 border-crimson/30 px-4 py-3 p5-stripes">
        <h3
          className="text-xs font-black uppercase tracking-[0.2em] text-crimson"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          P&L Breakdown
        </h3>
      </div>
      <div className="p-4">
        {hasData ? (
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfallData} barCategoryGap="20%">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#2a2a2a"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{
                    fill: "#8a8578",
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                  }}
                  tickLine={false}
                  axisLine={{ stroke: "#2a2a2a" }}
                />
                <YAxis
                  tick={{
                    fill: "#8a8578",
                    fontSize: 10,
                    fontFamily: "var(--font-mono)",
                  }}
                  tickLine={false}
                  axisLine={{ stroke: "#2a2a2a" }}
                  tickFormatter={(v: number) =>
                    v >= 1000
                      ? `$${(v / 1000).toFixed(1)}k`
                      : v <= -1000
                        ? `-$${(Math.abs(v) / 1000).toFixed(1)}k`
                        : `$${v.toFixed(0)}`
                  }
                  width={55}
                />
                <ReferenceLine y={0} stroke="#8a8578" strokeWidth={1} />
                <Tooltip
                  cursor={{ fill: "rgba(230, 57, 70, 0.08)" }}
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
                  formatter={(value: number) => [
                    `${value >= 0 ? "+" : ""}${formatUsd(value)}`,
                    "P&L",
                  ]}
                />
                <Bar dataKey="pnl" maxBarSize={48}>
                  {waterfallData.map((entry, index) => {
                    let fill: string;
                    if (entry.isTotal) {
                      fill = entry.pnl >= 0 ? COLOR_TOTAL_POS : COLOR_TOTAL_NEG;
                    } else {
                      fill = entry.pnl >= 0 ? COLOR_PROFIT : COLOR_LOSS;
                    }
                    return <Cell key={index} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[320px] items-center justify-center">
            <p
              className="text-xs font-bold uppercase tracking-[0.15em] text-text-muted"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              No P&L data to display
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
