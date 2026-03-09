"use client";

import { useMemo } from "react";
import { ChainLogo } from "@/components/logos";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GasDataEntry {
  chainId: number;
  gwei: number;
  status: "low" | "medium" | "high";
}

interface ChainEntry {
  chainId: number;
  name: string;
}

interface GasTrackerProps {
  chains?: ChainEntry[];
  gasData?: GasDataEntry[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_CHAINS: ChainEntry[] = [
  { chainId: 42161, name: "Arbitrum" },
  { chainId: 8453, name: "Base" },
  { chainId: 10, name: "Optimism" },
];

const CHAIN_COLORS: Record<number, string> = {
  42161: "#2d374b",
  8453: "#0052ff",
  10: "#ff0420",
};

const STATUS_META: Record<
  "low" | "medium" | "high",
  { color: string; label: string; barPct: number }
> = {
  low: { color: "#22c55e", label: "LOW", barPct: 30 },
  medium: { color: "#ffd700", label: "MODERATE", barPct: 60 },
  high: { color: "#e63946", label: "CONGESTED", barPct: 90 },
};

// Simulated gas data when no real data provided
const SIMULATED_GAS: Record<number, GasDataEntry> = {
  42161: { chainId: 42161, gwei: 0.1, status: "low" },
  8453: { chainId: 8453, gwei: 0.05, status: "low" },
  10: { chainId: 10, gwei: 0.25, status: "low" },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GasTracker({ chains, gasData }: GasTrackerProps) {
  const activeChains = chains ?? DEFAULT_CHAINS;

  const gasEntries = useMemo(() => {
    if (gasData && gasData.length > 0) {
      const map = new Map(gasData.map((g) => [g.chainId, g]));
      return activeChains.map((chain) => ({
        chain,
        gas: map.get(chain.chainId) ?? SIMULATED_GAS[chain.chainId] ?? {
          chainId: chain.chainId,
          gwei: 0.1,
          status: "low" as const,
        },
        simulated: !map.has(chain.chainId),
      }));
    }
    return activeChains.map((chain) => ({
      chain,
      gas: SIMULATED_GAS[chain.chainId] ?? {
        chainId: chain.chainId,
        gwei: 0.1,
        status: "low" as const,
      },
      simulated: true,
    }));
  }, [activeChains, gasData]);

  const isSimulated = gasEntries.every((e) => e.simulated);

  return (
    <div className="border-2 border-border bg-surface/60">
      {/* Header */}
      <div className="border-b-2 border-crimson/30 px-4 py-3 p5-stripes flex items-center justify-between">
        <h3
          className="text-xs font-black uppercase tracking-[0.2em] text-crimson"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Gas Conditions
        </h3>
        {/* Live indicator */}
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full animate-pulse-glow"
              style={{ backgroundColor: isSimulated ? "#8a8578" : "#22c55e" }}
            />
            <span
              className="relative inline-flex h-2 w-2"
              style={{ backgroundColor: isSimulated ? "#8a8578" : "#22c55e" }}
            />
          </span>
          <span
            className="text-text-muted"
            style={{
              fontSize: "8px",
              fontWeight: 900,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            {isSimulated ? "Simulated" : "Live"}
          </span>
        </div>
      </div>

      {/* Gas indicators */}
      <div className="p-4 space-y-4">
        {gasEntries.map(({ chain, gas }) => {
          const chainColor = CHAIN_COLORS[chain.chainId] ?? "#6b7280";
          const statusMeta = STATUS_META[gas.status];

          return (
            <div key={chain.chainId} className="group">
              {/* Top row: chain name + gwei + status */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {/* Chain logo */}
                  <ChainLogo chainId={chain.chainId} size={16} />
                  <span
                    className="text-text font-black uppercase"
                    style={{
                      fontSize: "11px",
                      letterSpacing: "0.12em",
                    }}
                  >
                    {chain.name}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Gwei value */}
                  <span
                    className="text-text-muted tabular-nums"
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                    }}
                  >
                    {gas.gwei < 1
                      ? `${gas.gwei.toFixed(3)} Gwei`
                      : `${gas.gwei.toFixed(1)} Gwei`}
                  </span>

                  {/* Status badge */}
                  <div
                    style={{
                      transform: "skewX(-3deg)",
                      backgroundColor: statusMeta.color,
                      padding: "0px 8px",
                      boxShadow: "2px 2px 0 #0d0d0d",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        transform: "skewX(3deg)",
                        color:
                          gas.status === "medium" ? "#0d0d0d" : "#fff",
                        fontSize: "8px",
                        fontWeight: 900,
                        letterSpacing: "0.12em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {statusMeta.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Gas bar */}
              <div
                className="relative h-4 bg-[#1c1c1c] border border-border overflow-hidden"
                style={{ boxShadow: "inset 0 1px 3px rgba(0,0,0,0.4)" }}
              >
                {/* Fill bar */}
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-1000"
                  style={{
                    width: `${statusMeta.barPct}%`,
                    background: `linear-gradient(90deg, ${chainColor}, ${statusMeta.color})`,
                  }}
                >
                  {/* Pulse animation overlay */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)`,
                      backgroundSize: "200% 100%",
                      animation: "gasShimmer 2.5s ease-in-out infinite",
                    }}
                  />
                </div>

                {/* Hatching overlay */}
                <div
                  className="absolute inset-0 opacity-15"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(-45deg, transparent, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 3px)",
                  }}
                />

                {/* Threshold markers */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-text-muted/20"
                  style={{ left: "33%" }}
                />
                <div
                  className="absolute top-0 bottom-0 w-px bg-text-muted/20"
                  style={{ left: "66%" }}
                />
              </div>
            </div>
          );
        })}

        {/* Scale labels */}
        <div className="flex items-center justify-between mt-1 px-0.5">
          <span
            className="text-text-muted"
            style={{
              fontSize: "7px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Cheap
          </span>
          <span
            className="text-text-muted"
            style={{
              fontSize: "7px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Moderate
          </span>
          <span
            className="text-text-muted"
            style={{
              fontSize: "7px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Expensive
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-crimson/30 bg-surface/90 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {(["low", "medium", "high"] as const).map((status) => (
            <div key={status} className="flex items-center gap-1">
              <span
                className="inline-block h-2 w-2"
                style={{ backgroundColor: STATUS_META[status].color }}
              />
              <span
                className="text-text-muted"
                style={{
                  fontSize: "8px",
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {STATUS_META[status].label}
              </span>
            </div>
          ))}
        </div>

        {isSimulated && (
          <span
            style={{
              color: "#8a8578",
              fontSize: "7px",
              fontWeight: 900,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              border: "1px solid #2a2a2a",
              padding: "1px 6px",
            }}
          >
            Data Simulated
          </span>
        )}
      </div>

      {/* Inline keyframes for the gas bar shimmer */}
      <style jsx>{`
        @keyframes gasShimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
}
