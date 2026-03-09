"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { AgentMood } from "@/components/agent-mood";
import { Particles } from "@/components/particles";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Decision {
  phase: string;
  timestamp: string;
}

interface BrainHeroProps {
  decisions: Decision[];
  pnlTotal?: number;
}

// ---------------------------------------------------------------------------
// All coordinates in SVG viewBox units (600 x 380)
// ViewBox matches approximate rendered pixel size so fonts render at 1:1.
// Lines and nodes share the SAME coordinate system — alignment guaranteed.
// ---------------------------------------------------------------------------

const VB_W = 600;
const VB_H = 380;
const CX = VB_W / 2; // 300 — center X
const CY = 185; // center Y (slightly above middle)

// Phase node positions — hexagonal ring
const PHASES = [
  { id: "RESEARCH", label: "Research", color: "#4a9eff", cx: 300, cy: 35 },
  { id: "ORIENT",   label: "Orient",   color: "#e63946", cx: 510, cy: 108 },
  { id: "THESIS",   label: "Thesis",   color: "#ffd700", cx: 510, cy: 260 },
  { id: "PREDICT",  label: "Predict",  color: "#22c55e", cx: 300, cy: 340 },
  { id: "EXECUTE",  label: "Execute",  color: "#ff4757", cx: 90,  cy: 260 },
  { id: "MONITOR",  label: "Monitor",  color: "#8a8578", cx: 90,  cy: 108 },
] as const;

// Node box sizes
const NODE_W = 60;
const NODE_H = 48;

// Hexagon ring + cross connections
const CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
  [0, 3], [1, 4], [2, 5],
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BrainHero({ decisions, pnlTotal }: BrainHeroProps) {
  const phaseCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of decisions) {
      const p = d.phase.toUpperCase();
      counts[p] = (counts[p] ?? 0) + 1;
    }
    return counts;
  }, [decisions]);

  const activePhase = useMemo(() => {
    if (decisions.length === 0) return null;
    const sorted = [...decisions].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return sorted[0].phase.toUpperCase();
  }, [decisions]);

  const totalDecisions = decisions.length;
  const maxCount = Math.max(1, ...Object.values(phaseCounts));

  return (
    <div className="relative w-full overflow-hidden border-2 border-crimson/30 bg-[#080808] mb-6">
      {/* Layer 1: Tactical grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at center, rgba(230,57,70,0.06) 0%, transparent 60%),
            linear-gradient(rgba(230,57,70,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(230,57,70,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "100% 100%, 30px 30px, 30px 30px",
        }}
      />

      {/* Layer 2: Diagonal hatching */}
      <div className="absolute inset-0 p5-stripes pointer-events-none" />

      {/* Layer 3: Floating diamond particles */}
      <Particles intensity={0.3} />

      {/* Single SVG — everything in one coordinate system */}
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="relative w-full max-w-[600px] mx-auto block"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Decorative rings around center */}
        <circle
          cx={CX} cy={CY} r="55"
          fill="none" stroke="#e63946" strokeWidth="0.8" opacity="0.08"
        />
        <circle
          cx={CX} cy={CY} r="110"
          fill="none" stroke="#e63946" strokeWidth="0.8" opacity="0.05"
          strokeDasharray="6 6"
        />
        {/* Crosshair */}
        <line x1={CX - 20} y1={CY} x2={CX + 20} y2={CY} stroke="#e63946" strokeWidth="0.5" opacity="0.1" />
        <line x1={CX} y1={CY - 20} x2={CX} y2={CY + 20} stroke="#e63946" strokeWidth="0.5" opacity="0.1" />

        {/* Connection lines */}
        {CONNECTIONS.map(([from, to], i) => {
          const a = PHASES[from];
          const b = PHASES[to];
          const isActive = activePhase === a.id || activePhase === b.id;

          return (
            <g key={`conn-${i}`}>
              <line
                x1={a.cx} y1={a.cy}
                x2={b.cx} y2={b.cy}
                stroke={isActive ? "#e63946" : "#888"}
                strokeWidth={isActive ? 2.5 : 1.2}
                opacity={isActive ? 0.65 : 0.3}
                strokeDasharray={isActive ? "none" : "6 4"}
              >
                {isActive && (
                  <animate
                    attributeName="opacity"
                    values="0.35;0.65;0.35"
                    dur="2.5s"
                    repeatCount="indefinite"
                  />
                )}
              </line>

              {/* Pulse dot on active lines */}
              {isActive && (
                <circle r="3.5" fill="#ff4757" opacity="0">
                  <animateMotion
                    dur={`${2 + i * 0.3}s`}
                    repeatCount="indefinite"
                    path={`M${a.cx},${a.cy} L${b.cx},${b.cy}`}
                  />
                  <animate
                    attributeName="opacity"
                    values="0;0.9;0"
                    dur={`${2 + i * 0.3}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              )}
            </g>
          );
        })}

        {/* Junction dots at each node center */}
        {PHASES.map((phase) => {
          const isActive = activePhase === phase.id;
          return (
            <circle
              key={`dot-${phase.id}`}
              cx={phase.cx} cy={phase.cy}
              r={isActive ? 4 : 3}
              fill={phase.color}
              opacity={isActive ? 0.9 : 0.6}
            />
          );
        })}

        {/* Phase nodes — foreignObject for HTML content */}
        {PHASES.map((phase) => {
          const count = phaseCounts[phase.id] ?? 0;
          const isActive = activePhase === phase.id;
          const intensity = maxCount > 0 ? count / maxCount : 0;

          return (
            <foreignObject
              key={phase.id}
              x={phase.cx - NODE_W / 2}
              y={phase.cy - NODE_H / 2}
              width={NODE_W}
              height={NODE_H}
              overflow="visible"
            >
              <div
                className={cn(
                  "flex flex-col items-center",
                  isActive && "scale-110"
                )}
                style={{
                  transformOrigin: "center center",
                  transition: "transform 0.3s",
                }}
              >
                {/* P5 angular box */}
                <div
                  style={{
                    transform: "skewX(-3deg)",
                    border: `2px solid ${isActive ? phase.color : phase.color + "55"}`,
                    backgroundColor: `${phase.color}${Math.round(intensity * 25 + 10).toString(16).padStart(2, "0")}`,
                    boxShadow: isActive
                      ? `0 0 10px ${phase.color}44`
                      : `0 0 3px ${phase.color}11`,
                    padding: "1px 8px",
                    lineHeight: 1.2,
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      transform: "skewX(3deg)",
                      color: phase.color,
                      fontSize: "15px",
                      fontWeight: 900,
                      textAlign: "center",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {count}
                  </span>
                </div>
                {/* Label */}
                <span
                  style={{
                    color: phase.color,
                    fontSize: "8px",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    opacity: isActive ? 1 : 0.5,
                    textShadow: isActive ? `0 0 6px ${phase.color}55` : "none",
                    marginTop: "1px",
                  }}
                >
                  {phase.label}
                </span>
              </div>
            </foreignObject>
          );
        })}

        {/* Center mascot */}
        <foreignObject
          x={CX - 60}
          y={CY - 62}
          width={120}
          height={140}
          overflow="visible"
        >
          <div
            style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
          >
            {/* Agent mood mascot */}
            <AgentMood phase={activePhase} pnlTotal={pnlTotal ?? 0} isActive={activePhase !== null} size={90} />
            {/* Decision count badge */}
            <div
              style={{
                background: "#e63946",
                padding: "1px 10px",
                transform: "skewX(-3deg)",
                marginTop: "-6px",
                position: "relative",
                zIndex: 2,
                boxShadow: "3px 3px 0 #0d0d0d",
              }}
            >
              <span
                style={{
                  display: "block",
                  transform: "skewX(3deg)",
                  color: "white",
                  fontSize: "8px",
                  fontWeight: 900,
                  letterSpacing: "0.1em",
                  whiteSpace: "nowrap",
                }}
              >
                {totalDecisions} DECISIONS
              </span>
            </div>
          </div>
        </foreignObject>

        {/* Glow ring behind mascot */}
        <circle
          cx={CX} cy={CY - 15} r="55"
          fill="url(#mascotGlow)" opacity="0.5"
        >
          <animate
            attributeName="opacity"
            values="0.3;0.6;0.3"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
        <defs>
          <radialGradient id="mascotGlow">
            <stop offset="0%" stopColor="#e63946" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#e63946" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>

      {/* Bottom status bar */}
      <div className="relative border-t-2 border-crimson/30 bg-surface/90 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full bg-crimson animate-pulse-glow" />
            <span className="relative inline-flex h-2 w-2 bg-crimson" />
          </span>
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
            Neural State
          </span>
        </div>

        <div className="flex items-center gap-1">
          {PHASES.map((phase) => {
            const count = phaseCounts[phase.id] ?? 0;
            const intensity = maxCount > 0 ? count / maxCount : 0;
            const height = Math.round(intensity * 14 + 4);
            return (
              <div
                key={phase.id}
                className="w-5 sm:w-7 transition-all"
                style={{
                  height: `${height}px`,
                  backgroundColor: phase.color,
                  opacity: 0.3 + intensity * 0.7,
                }}
                title={`${phase.label}: ${count}`}
              />
            );
          })}
        </div>

        <span className="text-[10px] font-bold text-gold uppercase tracking-wider">
          {activePhase ? `Active: ${activePhase}` : "Idle"}
        </span>
      </div>
    </div>
  );
}
