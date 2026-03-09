"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface DrawdownIndicatorProps {
  currentValue: number;
  peakValue: number;
}

export function DrawdownIndicator({ currentValue, peakValue }: DrawdownIndicatorProps) {
  const { drawdownPct, fillPct, color, isATH, isCritical } = useMemo(() => {
    const isAtPeak = currentValue >= peakValue;
    const dd = peakValue > 0 ? ((currentValue - peakValue) / peakValue) * 100 : 0;
    // Fill: 100% at 0% drawdown, 0% at -25% or worse
    const fill = Math.max(0, Math.min(100, ((dd + 25) / 25) * 100));

    let c: string;
    if (isAtPeak) {
      c = "#22c55e"; // green — at ATH
    } else if (dd >= -10) {
      c = "#ffd700"; // gold — mild drawdown
    } else {
      c = "#e63946"; // crimson — severe drawdown
    }

    return {
      drawdownPct: dd,
      fillPct: isAtPeak ? 100 : fill,
      color: c,
      isATH: isAtPeak,
      isCritical: dd < -10,
    };
  }, [currentValue, peakValue]);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2",
        isCritical && "animate-pulse-glow"
      )}
      style={{ width: "100px" }}
      title={
        isATH
          ? "At all-time high"
          : `Drawdown: ${drawdownPct.toFixed(1)}% from peak`
      }
    >
      {/* Bar */}
      <div
        className="relative h-2.5 flex-1 bg-surface-light overflow-hidden"
        style={{
          border: `1px solid ${color}33`,
          boxShadow: isCritical ? `0 0 6px ${color}44` : "none",
        }}
      >
        <div
          className="absolute left-0 top-0 h-full"
          style={{
            width: `${fillPct}%`,
            backgroundColor: color,
            opacity: 0.85,
            transition: "width 0.6s ease-out, background-color 0.3s ease",
          }}
        />
        {/* P5 diagonal micro-stripes inside bar */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 2px,
              rgba(0,0,0,0.15) 2px,
              rgba(0,0,0,0.15) 3px
            )`,
          }}
        />
      </div>

      {/* Label */}
      {isATH ? (
        <span
          className="text-[10px] font-black uppercase tracking-wider shrink-0"
          style={{
            color: "#ffd700",
            transform: "skewX(-3deg)",
            display: "inline-block",
            textShadow: "0 0 6px rgba(255, 215, 0, 0.4)",
          }}
        >
          <span style={{ transform: "skewX(3deg)", display: "inline-block" }}>
            ATH
          </span>
        </span>
      ) : (
        <span
          className={cn(
            "text-[10px] font-black tabular-nums shrink-0",
            isCritical && "animate-pulse-glow"
          )}
          style={{ color }}
        >
          {drawdownPct.toFixed(1)}%
        </span>
      )}
    </div>
  );
}
