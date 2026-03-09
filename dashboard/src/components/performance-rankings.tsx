"use client";

import { useMemo } from "react";
import { cn, formatUsd, formatPercent } from "@/lib/utils";
import { ProtocolLogo, TokenLogo } from "@/components/logos";

interface RankedPosition {
  id: string;
  protocol: string;
  tokenSymbol: string;
  entryValueUsd: number;
  currentValueUsd?: number;
  pnlUsd?: number;
  apy?: number;
  status: string;
}

interface PerformanceRankingsProps {
  positions: RankedPosition[];
}

const MEDAL_CONFIG: Record<number, { symbol: string; color: string; label: string }> = {
  0: { symbol: "\u2605", color: "#ffd700", label: "GOLD" },
  1: { symbol: "\u2605", color: "#c0c0c0", label: "SILVER" },
  2: { symbol: "\u2605", color: "#cd7f32", label: "BRONZE" },
};

function getPerformanceScore(p: RankedPosition): number {
  const pnl = p.pnlUsd ?? (p.currentValueUsd != null ? p.currentValueUsd - p.entryValueUsd : 0);
  const pnlPct = p.entryValueUsd > 0 ? (pnl / p.entryValueUsd) * 100 : 0;
  // Weight PnL% heavily, add APY as bonus
  return pnlPct + (p.apy ?? 0) * 0.1;
}

export function PerformanceRankings({ positions }: PerformanceRankingsProps) {
  const ranked = useMemo(() => {
    return [...positions]
      .map((p) => {
        const pnl = p.pnlUsd ?? (p.currentValueUsd != null ? p.currentValueUsd - p.entryValueUsd : 0);
        const pnlPct = p.entryValueUsd > 0 ? (pnl / p.entryValueUsd) * 100 : 0;
        const score = getPerformanceScore(p);
        return { ...p, computedPnl: pnl, pnlPct, score };
      })
      .sort((a, b) => b.score - a.score);
  }, [positions]);

  const bestPerformer = ranked.length > 0 ? ranked[0] : null;

  return (
    <div className="border-2 border-border bg-surface/60">
      {/* Header */}
      <div className="border-b-2 border-crimson/30 px-4 py-3 p5-stripes">
        <h3
          className="text-xs font-black uppercase tracking-[0.2em] text-crimson"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Performance Rankings
        </h3>
      </div>

      {/* Rankings list */}
      <div className="divide-y divide-border/50">
        {ranked.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-text-muted font-bold">
            No positions to rank
          </div>
        ) : (
          ranked.map((p, i) => {
            const medal = MEDAL_CONFIG[i];
            const isActive = p.status === "open";
            const pnlPositive = p.computedPnl >= 0;

            return (
              <div
                key={p.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 transition-colors p5-shimmer",
                  isActive
                    ? "hover:bg-crimson/5"
                    : "opacity-50 hover:opacity-70",
                  i === 0 && "bg-gold/[0.03]"
                )}
              >
                {/* Rank */}
                <div className="flex w-8 shrink-0 items-center justify-center">
                  {medal ? (
                    <span
                      className="text-lg font-black leading-none"
                      style={{ color: medal.color }}
                      title={medal.label}
                    >
                      {medal.symbol}
                    </span>
                  ) : (
                    <span
                      className="text-sm font-black text-text-muted tabular-nums"
                      style={{
                        transform: "skewX(-3deg)",
                        display: "inline-block",
                      }}
                    >
                      #{i + 1}
                    </span>
                  )}
                </div>

                {/* Protocol + Token */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <TokenLogo symbol={p.tokenSymbol} size={18} />
                    <span className="text-sm font-bold text-text truncate">
                      {p.tokenSymbol}
                    </span>
                    <ProtocolLogo protocol={p.protocol} size={16} />
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-1.5 py-0.5 bg-surface-light"
                      style={{ transform: "skewX(-3deg)", display: "inline-block" }}
                    >
                      <span style={{ transform: "skewX(3deg)", display: "inline-block" }}>
                        {p.protocol}
                      </span>
                    </span>
                    {!isActive && (
                      <span
                        className="text-[9px] font-black uppercase tracking-wider text-text-muted px-1.5 py-0.5 border border-border"
                        style={{ transform: "skewX(-3deg)", display: "inline-block" }}
                      >
                        <span style={{ transform: "skewX(3deg)", display: "inline-block" }}>
                          {p.status.replace("_", " ")}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* PnL amount */}
                <div className="text-right shrink-0">
                  <span
                    className={cn(
                      "text-sm font-bold tabular-nums",
                      pnlPositive ? "text-status-correct" : "text-crimson"
                    )}
                  >
                    {pnlPositive ? "+" : ""}
                    {formatUsd(p.computedPnl)}
                  </span>
                </div>

                {/* PnL % */}
                <div className="w-16 text-right shrink-0">
                  <span
                    className={cn(
                      "text-xs font-black tabular-nums",
                      pnlPositive ? "text-status-correct" : "text-crimson"
                    )}
                  >
                    {formatPercent(p.pnlPct)}
                  </span>
                </div>

                {/* APY */}
                <div className="w-14 text-right shrink-0">
                  {p.apy != null ? (
                    <span className="text-xs font-bold tabular-nums text-text-muted">
                      {p.apy.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-xs text-text-muted">&mdash;</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom summary */}
      {bestPerformer && (
        <div className="border-t-2 border-crimson/30 bg-surface/90 px-4 py-2.5 p5-stripes">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted">
              Best performer:
            </span>
            <span
              className="text-xs font-black uppercase tracking-wider text-gold"
              style={{
                transform: "skewX(-3deg)",
                display: "inline-block",
                textShadow: "0 0 8px rgba(255, 215, 0, 0.3)",
              }}
            >
              <span style={{ transform: "skewX(3deg)", display: "inline-block" }}>
                {bestPerformer.tokenSymbol} ({bestPerformer.protocol})
              </span>
            </span>
            <span className="ml-auto text-xs font-black text-gold tabular-nums">
              {formatPercent(bestPerformer.pnlPct)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
