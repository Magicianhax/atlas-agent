"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AgentMoodProps {
  phase: string | null;
  pnlTotal: number;
  isActive: boolean;
  size?: number;
}

// ---------------------------------------------------------------------------
// State derivation
// ---------------------------------------------------------------------------

type MoodState = "STANDBY" | "SCANNING" | "ANALYZING" | "EXECUTING" | "MONITORING";

function deriveMood(phase: string | null, isActive: boolean): MoodState {
  if (!isActive || !phase) return "STANDBY";
  const upper = phase.toUpperCase();
  if (upper === "RESEARCH" || upper === "ORIENT") return "SCANNING";
  if (upper === "THESIS" || upper === "PREDICT") return "ANALYZING";
  if (upper === "EXECUTE") return "EXECUTING";
  if (upper === "MONITOR") return "MONITORING";
  return "STANDBY";
}

const MOOD_CONFIG: Record<
  MoodState,
  {
    filter: string;
    auraColor: string;
    auraShadow: string;
    labelBg: string;
    labelText: string;
    scale: string;
    pulse: boolean;
  }
> = {
  STANDBY: {
    filter: "grayscale(0.3) brightness(0.7)",
    auraColor: "transparent",
    auraShadow: "none",
    labelBg: "bg-border",
    labelText: "text-text-muted",
    scale: "scale-100",
    pulse: false,
  },
  SCANNING: {
    filter: "grayscale(0) brightness(1)",
    auraColor: "#4a9eff",
    auraShadow: "0 0 20px #4a9eff55, 0 0 40px #4a9eff22",
    labelBg: "bg-phase-research/20",
    labelText: "text-phase-research",
    scale: "scale-100",
    pulse: false,
  },
  ANALYZING: {
    filter: "grayscale(0) brightness(1.05)",
    auraColor: "#ffd700",
    auraShadow: "0 0 20px #ffd70055, 0 0 40px #ffd70022",
    labelBg: "bg-gold/20",
    labelText: "text-gold",
    scale: "scale-100",
    pulse: false,
  },
  EXECUTING: {
    filter: "grayscale(0) brightness(1.1) contrast(1.05)",
    auraColor: "#e63946",
    auraShadow: "0 0 24px #e6394688, 0 0 48px #ff475744, 0 0 8px #e6394666",
    labelBg: "bg-crimson/20",
    labelText: "text-crimson-glow",
    scale: "scale-105",
    pulse: true,
  },
  MONITORING: {
    filter: "grayscale(0) brightness(1)",
    auraColor: "#22c55e",
    auraShadow: "0 0 20px #22c55e55, 0 0 40px #22c55e22",
    labelBg: "bg-phase-predict/20",
    labelText: "text-phase-predict",
    scale: "scale-100",
    pulse: false,
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AgentMood({
  phase,
  pnlTotal,
  isActive,
  size = 96,
}: AgentMoodProps) {
  const mood = deriveMood(phase, isActive);
  const config = MOOD_CONFIG[mood];

  const pnlPositive = pnlTotal > 0;
  const pnlNegative = pnlTotal < 0;

  return (
    <div
      className="relative inline-flex flex-col items-center gap-2"
      style={{ width: size }}
    >
      {/* Mascot container */}
      <div
        className={cn(
          "relative overflow-hidden transition-all duration-500 ease-out",
          config.scale
        )}
        style={{
          width: size,
          height: size,
          boxShadow: config.auraShadow,
        }}
      >
        {/* Aura border */}
        <div
          className="absolute inset-0 z-10 pointer-events-none transition-all duration-500"
          style={{
            border: `2px solid ${config.auraColor}`,
            boxShadow:
              config.auraColor !== "transparent"
                ? `inset 0 0 12px ${config.auraColor}33`
                : "none",
          }}
        />

        {/* Executing pulse overlay */}
        {config.pulse && (
          <div
            className="absolute inset-0 z-20 pointer-events-none mood-exec-pulse"
            style={{
              border: "2px solid #ff475766",
            }}
          />
        )}

        {/* PnL positive: golden particles (CSS) */}
        {pnlPositive && (
          <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
            <div className="mood-particle mood-particle-1" />
            <div className="mood-particle mood-particle-2" />
            <div className="mood-particle mood-particle-3" />
            <div className="mood-particle mood-particle-4" />
            <div className="mood-particle mood-particle-5" />
          </div>
        )}

        {/* PnL negative: red vignette */}
        {pnlNegative && (
          <div
            className="absolute inset-0 z-30 pointer-events-none transition-opacity duration-500"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 40%, #e6394622 100%)",
            }}
          />
        )}

        {/* Mascot image */}
        <Image
          src="/assets/mascot-thinking.png"
          alt="ATLAS Agent"
          width={size}
          height={size}
          className="object-cover transition-[filter] duration-500"
          style={{ filter: config.filter }}
        />
      </div>

      {/* Status label — P5 skewed badge */}
      <div
        className={cn(
          "flex items-center justify-center px-3 py-1",
          "skew-x-[-3deg] border-2 transition-all duration-500",
          "shadow-[2px_2px_0_#0d0d0d]",
          config.labelBg,
          config.pulse
            ? "border-crimson/60"
            : config.auraColor !== "transparent"
              ? "border-current/30"
              : "border-border"
        )}
        style={{
          borderColor:
            config.auraColor !== "transparent"
              ? `${config.auraColor}66`
              : undefined,
        }}
      >
        <span
          className={cn(
            "skew-x-[3deg] text-[10px] font-black uppercase tracking-[0.2em]",
            config.labelText,
            config.pulse && "mood-label-pulse"
          )}
        >
          {mood}
        </span>
      </div>

      {/* Scoped styles */}
      <style jsx>{`
        @keyframes exec-pulse {
          0%,
          100% {
            box-shadow: inset 0 0 8px #e6394633;
            opacity: 0.6;
          }
          50% {
            box-shadow: inset 0 0 20px #e6394666, 0 0 12px #ff475744;
            opacity: 1;
          }
        }
        .mood-exec-pulse {
          animation: exec-pulse 1.5s ease-in-out infinite;
        }

        @keyframes label-pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
        .mood-label-pulse {
          animation: label-pulse 1.5s ease-in-out infinite;
        }

        @keyframes particle-float {
          0% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100%) translateX(10px) scale(0.3);
            opacity: 0;
          }
        }

        .mood-particle {
          position: absolute;
          width: 3px;
          height: 3px;
          background: #ffd700;
          box-shadow: 0 0 4px #ffd700aa;
        }
        .mood-particle-1 {
          left: 20%;
          bottom: 10%;
          animation: particle-float 2.5s ease-out infinite;
          animation-delay: 0s;
        }
        .mood-particle-2 {
          left: 50%;
          bottom: 5%;
          animation: particle-float 3s ease-out infinite;
          animation-delay: 0.5s;
        }
        .mood-particle-3 {
          left: 75%;
          bottom: 15%;
          animation: particle-float 2.8s ease-out infinite;
          animation-delay: 1s;
        }
        .mood-particle-4 {
          left: 35%;
          bottom: 20%;
          animation: particle-float 3.2s ease-out infinite;
          animation-delay: 1.5s;
        }
        .mood-particle-5 {
          left: 60%;
          bottom: 8%;
          animation: particle-float 2.6s ease-out infinite;
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}
