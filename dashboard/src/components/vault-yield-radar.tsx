"use client";

import { useMemo } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";

interface Position {
  protocol: string;
  tokenSymbol: string;
  apy?: number;
  currentValueUsd?: number;
  entryValueUsd?: number;
}

interface VaultYieldRadarProps {
  positions: Position[];
}

export function VaultYieldRadar({ positions }: VaultYieldRadarProps) {
  const radarData = useMemo(() => {
    const withApy = positions.filter((p) => p.apy != null && p.apy > 0);
    return withApy.map((p) => ({
      label: `${p.tokenSymbol}\n(${p.protocol})`,
      apy: p.apy!,
      fullMark: Math.max(...withApy.map((v) => v.apy!)) * 1.2,
    }));
  }, [positions]);

  const hasData = radarData.length > 0;

  return (
    <div className="border-2 border-border bg-surface/60">
      <div className="border-b-2 border-crimson/30 px-4 py-3 p5-stripes">
        <h3
          className="text-xs font-black uppercase tracking-[0.2em] text-crimson"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Yield Radar
        </h3>
      </div>
      <div className="p-4">
        {hasData ? (
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="75%"
                data={radarData}
              >
                <PolarGrid stroke="#2a2a2a" strokeWidth={1} />
                <PolarAngleAxis
                  dataKey="label"
                  tick={{
                    fill: "#e63946",
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                  }}
                  stroke="#2a2a2a"
                />
                <PolarRadiusAxis
                  angle={90}
                  tick={{
                    fill: "#8a8578",
                    fontSize: 9,
                    fontFamily: "var(--font-mono)",
                  }}
                  stroke="#2a2a2a"
                  tickFormatter={(v: number) => `${v.toFixed(0)}%`}
                />
                <Radar
                  name="APY"
                  dataKey="apy"
                  stroke="#ffd700"
                  strokeWidth={2}
                  fill="#e63946"
                  fillOpacity={0.35}
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
                  formatter={(value: number) => [`${value.toFixed(2)}%`, "APY"]}
                  labelStyle={{ color: "#8a8578", marginBottom: "4px" }}
                  itemStyle={{ color: "#f5f0e8" }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[320px] items-center justify-center">
            <p
              className="text-xs font-bold uppercase tracking-[0.15em] text-text-muted"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              No APY data available for radar display
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
