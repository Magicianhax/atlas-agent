"use client";

import { useMemo } from "react";
import { formatUsd } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Holding {
  chainId: number;
  valueUsd: number;
  token: string;
  type?: string;
}

interface Position {
  tokenSymbol: string;
  entryValueUsd: number;
  currentValueUsd?: number;
  pnlUsd?: number;
  chainId?: number;
  status: string;
}

interface RiskHeatmapProps {
  holdings: Holding[];
  positions: Position[];
  totalValue: number;
}

// ---------------------------------------------------------------------------
// Risk computation
// ---------------------------------------------------------------------------

type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

interface RiskMetric {
  id: string;
  label: string;
  description: string;
  score: number; // 0-100
  level: RiskLevel;
  detail: string;
}

const RISK_COLORS: Record<RiskLevel, string> = {
  LOW: "#22c55e",
  MEDIUM: "#ffd700",
  HIGH: "#e63946",
};

const RISK_BG: Record<RiskLevel, string> = {
  LOW: "rgba(34, 197, 94, 0.15)",
  MEDIUM: "rgba(255, 215, 0, 0.15)",
  HIGH: "rgba(230, 57, 70, 0.15)",
};

function scoreToLevel(score: number): RiskLevel {
  if (score <= 33) return "LOW";
  if (score <= 66) return "MEDIUM";
  return "HIGH";
}

function computeRiskMetrics(
  holdings: Holding[],
  positions: Position[],
  totalValue: number
): RiskMetric[] {
  const metrics: RiskMetric[] = [];
  const safeTotal = Math.max(totalValue, 1);

  // 1. Chain Concentration — highest chain as % of total
  const chainValues: Record<number, number> = {};
  for (const h of holdings) {
    chainValues[h.chainId] = (chainValues[h.chainId] ?? 0) + h.valueUsd;
  }
  const chainPcts = Object.values(chainValues).map((v) => (v / safeTotal) * 100);
  const maxChainPct = Math.max(0, ...chainPcts);
  // Score: 0% = 0 risk, 100% = 100 risk. >40% starts being HIGH territory.
  const chainScore = Math.min(100, Math.round((maxChainPct / 100) * 100));
  const chainConcLevel = maxChainPct > 60 ? "HIGH" : maxChainPct > 40 ? "MEDIUM" : "LOW";
  metrics.push({
    id: "chain-conc",
    label: "Chain Concentration",
    description: "Risk from over-allocation to a single chain",
    score: chainScore,
    level: chainConcLevel,
    detail: `Max chain: ${maxChainPct.toFixed(1)}%`,
  });

  // 2. Position Size — largest single position as % of total
  const positionValues = positions.map(
    (p) => p.currentValueUsd ?? p.entryValueUsd
  );
  const maxPositionValue = Math.max(0, ...positionValues);
  const maxPosPct = (maxPositionValue / safeTotal) * 100;
  const posScore = Math.min(100, Math.round(maxPosPct * 2.5)); // 20% = 50, 40% = 100
  const posLevel = maxPosPct > 30 ? "HIGH" : maxPosPct > 20 ? "MEDIUM" : "LOW";
  metrics.push({
    id: "pos-size",
    label: "Position Size",
    description: "Risk from a single position being too large",
    score: posScore,
    level: posLevel,
    detail: `Max position: ${maxPosPct.toFixed(1)}%`,
  });

  // 3. Drawdown Risk — based on worst PnL among open positions
  const openPositions = positions.filter((p) => p.status === "open");
  const pnls = openPositions.map((p) => {
    if (p.pnlUsd != null) return p.pnlUsd;
    if (p.currentValueUsd != null)
      return p.currentValueUsd - p.entryValueUsd;
    return 0;
  });
  const worstPnl = Math.min(0, ...pnls);
  const worstPnlPct =
    openPositions.length > 0
      ? (Math.abs(worstPnl) /
          Math.max(
            1,
            ...openPositions.map((p) => p.entryValueUsd)
          )) *
        100
      : 0;
  const drawScore = Math.min(100, Math.round(worstPnlPct * 2));
  metrics.push({
    id: "drawdown",
    label: "Drawdown Risk",
    description: "Severity of worst-performing position",
    score: drawScore,
    level: scoreToLevel(drawScore),
    detail:
      worstPnl < 0
        ? `Worst: ${formatUsd(worstPnl)}`
        : "No drawdown",
  });

  // 4. Asset Diversity — number of unique tokens
  const uniqueTokens = new Set(holdings.map((h) => h.token.toLowerCase()));
  const tokenCount = uniqueTokens.size;
  // Fewer tokens = higher risk. 1 token = 100, 2 = 80, 5 = 50, 10+ = 0
  const divScore = Math.max(0, Math.min(100, Math.round(100 - tokenCount * 10)));
  metrics.push({
    id: "diversity",
    label: "Asset Diversity",
    description: "Risk from holding too few unique assets",
    score: divScore,
    level: scoreToLevel(divScore),
    detail: `${tokenCount} unique token${tokenCount !== 1 ? "s" : ""}`,
  });

  // 5. Protocol Exposure — largest protocol/type % of total
  const typeValues: Record<string, number> = {};
  for (const h of holdings) {
    const key = h.type ?? "token";
    typeValues[key] = (typeValues[key] ?? 0) + h.valueUsd;
  }
  const typePcts = Object.values(typeValues).map(
    (v) => (v / safeTotal) * 100
  );
  const maxTypePct = Math.max(0, ...typePcts);
  const protoScore = Math.min(100, Math.round(maxTypePct * 1.25));
  const protoLevel = maxTypePct > 60 ? "HIGH" : maxTypePct > 40 ? "MEDIUM" : "LOW";
  metrics.push({
    id: "protocol",
    label: "Protocol Exposure",
    description: "Risk from over-exposure to a single protocol type",
    score: protoScore,
    level: protoLevel,
    detail: `Max type: ${maxTypePct.toFixed(1)}%`,
  });

  return metrics;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RiskHeatmap({
  holdings,
  positions,
  totalValue,
}: RiskHeatmapProps) {
  const metrics = useMemo(
    () => computeRiskMetrics(holdings, positions, totalValue),
    [holdings, positions, totalValue]
  );

  const overallScore = useMemo(() => {
    if (metrics.length === 0) return 0;
    return Math.round(
      metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length
    );
  }, [metrics]);

  const overallLevel = scoreToLevel(overallScore);

  return (
    <div className="border-2 border-border bg-surface/60">
      {/* Header */}
      <div className="border-b-2 border-crimson/30 px-4 py-3 p5-stripes flex items-center justify-between">
        <h3
          className="text-xs font-black uppercase tracking-[0.2em] text-crimson"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Risk Matrix
        </h3>
        {/* Overall score badge */}
        <div
          style={{
            transform: "skewX(-3deg)",
            backgroundColor: RISK_COLORS[overallLevel],
            padding: "1px 10px",
            boxShadow: "3px 3px 0 #0d0d0d",
          }}
        >
          <span
            style={{
              display: "block",
              transform: "skewX(3deg)",
              color: overallLevel === "MEDIUM" ? "#0d0d0d" : "#fff",
              fontSize: "9px",
              fontWeight: 900,
              letterSpacing: "0.1em",
              whiteSpace: "nowrap",
            }}
          >
            {overallLevel} &middot; {overallScore}/100
          </span>
        </div>
      </div>

      {/* Risk Grid */}
      <div className="p-4">
        <div className="grid grid-cols-5 gap-3">
          {metrics.map((metric) => (
            <div
              key={metric.id}
              className="flex flex-col items-center group"
            >
              {/* Risk cell */}
              <div
                className="relative w-full aspect-square flex items-center justify-center transition-transform hover:scale-105"
                style={{
                  backgroundColor: RISK_BG[metric.level],
                  border: `2px solid ${RISK_COLORS[metric.level]}`,
                  boxShadow: `3px 3px 0 #0d0d0d`,
                  transform: "skewX(-3deg)",
                }}
              >
                <div
                  style={{ transform: "skewX(3deg)" }}
                  className="flex flex-col items-center gap-0.5"
                >
                  {/* Score number */}
                  <span
                    style={{
                      color: RISK_COLORS[metric.level],
                      fontSize: "20px",
                      fontWeight: 900,
                      lineHeight: 1,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {metric.score}
                  </span>

                  {/* Level badge */}
                  <span
                    style={{
                      color: RISK_COLORS[metric.level],
                      fontSize: "7px",
                      fontWeight: 900,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                    }}
                  >
                    {metric.level}
                  </span>
                </div>

                {/* Animated corner accent */}
                <div
                  className="absolute top-0 left-0 w-2 h-2"
                  style={{
                    borderTop: `2px solid ${RISK_COLORS[metric.level]}`,
                    borderLeft: `2px solid ${RISK_COLORS[metric.level]}`,
                    opacity: 0.5,
                  }}
                />
                <div
                  className="absolute bottom-0 right-0 w-2 h-2"
                  style={{
                    borderBottom: `2px solid ${RISK_COLORS[metric.level]}`,
                    borderRight: `2px solid ${RISK_COLORS[metric.level]}`,
                    opacity: 0.5,
                  }}
                />
              </div>

              {/* Label below */}
              <span
                className="mt-2 text-center text-text-muted leading-tight"
                style={{
                  fontSize: "8px",
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {metric.label}
              </span>

              {/* Detail on hover */}
              <span
                className="mt-0.5 text-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  color: RISK_COLORS[metric.level],
                  fontSize: "7px",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                }}
              >
                {metric.detail}
              </span>
            </div>
          ))}
        </div>

        {/* Score bars */}
        <div className="mt-5 space-y-2">
          {metrics.map((metric) => (
            <div key={`bar-${metric.id}`} className="flex items-center gap-3">
              <span
                className="w-28 text-right text-text-muted shrink-0"
                style={{
                  fontSize: "8px",
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {metric.label}
              </span>
              <div className="flex-1 h-3 bg-[#1c1c1c] border border-border relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-700"
                  style={{
                    width: `${metric.score}%`,
                    backgroundColor: RISK_COLORS[metric.level],
                    opacity: 0.8,
                  }}
                />
                {/* Hatching overlay */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(-45deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 3px)",
                  }}
                />
              </div>
              <span
                className="w-8 text-right tabular-nums shrink-0"
                style={{
                  color: RISK_COLORS[metric.level],
                  fontSize: "9px",
                  fontWeight: 900,
                }}
              >
                {metric.score}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="border-t-2 border-crimson/30 bg-surface/90 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {(["LOW", "MEDIUM", "HIGH"] as RiskLevel[]).map((level) => (
            <div key={level} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5"
                style={{
                  backgroundColor: RISK_COLORS[level],
                  boxShadow: `0 0 4px ${RISK_COLORS[level]}44`,
                }}
              />
              <span
                className="text-text-muted"
                style={{
                  fontSize: "9px",
                  fontWeight: 900,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {level} (
                {level === "LOW" ? "0-33" : level === "MEDIUM" ? "34-66" : "67-100"}
                )
              </span>
            </div>
          ))}
        </div>

        <span
          className="text-text-muted"
          style={{
            fontSize: "8px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Score 0-100
        </span>
      </div>
    </div>
  );
}
