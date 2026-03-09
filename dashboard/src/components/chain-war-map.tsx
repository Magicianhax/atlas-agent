"use client";

import { useMemo } from "react";
import { formatUsd } from "@/lib/utils";
import { ChainLogo } from "@/components/logos";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHAIN_META: Record<
  number,
  { name: string; color: string; abbr: string }
> = {
  42161: { name: "Arbitrum", color: "#2d374b", abbr: "ARB" },
  8453: { name: "Base", color: "#0052ff", abbr: "BASE" },
  10: { name: "Optimism", color: "#ff0420", abbr: "OP" },
};

const VB_W = 640;
const VB_H = 480;

// Triangle positions: Arbitrum top-left, Base top-right, Optimism bottom-center
const CHAIN_POSITIONS: Record<number, { cx: number; cy: number }> = {
  42161: { cx: 160, cy: 130 },
  8453: { cx: 480, cy: 130 },
  10: { cx: 320, cy: 390 },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Holding {
  chainId: number;
  valueUsd: number;
  token: string;
}

interface Transaction {
  fromChainId: number;
  toChainId: number;
  valueUsd: number;
  timestamp: string;
}

interface ChainWarMapProps {
  holdings: Holding[];
  transactions?: Transaction[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate angular hexagon points for SVG polygon */
function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    // Rotate by -90deg so the flat edge is on top (pointy-top hex)
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ");
}

/** Build a curved SVG path between two points for bridge arrows */
function bridgePath(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  // Perpendicular offset for curve
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = -dy / len;
  const ny = dx / len;
  const offset = len * 0.15;
  const cpx = mx + nx * offset;
  const cpy = my + ny * offset;
  return `M${x1},${y1} Q${cpx},${cpy} ${x2},${y2}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChainWarMap({ holdings, transactions }: ChainWarMapProps) {
  // Aggregate holdings per chain
  const chainStats = useMemo(() => {
    const map: Record<number, { value: number; count: number }> = {};
    for (const h of holdings) {
      if (!map[h.chainId]) map[h.chainId] = { value: 0, count: 0 };
      map[h.chainId].value += h.valueUsd;
      map[h.chainId].count += 1;
    }
    return map;
  }, [holdings]);

  const totalValue = useMemo(
    () => Object.values(chainStats).reduce((s, c) => s + c.value, 0),
    [chainStats]
  );

  const maxValue = useMemo(
    () => Math.max(1, ...Object.values(chainStats).map((c) => c.value)),
    [chainStats]
  );

  // Dedupe bridge transactions (group by from→to)
  const bridges = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    const grouped: Record<
      string,
      { from: number; to: number; total: number; count: number }
    > = {};
    for (const tx of transactions) {
      const key = `${tx.fromChainId}-${tx.toChainId}`;
      if (!grouped[key]) {
        grouped[key] = {
          from: tx.fromChainId,
          to: tx.toChainId,
          total: 0,
          count: 0,
        };
      }
      grouped[key].total += tx.valueUsd;
      grouped[key].count += 1;
    }
    return Object.values(grouped);
  }, [transactions]);

  return (
    <div className="border-2 border-border bg-surface/60">
      {/* Header */}
      <div className="border-b-2 border-crimson/30 px-4 py-3 p5-stripes">
        <h3
          className="text-xs font-black uppercase tracking-[0.2em] text-crimson"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Cross-Chain War Map
        </h3>
      </div>

      {/* SVG Map */}
      <div className="p-4">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="w-full max-w-[640px] mx-auto block"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Tactical grid pattern */}
            <pattern
              id="warGrid"
              x="0"
              y="0"
              width="30"
              height="30"
              patternUnits="userSpaceOnUse"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="30"
                stroke="#e63946"
                strokeWidth="0.3"
                opacity="0.08"
              />
              <line
                x1="0"
                y1="0"
                x2="30"
                y2="0"
                stroke="#e63946"
                strokeWidth="0.3"
                opacity="0.08"
              />
            </pattern>

            {/* Diagonal hatching */}
            <pattern
              id="warHatch"
              x="0"
              y="0"
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(-45)"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="8"
                stroke="#e63946"
                strokeWidth="0.5"
                opacity="0.04"
              />
            </pattern>

            {/* Glow filters per chain */}
            {Object.entries(CHAIN_META).map(([id, meta]) => (
              <filter
                key={`glow-${id}`}
                id={`chainGlow${id}`}
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feFlood floodColor={meta.color} floodOpacity="0.3" />
                <feComposite in2="blur" operator="in" />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            ))}

            {/* Arrowhead marker */}
            <marker
              id="warArrow"
              viewBox="0 0 10 8"
              refX="8"
              refY="4"
              markerWidth="8"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,4 L0,8 Z" fill="#ffd700" opacity="0.7" />
            </marker>
          </defs>

          {/* Background layers */}
          <rect
            width={VB_W}
            height={VB_H}
            fill="url(#warGrid)"
          />
          <rect
            width={VB_W}
            height={VB_H}
            fill="url(#warHatch)"
          />

          {/* Outer border ring (tactical) */}
          <rect
            x="15"
            y="15"
            width={VB_W - 30}
            height={VB_H - 30}
            fill="none"
            stroke="#e63946"
            strokeWidth="0.5"
            opacity="0.15"
            strokeDasharray="12 4"
          />

          {/* Crosshair lines connecting chain centers */}
          {[
            [42161, 8453],
            [8453, 10],
            [10, 42161],
          ].map(([a, b], i) => {
            const pa = CHAIN_POSITIONS[a];
            const pb = CHAIN_POSITIONS[b];
            return (
              <line
                key={`axis-${i}`}
                x1={pa.cx}
                y1={pa.cy}
                x2={pb.cx}
                y2={pb.cy}
                stroke="#e63946"
                strokeWidth="0.5"
                opacity="0.08"
                strokeDasharray="4 8"
              />
            );
          })}

          {/* Chain territories */}
          {Object.entries(CHAIN_POSITIONS).map(([chainIdStr, pos]) => {
            const chainId = Number(chainIdStr);
            const meta = CHAIN_META[chainId];
            if (!meta) return null;

            const stats = chainStats[chainId];
            const value = stats?.value ?? 0;
            const count = stats?.count ?? 0;
            const pct = totalValue > 0 ? (value / totalValue) * 100 : 0;
            // Scale hex size proportional to value (min 45, max 85)
            const ratio = maxValue > 0 ? value / maxValue : 0;
            const hexR = 45 + ratio * 40;

            return (
              <g key={chainId}>
                {/* Glow ring */}
                <circle
                  cx={pos.cx}
                  cy={pos.cy}
                  r={hexR + 15}
                  fill="none"
                  stroke={meta.color}
                  strokeWidth="0.8"
                  opacity="0.1"
                  strokeDasharray="6 6"
                >
                  <animate
                    attributeName="opacity"
                    values="0.05;0.15;0.05"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Hex territory */}
                <polygon
                  points={hexPoints(pos.cx, pos.cy, hexR)}
                  fill={meta.color}
                  fillOpacity="0.15"
                  stroke={meta.color}
                  strokeWidth="2"
                  opacity="0.9"
                  filter={`url(#chainGlow${chainId})`}
                />

                {/* Inner hex accent */}
                <polygon
                  points={hexPoints(pos.cx, pos.cy, hexR * 0.6)}
                  fill="none"
                  stroke={meta.color}
                  strokeWidth="0.5"
                  opacity="0.2"
                  strokeDasharray="3 3"
                />

                {/* Chain name label */}
                <foreignObject
                  x={pos.cx - 55}
                  y={pos.cy - 48}
                  width={110}
                  height={100}
                  overflow="visible"
                >
                  <div className="flex flex-col items-center">
                    {/* Chain logo */}
                    <ChainLogo chainId={chainId} size={24} />
                    {/* Name badge */}
                    <div
                      style={{
                        transform: "skewX(-3deg)",
                        backgroundColor: meta.color,
                        padding: "1px 10px",
                        boxShadow: "3px 3px 0 #0d0d0d",
                        marginTop: "4px",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          transform: "skewX(3deg)",
                          color: "#fff",
                          fontSize: "10px",
                          fontWeight: 900,
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {meta.name}
                      </span>
                    </div>

                    {/* Value */}
                    <span
                      style={{
                        color: "#f5f0e8",
                        fontSize: "13px",
                        fontWeight: 900,
                        marginTop: "4px",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {formatUsd(value)}
                    </span>

                    {/* Holdings count + pct */}
                    <span
                      style={{
                        color: "#8a8578",
                        fontSize: "8px",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        marginTop: "1px",
                      }}
                    >
                      {count} HOLDINGS &middot; {pct.toFixed(1)}%
                    </span>
                  </div>
                </foreignObject>
              </g>
            );
          })}

          {/* Bridge paths */}
          {bridges.map((bridge, i) => {
            const fromPos = CHAIN_POSITIONS[bridge.from];
            const toPos = CHAIN_POSITIONS[bridge.to];
            if (!fromPos || !toPos) return null;

            const fromMeta = CHAIN_META[bridge.from];
            const path = bridgePath(
              fromPos.cx,
              fromPos.cy,
              toPos.cx,
              toPos.cy
            );
            const pathId = `bridge-${bridge.from}-${bridge.to}`;

            return (
              <g key={pathId}>
                {/* Bridge path line */}
                <path
                  id={pathId}
                  d={path}
                  fill="none"
                  stroke="#ffd700"
                  strokeWidth="1.5"
                  opacity="0.35"
                  strokeDasharray="6 4"
                  markerEnd="url(#warArrow)"
                />

                {/* Animated pulse dot traveling along the bridge */}
                <circle r="4" fill="#ffd700" opacity="0">
                  <animateMotion
                    dur={`${2.5 + i * 0.5}s`}
                    repeatCount="indefinite"
                    path={path}
                    rotate="auto"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;0.9;0.9;0"
                    dur={`${2.5 + i * 0.5}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="r"
                    values="2;4;2"
                    dur={`${2.5 + i * 0.5}s`}
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Second pulse dot offset */}
                <circle r="3" fill={fromMeta?.color ?? "#ffd700"} opacity="0">
                  <animateMotion
                    dur={`${2.5 + i * 0.5}s`}
                    repeatCount="indefinite"
                    path={path}
                    rotate="auto"
                    begin={`${1.25 + i * 0.25}s`}
                  />
                  <animate
                    attributeName="opacity"
                    values="0;0.7;0.7;0"
                    dur={`${2.5 + i * 0.5}s`}
                    repeatCount="indefinite"
                    begin={`${1.25 + i * 0.25}s`}
                  />
                </circle>

                {/* Bridge value label */}
                <foreignObject
                  x={(fromPos.cx + toPos.cx) / 2 - 40}
                  y={(fromPos.cy + toPos.cy) / 2 - 14}
                  width={80}
                  height={28}
                  overflow="visible"
                >
                  <div className="flex justify-center">
                    <span
                      style={{
                        backgroundColor: "#0d0d0d",
                        border: "1px solid #ffd700",
                        padding: "1px 6px",
                        color: "#ffd700",
                        fontSize: "8px",
                        fontWeight: 900,
                        letterSpacing: "0.05em",
                        whiteSpace: "nowrap",
                        transform: "skewX(-3deg)",
                        display: "inline-block",
                      }}
                    >
                      <span style={{ transform: "skewX(3deg)", display: "block" }}>
                        {formatUsd(bridge.total)} &times;{bridge.count}
                      </span>
                    </span>
                  </div>
                </foreignObject>
              </g>
            );
          })}

          {/* Center title */}
          <foreignObject
            x={VB_W / 2 - 60}
            y={VB_H / 2 - 30}
            width={120}
            height={60}
            overflow="visible"
          >
            <div className="flex flex-col items-center">
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  backgroundColor: "#e63946",
                  transform: "rotate(45deg)",
                }}
              />
              <span
                style={{
                  color: "#8a8578",
                  fontSize: "7px",
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  marginTop: "3px",
                }}
              >
                Total
              </span>
              <span
                style={{
                  color: "#ffd700",
                  fontSize: "12px",
                  fontWeight: 900,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatUsd(totalValue)}
              </span>
            </div>
          </foreignObject>

          {/* Corner decorations */}
          {[
            { x: 20, y: 20 },
            { x: VB_W - 20, y: 20 },
            { x: 20, y: VB_H - 20 },
            { x: VB_W - 20, y: VB_H - 20 },
          ].map((corner, i) => (
            <g key={`corner-${i}`}>
              <line
                x1={corner.x}
                y1={corner.y}
                x2={corner.x + (i % 2 === 0 ? 15 : -15)}
                y2={corner.y}
                stroke="#e63946"
                strokeWidth="1"
                opacity="0.3"
              />
              <line
                x1={corner.x}
                y1={corner.y}
                x2={corner.x}
                y2={corner.y + (i < 2 ? 15 : -15)}
                stroke="#e63946"
                strokeWidth="1"
                opacity="0.3"
              />
            </g>
          ))}
        </svg>
      </div>

      {/* Bottom status bar */}
      <div className="border-t-2 border-crimson/30 bg-surface/90 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full bg-crimson animate-pulse-glow" />
            <span className="relative inline-flex h-2 w-2 bg-crimson" />
          </span>
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
            Territory Map
          </span>
        </div>

        <div className="flex items-center gap-3">
          {Object.entries(CHAIN_META).map(([id, meta]) => (
            <div key={id} className="flex items-center gap-1">
              <ChainLogo chainId={Number(id)} size={14} />
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">
                {meta.abbr}
              </span>
            </div>
          ))}
        </div>

        {bridges.length > 0 && (
          <span className="text-[9px] font-bold text-gold uppercase tracking-wider">
            {bridges.length} Bridge{bridges.length !== 1 ? "s" : ""} Active
          </span>
        )}
      </div>
    </div>
  );
}
