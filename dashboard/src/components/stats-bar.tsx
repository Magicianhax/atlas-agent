"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { cn, formatUsd, formatPercent } from "@/lib/utils";
import { useStats, useLivePortfolio } from "@/hooks/use-sse";

interface Stats {
  portfolioValueUsd: number;
  pnlTotal: number;
  predictionAccuracy: number;
  activePredictions: number;
  totalTradesExecuted: number;
  totalDecisions: number;
}

interface PortfolioSnapshot {
  id: string;
  timestamp: string;
  totalValueUsd: number;
  pnlTotal: number | null;
}

// ---------------------------------------------------------------------------
// Sparkline — pure inline SVG, no external deps
// ---------------------------------------------------------------------------

function Sparkline({
  data,
  color,
  width = 60,
  height = 16,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // avoid division by zero if all values equal

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    // Invert y so higher values go up; add 1px padding top/bottom
    const y = height - 1 - ((v - min) / range) * (height - 2);
    return { x, y };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  // Closed path for the gradient fill area
  const fillD = `${pathD} L${width},${height} L0,${height} Z`;

  const gradientId = `spark-grad-${color.replace("#", "")}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="block"
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#${gradientId})`} />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// StatBox — with optional sparkline and trend arrow
// ---------------------------------------------------------------------------

function StatBox({
  label,
  value,
  accent,
  sparkData,
  sparkColor,
  trendArrow,
}: {
  label: string;
  value: string;
  accent?: string;
  sparkData?: number[];
  sparkColor?: string;
  trendArrow?: { direction: "up" | "down"; color: string } | null;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-4 py-1.5 relative">
      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-muted">
        {label}
      </span>
      <span
        className={cn(
          "text-sm font-black tabular-nums tracking-wide inline-flex items-center gap-0.5",
          accent ?? "text-text"
        )}
      >
        {value}
        {trendArrow && (
          <span
            className="text-[10px] leading-none"
            style={{ color: trendArrow.color }}
          >
            {trendArrow.direction === "up" ? "\u25B2" : "\u25BC"}
          </span>
        )}
      </span>
      {sparkData && sparkData.length >= 2 && sparkColor && (
        <Sparkline data={sparkData} color={sparkColor} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// useSnapshotSparklines — fetch last 10 portfolio snapshots for sparkline data
// ---------------------------------------------------------------------------

function useSnapshotSparklines() {
  const [treasuryData, setTreasuryData] = useState<number[]>([]);
  const [pnlData, setPnlData] = useState<number[]>([]);

  const fetchSnapshots = useCallback(async () => {
    try {
      const res = await fetch("/api/portfolio");
      if (!res.ok) return;
      const snapshots: PortfolioSnapshot[] = await res.json();

      // API returns newest first — take last 10, then reverse to chronological order
      const recent = snapshots.slice(0, 10).reverse();

      if (recent.length >= 2) {
        setTreasuryData(recent.map((s) => s.totalValueUsd));
        setPnlData(
          recent
            .filter((s) => s.pnlTotal != null)
            .map((s) => s.pnlTotal as number)
        );
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchSnapshots();
    // Refresh every 60s to keep sparklines current
    const interval = setInterval(fetchSnapshots, 60_000);
    return () => clearInterval(interval);
  }, [fetchSnapshots]);

  return { treasuryData, pnlData };
}

// ---------------------------------------------------------------------------
// StatsBar
// ---------------------------------------------------------------------------

export function StatsBar() {
  const raw = useStats();
  const stats = raw as Stats | null;
  const livePortfolio = useLivePortfolio() as { totalValueUsd: number } | null;
  const { treasuryData, pnlData } = useSnapshotSparklines();

  // Determine P&L trend arrow from sparkline data
  const pnlTrend = useMemo(() => {
    if (pnlData.length < 2) return null;
    const latest = pnlData[pnlData.length - 1];
    const previous = pnlData[pnlData.length - 2];
    if (latest === previous) return null;
    return {
      direction: latest > previous ? ("up" as const) : ("down" as const),
      color: latest > previous ? "#22c55e" : "#e63946",
    };
  }, [pnlData]);

  // Determine P&L sparkline color based on overall trend
  const pnlSparkColor = useMemo(() => {
    if (pnlData.length < 2) return "#22c55e";
    return pnlData[pnlData.length - 1] >= pnlData[0] ? "#22c55e" : "#e63946";
  }, [pnlData]);

  if (!stats) {
    return (
      <div className="border-b-2 border-crimson/30 bg-surface/80">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-6 px-4 py-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-4 w-24 bg-surface-light"
              style={{
                clipPath: "polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)",
                animation: `statsBarPulse 1.5s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
          <style jsx>{`
            @keyframes statsBarPulse {
              0%, 100% { opacity: 0.15; }
              50% { opacity: 0.5; background-color: rgba(230, 57, 70, 0.1); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  const displayValue = livePortfolio?.totalValueUsd ?? stats.portfolioValueUsd;
  const pnlPositive = stats.pnlTotal >= 0;

  return (
    <div className="border-b-2 border-crimson/30 bg-surface/80 p5-stripes">
      <div className="mx-auto max-w-7xl overflow-x-auto px-4">
        <div className="flex items-center justify-center min-w-max divide-x divide-border">
          <StatBox
            label="Treasury"
            value={formatUsd(displayValue)}
            accent="text-gold"
            sparkData={treasuryData.length >= 2 ? treasuryData : undefined}
            sparkColor="#ffd700"
          />
          <StatBox
            label="P&L"
            value={`${pnlPositive ? "+" : ""}${formatUsd(stats.pnlTotal)}`}
            accent={pnlPositive ? "text-status-correct" : "text-crimson"}
            sparkData={pnlData.length >= 2 ? pnlData : undefined}
            sparkColor={pnlSparkColor}
            trendArrow={pnlTrend}
          />
          <StatBox
            label="Accuracy"
            value={formatPercent(stats.predictionAccuracy, false)}
          />
          <StatBox
            label="Active"
            value={String(stats.activePredictions)}
            accent="text-gold"
          />
          <StatBox
            label="Decisions"
            value={String(stats.totalDecisions)}
            accent="text-crimson-glow"
          />
        </div>
      </div>
    </div>
  );
}
