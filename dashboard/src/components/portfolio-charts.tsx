"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { formatUsd } from "@/lib/utils";
import { ChainLogo } from "@/components/logos";

const CHAIN_COLORS: Record<number, string> = {
  42161: "#2d374b",
  8453: "#0052ff",
  10: "#ff0420",
};

const CHAIN_NAMES: Record<number, string> = {
  42161: "Arbitrum",
  8453: "Base",
  10: "Optimism",
};

interface Holding {
  chainId: number;
  token: string;
  tokenAddress: string;
  amount: number;
  valueUsd: number;
}

interface Snapshot {
  id: string;
  timestamp: string;
  totalValueUsd: number;
  holdings: Holding[];
  pnl24h?: number;
  pnlTotal?: number;
}

interface PortfolioChartsProps {
  snapshots: Snapshot[];
  liveHoldings?: Holding[];
}

function ChainDonutChart({ holdings }: { holdings: Holding[] }) {
  const chainData = useMemo(() => {
    const grouped: Record<number, number> = {};
    for (const h of holdings) {
      grouped[h.chainId] = (grouped[h.chainId] ?? 0) + h.valueUsd;
    }
    return Object.entries(grouped)
      .map(([chainId, value]) => ({
        name: CHAIN_NAMES[Number(chainId)] ?? `Chain ${chainId}`,
        value,
        color: CHAIN_COLORS[Number(chainId)] ?? "#6b7280",
      }))
      .sort((a, b) => b.value - a.value);
  }, [holdings]);

  if (chainData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-text-muted">
        No holdings data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chainData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
          stroke="none"
        >
          {chainData.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#141414",
            border: "2px solid #e63946",
            borderRadius: "0",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            color: "#f5f0e8",
          }}
          itemStyle={{ color: "#f5f0e8" }}
          formatter={(value: number) => [formatUsd(value), "Value"]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function ValueOverTimeChart({ snapshots }: { snapshots: Snapshot[] }) {
  const chartData = useMemo(() => {
    return [...snapshots]
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
      .map((s) => ({
        time: new Date(s.timestamp).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        value: s.totalValueUsd,
      }));
  }, [snapshots]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-text-muted">
        No snapshot data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
        <XAxis
          dataKey="time"
          tick={{ fill: "#8a8578", fontSize: 11 }}
          stroke="#2a2a2a"
        />
        <YAxis
          tick={{ fill: "#8a8578", fontSize: 11 }}
          stroke="#2a2a2a"
          tickFormatter={(v: number) => v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${Math.round(v)}`}
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
          itemStyle={{ color: "#f5f0e8" }}
          formatter={(value: number) => [formatUsd(value), "Portfolio"]}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#e63946"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#ffd700" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PortfolioCharts({ snapshots, liveHoldings }: PortfolioChartsProps) {
  const latestHoldings = useMemo(() => {
    if (liveHoldings && liveHoldings.length > 0) return liveHoldings;
    if (snapshots.length === 0) return [];
    const sorted = [...snapshots].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return sorted[0].holdings;
  }, [liveHoldings, snapshots]);

  // Legend data for the donut chart
  const chainLegend = useMemo(() => {
    const grouped: Record<number, number> = {};
    for (const h of latestHoldings) {
      grouped[h.chainId] = (grouped[h.chainId] ?? 0) + h.valueUsd;
    }
    const total = Object.values(grouped).reduce((s, v) => s + v, 0);
    return Object.entries(grouped)
      .map(([chainId, value]) => ({
        chainId: Number(chainId),
        name: CHAIN_NAMES[Number(chainId)] ?? `Chain ${chainId}`,
        value,
        pct: total > 0 ? ((value / total) * 100).toFixed(1) : "0",
        color: CHAIN_COLORS[Number(chainId)] ?? "#6b7280",
      }))
      .sort((a, b) => b.value - a.value);
  }, [latestHoldings]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Chain Allocation Donut */}
      <div className="border-2 border-border bg-surface/60 p-4">
        <h3 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-crimson">
          Chain Allocation
        </h3>
        <div className="h-[240px]">
          <ChainDonutChart holdings={latestHoldings} />
        </div>
        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-4 justify-center">
          {chainLegend.map((c) => (
            <div key={c.name} className="flex items-center gap-1.5 text-xs">
              <ChainLogo chainId={c.chainId} size={16} />
              <span className="text-text-muted">
                {c.name} {c.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Portfolio Value Over Time */}
      <div className="border-2 border-border bg-surface/60 p-4">
        <h3 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-crimson">
          Portfolio Value Over Time
        </h3>
        <div className="h-[280px]">
          <ValueOverTimeChart snapshots={snapshots} />
        </div>
      </div>
    </div>
  );
}
