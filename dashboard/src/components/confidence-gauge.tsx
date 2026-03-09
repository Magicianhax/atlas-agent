"use client";

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConfidenceGaugeProps {
  confidence: number;
  label?: string;
  size?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function arcColor(value: number): string {
  if (value < 40) return "#e63946";
  if (value < 70) return "#ffd700";
  return "#22c55e";
}

function glowFilter(value: number): string {
  if (value < 40) return "drop-shadow(0 0 4px #e6394688)";
  if (value < 70) return "drop-shadow(0 0 4px #ffd70088)";
  return "drop-shadow(0 0 4px #22c55e88)";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConfidenceGauge({
  confidence,
  label = "CONFIDENCE",
  size = 120,
}: ConfidenceGaugeProps) {
  const clamped = Math.max(0, Math.min(100, confidence));
  const color = arcColor(clamped);
  const glow = glowFilter(clamped);

  // SVG circle math
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  // Center position
  const center = size / 2;

  return (
    <div
      className="inline-flex flex-col items-center gap-1.5"
      style={{ width: size }}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="gauge-svg"
          style={{ filter: glow }}
        >
          {/* Background arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#2a2a2a"
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
          />

          {/* Foreground arc — animated */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="gauge-arc"
            transform={`rotate(-90 ${center} ${center})`}
            style={
              {
                "--gauge-offset": offset,
                "--gauge-circumference": circumference,
              } as React.CSSProperties
            }
          />

          {/* Tick marks at 25%, 50%, 75% — angular feel */}
          {[25, 50, 75].map((pct) => {
            const angle = (pct / 100) * 360 - 90;
            const rad = (angle * Math.PI) / 180;
            const innerR = radius - strokeWidth / 2 - 1;
            const outerR = radius + strokeWidth / 2 + 1;
            return (
              <line
                key={pct}
                x1={center + innerR * Math.cos(rad)}
                y1={center + innerR * Math.sin(rad)}
                x2={center + outerR * Math.cos(rad)}
                y2={center + outerR * Math.sin(rad)}
                stroke="#0d0d0d"
                strokeWidth={1.5}
              />
            );
          })}
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-black tabular-nums leading-none gauge-number"
            style={{
              fontSize: size * 0.28,
              color,
            }}
          >
            {Math.round(clamped)}
          </span>
          <span
            className="text-text-muted font-bold uppercase"
            style={{ fontSize: Math.max(7, size * 0.07), letterSpacing: "0.1em" }}
          >
            %
          </span>
        </div>
      </div>

      {/* Label — P5 skewed badge */}
      <div
        className={cn(
          "px-2.5 py-0.5 skew-x-[-3deg] border border-border",
          "shadow-[2px_2px_0_#0d0d0d] bg-surface"
        )}
      >
        <span className="skew-x-[3deg] text-[9px] font-black uppercase tracking-[0.2em] text-text-muted block">
          {label}
        </span>
      </div>

      <style jsx>{`
        @keyframes gauge-fill {
          0% {
            stroke-dashoffset: var(--gauge-circumference);
          }
          100% {
            stroke-dashoffset: var(--gauge-offset);
          }
        }
        .gauge-arc {
          animation: gauge-fill 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
          transition: stroke-dashoffset 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94),
            stroke 0.4s ease;
        }
        @keyframes number-pop {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          60% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .gauge-number {
          animation: number-pop 0.5s ease-out 0.4s both;
        }
      `}</style>
    </div>
  );
}
