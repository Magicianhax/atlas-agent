"use client";

import { useMemo } from "react";
import { cn, formatUsd } from "@/lib/utils";
import { ChainLogo, TokenLogo, ProtocolLogo } from "@/components/logos";

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

const TYPE_BADGES: Record<string, { label: string; color: string }> = {
  vault: { label: "VAULT", color: "text-phase-predict" },
  pt: { label: "PT", color: "text-crimson" },
  yt: { label: "YT", color: "text-gold" },
  lp: { label: "LP", color: "text-phase-research" },
  momentum: { label: "GROWTH", color: "text-crimson-glow" },
  alt: { label: "ALT", color: "text-phase-research" },
  meme: { label: "MEME", color: "text-crimson-glow" },
};

const STATUS_COLORS: Record<string, string> = {
  open: "text-status-correct",
  closed: "text-text-muted",
  stopped_out: "text-crimson",
};

interface Position {
  id: string;
  openedAt: string;
  closedAt?: string;
  type: string;
  protocol: string;
  chainId: number;
  tokenAddress: string;
  tokenSymbol: string;
  amount: string;
  entryValueUsd: number;
  currentValueUsd?: number;
  entryPrice?: number;
  stopLossPrice?: number;
  apy?: number;
  maturity?: string;
  status: string;
  pnlUsd?: number;
  decisionId?: string;
  metadata?: Record<string, unknown>;
}

interface PositionsTableProps {
  positions: Position[];
}

export function PositionsTable({ positions }: PositionsTableProps) {
  const sorted = useMemo(
    () =>
      [...positions]
        .filter((p) => p.status === "open")
        .sort((a, b) => (b.currentValueUsd ?? b.entryValueUsd) - (a.currentValueUsd ?? a.entryValueUsd)),
    [positions]
  );

  if (sorted.length === 0) {
    return (
      <div className="border-2 border-dashed border-crimson/20 bg-surface/60 p-6 text-center text-sm text-text-muted font-bold">
        No active positions — inventory empty
      </div>
    );
  }

  return (
    <div className="border-2 border-border bg-surface/60">
      <div className="border-b-2 border-crimson/30 px-4 py-3 p5-stripes">
        <h3
          className="text-xs font-black uppercase tracking-[0.2em] text-crimson"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Active Positions
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-border text-left text-[10px] uppercase tracking-wider text-text-muted font-bold">
              <th className="px-4 py-2.5">Chain</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">Token</th>
              <th className="px-4 py-2.5">Protocol</th>
              <th className="px-4 py-2.5 text-right">Entry</th>
              <th className="px-4 py-2.5 text-right">Current</th>
              <th className="px-4 py-2.5 text-right">P&L</th>
              <th className="px-4 py-2.5 text-right">APY</th>
              <th className="px-4 py-2.5 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => {
              const chainName = CHAIN_NAMES[p.chainId] ?? `Chain ${p.chainId}`;
              const chainColor = CHAIN_COLORS[p.chainId] ?? "#6b7280";
              const badge = TYPE_BADGES[p.type] ?? {
                label: p.type.toUpperCase(),
                color: "text-text-muted",
              };
              const statusColor = STATUS_COLORS[p.status] ?? "text-text-muted";
              const pnl = p.pnlUsd ?? (p.currentValueUsd != null ? p.currentValueUsd - p.entryValueUsd : null);
              const currentVal = p.currentValueUsd ?? p.entryValueUsd;

              return (
                <tr
                  key={p.id}
                  className={cn(
                    "border-b border-border/50 transition-colors hover:bg-crimson/5 p5-shimmer",
                    i === sorted.length - 1 && "border-b-0"
                  )}
                >
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-2">
                      <ChainLogo chainId={p.chainId} size={18} />
                      <span className="text-text-muted">{chainName}</span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={cn("text-xs font-black uppercase", badge.color)}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-bold text-text">
                    <span className="flex items-center gap-2">
                      <TokenLogo symbol={p.tokenSymbol} size={18} />
                      <span>{p.tokenSymbol}</span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-text-muted capitalize">
                    <span className="flex items-center gap-2">
                      <ProtocolLogo protocol={p.protocol} size={16} />
                      <span>{p.protocol}</span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-text-muted">
                    {formatUsd(p.entryValueUsd)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-text">
                    {formatUsd(currentVal)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-2.5 text-right font-bold",
                      pnl != null && pnl >= 0
                        ? "text-status-correct"
                        : "text-crimson"
                    )}
                  >
                    {pnl != null
                      ? `${pnl >= 0 ? "+" : ""}${formatUsd(pnl)}`
                      : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right text-text-muted">
                    {p.apy != null ? `${p.apy.toFixed(1)}%` : "—"}
                  </td>
                  <td className={cn("px-4 py-2.5 text-right text-xs uppercase font-black", statusColor)}>
                    {p.status.replace("_", " ")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
